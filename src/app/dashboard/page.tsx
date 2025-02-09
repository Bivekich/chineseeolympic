"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

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
  const [activeTab, setActiveTab] = useState<"created" | "participated">(
    "created"
  );
  const [createdOlympiads, setCreatedOlympiads] = useState<Olympiad[]>([]);
  const [participatedOlympiads, setParticipatedOlympiads] = useState<
    ParticipantResult[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [createdResponse, participatedResponse] = await Promise.all([
          fetch("/api/olympiads/created"),
          fetch("/api/olympiads/participated"),
        ]);

        if (!createdResponse.ok) {
          throw new Error("Failed to fetch created olympiads");
        }
        if (!participatedResponse.ok) {
          throw new Error("Failed to fetch participated olympiads");
        }

        const createdData = await createdResponse.json();
        const participatedData = await participatedResponse.json();

        console.log("Created olympiads:", createdData); // Debug log
        setCreatedOlympiads(createdData);
        setParticipatedOlympiads(participatedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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
        return "bg-emerald-900/50 text-emerald-200 border border-emerald-500/20";
      case "Средний":
        return "bg-amber-900/50 text-amber-200 border border-amber-500/20";
      case "Продвинутый":
        return "bg-rose-900/50 text-rose-200 border border-rose-500/20";
      default:
        return "bg-gray-900/50 text-gray-200 border border-gray-500/20";
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
                Управление олимпиадами и результатами
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-3 text-sm font-medium text-red-200 bg-red-950/50 border-2 border-red-200/20 rounded-lg hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-800 focus:ring-red-500 transform transition hover:-translate-y-0.5"
            >
              Выйти
            </button>
          </div>

          {/* Quick Actions Section */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
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
                    Создайте новую олимпиаду и настройте вопросы и призы
                  </p>
                </div>
              </div>
            </div>

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
          </div>

          <div className="bg-red-950/50 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-red-200/20">
            <div className="border-b border-red-200/20">
              <div className="flex p-4">
                <button
                  className={`px-6 py-3 text-sm font-medium rounded-lg transition-all ${
                    activeTab === "created"
                      ? "bg-red-700 text-white shadow-lg"
                      : "text-red-200 hover:bg-red-900/50"
                  }`}
                  onClick={() => setActiveTab("created")}
                >
                  Созданные олимпиады
                </button>
                <button
                  className={`px-6 py-3 text-sm font-medium rounded-lg ml-4 transition-all ${
                    activeTab === "participated"
                      ? "bg-red-700 text-white shadow-lg"
                      : "text-red-200 hover:bg-red-900/50"
                  }`}
                  onClick={() => setActiveTab("participated")}
                >
                  Пройденные олимпиады
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === "created" ? (
                <div className="grid gap-6">
                  {createdOlympiads.map((olympiad) => (
                    <div
                      key={olympiad.id}
                      className="bg-red-950/50 backdrop-blur-sm rounded-xl border border-red-200/20 p-6 hover:bg-red-900/50 transition-all shadow-lg hover:shadow-xl"
                    >
                      <div className="flex flex-col gap-4">
                        {/* Header with Title and Status */}
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-semibold text-white">
                              {olympiad.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-2">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${getLevelColor(
                                  olympiad.level
                                )}`}
                              >
                                {olympiad.level}
                              </span>
                              {olympiad.isDraft && (
                                <span className="inline-flex items-center px-3 py-1 bg-yellow-900/50 text-yellow-200 border border-yellow-500/20 rounded-lg text-sm font-medium">
                                  Черновик
                                </span>
                              )}
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${
                                  olympiad.isCompleted
                                    ? "bg-gray-900/50 text-gray-200 border border-gray-500/20"
                                    : "bg-green-900/50 text-green-200 border border-green-500/20"
                                }`}
                              >
                                {olympiad.isCompleted ? "Завершена" : "Активна"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Info Section */}
                        <div className="flex items-center gap-6 text-sm text-red-200/80">
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span>
                              {new Date(
                                olympiad.startDate
                              ).toLocaleDateString()}{" "}
                              -{" "}
                              {new Date(olympiad.endDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                            <span>
                              {olympiad.hasQuestions
                                ? "Вопросы добавлены"
                                : "Нет вопросов"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                              />
                            </svg>
                            <span>
                              {olympiad.hasPrizes
                                ? "Призы настроены"
                                : "Нет призов"}
                            </span>
                          </div>
                        </div>

                        {/* Actions Section */}
                        <div className="flex items-center gap-3 pt-4 border-t border-red-200/10">
                          {olympiad.isDraft ? (
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() =>
                                  router.push(
                                    `/olympiads/${olympiad.id}/questions`
                                  )
                                }
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-800 focus:ring-red-500 transition-colors"
                              >
                                <svg
                                  className="w-4 h-4 mr-2"
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
                                Продолжить создание
                              </button>
                              <button
                                onClick={() =>
                                  router.push(`/olympiads/${olympiad.id}/edit`)
                                }
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-200 border border-red-200/20 rounded-lg hover:bg-red-700/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-800 focus:ring-red-500 transition-colors"
                              >
                                <svg
                                  className="w-4 h-4 mr-2"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                                Редактировать
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteOlympiad(olympiad.id)
                                }
                                disabled={isDeleting}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-200 border border-red-200/20 rounded-lg hover:bg-red-700/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-800 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <svg
                                  className="w-4 h-4 mr-2"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                {isDeleting ? "Удаление..." : "Удалить"}
                              </button>
                            </div>
                          ) : !olympiad.isCompleted ? (
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() =>
                                  router.push(
                                    `/olympiads/${olympiad.id}/manage`
                                  )
                                }
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-800 focus:ring-red-500 transition-colors"
                              >
                                <svg
                                  className="w-4 h-4 mr-2"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                Управление
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteOlympiad(olympiad.id)
                                }
                                disabled={isDeleting}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-200 border border-red-200/20 rounded-lg hover:bg-red-700/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-800 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <svg
                                  className="w-4 h-4 mr-2"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                {isDeleting ? "Удаление..." : "Удалить"}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                router.push(`/olympiads/${olympiad.id}/results`)
                              }
                              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-800 focus:ring-green-500 transition-colors"
                            >
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                              </svg>
                              Результаты
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {createdOlympiads.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-red-200/80">
                        У вас пока нет созданных олимпиад
                      </p>
                      <button
                        onClick={() => router.push("/olympiads/create")}
                        className="mt-4 px-6 py-3 text-sm font-medium text-red-200 bg-red-950/50 border-2 border-red-200/20 rounded-lg hover:bg-red-900/50 transition-colors shadow-lg"
                      >
                        Создать первую олимпиаду
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid gap-6">
                  {participatedOlympiads.map((result) => (
                    <div
                      key={result.id}
                      className="bg-red-950/50 backdrop-blur-sm rounded-xl border border-red-200/20 p-6 hover:bg-red-900/50 transition-all shadow-lg hover:shadow-xl"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-semibold text-white mb-2">
                            {result.olympiad.title}
                          </h3>
                          <p className="text-red-200/80 text-sm">
                            Дата прохождения:{" "}
                            {new Date(result.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="px-4 py-2 bg-red-700/50 text-white rounded-lg text-lg font-semibold">
                            Балл: {result.score}
                          </span>
                          <button
                            onClick={() =>
                              router.push(
                                `/olympiads/${result.olympiadId}/results`
                              )
                            }
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-200 border border-red-200/20 rounded-lg hover:bg-red-700/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-800 focus:ring-red-500 transition-colors"
                          >
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                              />
                            </svg>
                            Результаты
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {participatedOlympiads.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-red-200/80">
                        Вы еще не участвовали в олимпиадах
                      </p>
                      <button
                        onClick={() => router.push("/olympiads")}
                        className="mt-4 px-6 py-3 text-sm font-medium text-red-200 bg-red-950/50 border-2 border-red-200/20 rounded-lg hover:bg-red-900/50 transition-colors shadow-lg"
                      >
                        Найти олимпиаду
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
