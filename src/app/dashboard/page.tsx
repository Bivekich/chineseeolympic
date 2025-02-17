"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { verifyAdmin } from "@/lib/auth";

interface Olympiad {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  level: string;
  isCompleted: boolean;
  isDraft: boolean;
  hasQuestions: boolean;
  hasPrizes: boolean;
}

interface ParticipantResult {
  id: string;
  olympiadId: string;
  score: string;
  completedAt: string;
  olympiad: Olympiad;
}

export default function DashboardPage() {
  const router = useRouter();
  const [createdOlympiads, setCreatedOlympiads] = useState<Olympiad[]>([]);
  const [participatedOlympiads, setParticipatedOlympiads] = useState<
    ParticipantResult[]
  >([]);
  const [availableOlympiads, setAvailableOlympiads] = useState<Olympiad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const adminStatus = await fetch("/api/auth/admin").then((res) =>
        res.json()
      );
      setIsAdmin(adminStatus.isAdmin);
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responses = await Promise.all([
          fetch("/api/olympiads/participated"),
          fetch("/api/olympiads/available"),
          isAdmin ? fetch("/api/olympiads/created") : Promise.resolve(null),
        ]);

        const [participatedResponse, availableResponse, createdResponse] =
          responses;

        if (participatedResponse.ok) {
          const participatedData = await participatedResponse.json();
          setParticipatedOlympiads(participatedData);
        }

        if (availableResponse.ok) {
          const availableData = await availableResponse.json();
          setAvailableOlympiads(availableData);
        }

        if (createdResponse?.ok) {
          const createdData = await createdResponse.json();
          setCreatedOlympiads(createdData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Начальный":
        return "bg-emerald-900 text-emerald-100 px-3 py-1 rounded-lg text-sm";
      case "Средний":
        return "bg-amber-900 text-amber-100 px-3 py-1 rounded-lg text-sm";
      case "Продвинутый":
        return "bg-rose-900 text-rose-100 px-3 py-1 rounded-lg text-sm";
      default:
        return "bg-gray-900 text-gray-100 px-3 py-1 rounded-lg text-sm";
    }
  };

  const handleDeleteOlympiad = async (olympiadId: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту олимпиаду?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/olympiads/${olympiadId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete olympiad");
      }

      // Refresh the list
      const createdResponse = await fetch("/api/olympiads/created");
      if (createdResponse.ok) {
        const createdData = await createdResponse.json();
        setCreatedOlympiads(createdData);
      }
    } catch (error) {
      console.error("Error deleting olympiad:", error);
      alert("Ошибка при удалении олимпиады");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900">
        <div className="p-8 mt-[80px] md:mt-[100px]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <p className="text-red-200/80">Загрузка...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900">
      <div className="p-8 mt-[80px] md:mt-[100px]">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                <span className="text-red-200">汉语</span>
                <span>Личный кабинет</span>
              </h1>
              <p className="mt-2 text-red-200/80">
                {isAdmin ? "Управление олимпиадами" : "Участие в олимпиадах"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {isAdmin && (
                <button
                  onClick={() => router.push("/olympiads/create")}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Создать олимпиаду
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-red-200 bg-red-950/50 border border-red-200/20 rounded-lg hover:bg-red-900/50 transition-colors"
              >
                Выйти
              </button>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div
              onClick={() => router.push("/olympiads")}
              className="group cursor-pointer bg-red-950/50 backdrop-blur-sm rounded-2xl border border-red-200/20 p-6 hover:bg-red-900/50 transition-all shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-700/50 rounded-xl group-hover:bg-red-700 transition-colors">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Участвовать в олимпиаде
                  </h3>
                  <p className="text-red-200/80 text-sm">
                    Присоединитесь к доступным олимпиадам и проверьте свои
                    знания
                  </p>
                </div>
              </div>
            </div>

            {isAdmin && (
              <div
                onClick={() => router.push("/olympiads/create")}
                className="group cursor-pointer bg-red-950/50 backdrop-blur-sm rounded-2xl border border-red-200/20 p-6 hover:bg-red-900/50 transition-all shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-700/50 rounded-xl group-hover:bg-red-700 transition-colors">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Создать олимпиаду
                    </h3>
                    <p className="text-red-200/80 text-sm">
                      Создайте новую олимпиаду и настройте вопросы
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="space-y-4">
            {/* Available Olympiads Section */}
            <div className="bg-red-950/50 backdrop-blur-sm rounded-xl border border-red-200/20 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Доступные олимпиады
              </h2>
              <div className="grid gap-4">
                {availableOlympiads.length > 0 ? (
                  availableOlympiads.map((olympiad) => (
                    <div
                      key={olympiad.id}
                      className="bg-red-950/50 backdrop-blur-sm rounded-xl border border-red-200/20 p-4"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <span className={getLevelColor(olympiad.level)}>
                            {olympiad.level}
                          </span>
                          <div>
                            <h3 className="text-lg font-medium text-white">
                              {olympiad.title}
                            </h3>
                            <div className="text-sm text-red-200/80 mt-1">
                              {new Date(
                                olympiad.startDate
                              ).toLocaleDateString()}{" "}
                              -{" "}
                              {new Date(olympiad.endDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              router.push(
                                `/olympiads/${olympiad.id}/participate`
                              )
                            }
                            className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Участвовать
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-red-200/80">
                    На данный момент нет доступных олимпиад
                  </p>
                )}
              </div>
            </div>

            {/* Participated Olympiads Section */}
            <div className="bg-red-950/50 backdrop-blur-sm rounded-xl border border-red-200/20 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Пройденные олимпиады
              </h2>
              <div className="grid gap-4">
                {participatedOlympiads.length > 0 ? (
                  participatedOlympiads.map((result) => (
                    <div
                      key={result.id}
                      className="bg-red-950/50 backdrop-blur-sm rounded-xl border border-red-200/20 p-4"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <span
                            className={getLevelColor(result.olympiad.level)}
                          >
                            {result.olympiad.level}
                          </span>
                          <div>
                            <h3 className="text-lg font-medium text-white">
                              {result.olympiad.title}
                            </h3>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm text-red-200/80">
                                Пройдено:{" "}
                                {new Date(result.completedAt).toLocaleString()}
                              </span>
                              <span className="text-sm text-white bg-red-700/50 px-3 py-1 rounded-lg">
                                Результат: {result.score}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-red-200/80">
                    Вы еще не участвовали в олимпиадах
                  </p>
                )}
              </div>
            </div>

            {/* Admin Section - Created Olympiads */}
            {isAdmin && (
              <div className="bg-red-950/50 backdrop-blur-sm rounded-xl border border-red-200/20 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Созданные олимпиады
                </h2>
                <div className="grid gap-4">
                  {createdOlympiads.length > 0 ? (
                    createdOlympiads.map((olympiad) => (
                      <div
                        key={olympiad.id}
                        className="bg-red-950/50 backdrop-blur-sm rounded-xl border border-red-200/20 p-4"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <span className={getLevelColor(olympiad.level)}>
                              {olympiad.level}
                            </span>
                            <div>
                              <h3 className="text-lg font-medium text-white">
                                {olympiad.title}
                              </h3>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm text-red-200/80">
                                  {new Date(
                                    olympiad.startDate
                                  ).toLocaleDateString()}{" "}
                                  -{" "}
                                  {new Date(
                                    olympiad.endDate
                                  ).toLocaleDateString()}
                                </span>
                                {olympiad.isDraft && (
                                  <span className="text-sm text-yellow-200 bg-yellow-900/50 px-2 py-1 rounded">
                                    Черновик
                                  </span>
                                )}
                                {olympiad.isCompleted && (
                                  <span className="text-sm text-green-200 bg-green-900/50 px-2 py-1 rounded">
                                    Завершена
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                router.push(`/olympiads/${olympiad.id}/edit`)
                              }
                              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
                            >
                              Редактировать
                            </button>
                            {!olympiad.isCompleted && (
                              <>
                                <button
                                  onClick={() =>
                                    router.push(
                                      `/olympiads/${olympiad.id}/manage`
                                    )
                                  }
                                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-500 transition-colors"
                                >
                                  Управление
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteOlympiad(olympiad.id)
                                  }
                                  disabled={isDeleting}
                                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50"
                                >
                                  {isDeleting ? "Удаление..." : "Удалить"}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-red-200/80">
                      У вас пока нет созданных олимпиад
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
