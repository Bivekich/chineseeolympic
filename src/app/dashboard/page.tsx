"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChineseLoader from "@/components/ChineseLoader";
import Image from "next/image";

interface Olympiad {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  level: string;
  isCompleted: boolean;
  isDraft: boolean;
  hasQuestions: boolean;
  hasPrizes: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [createdOlympiads, setCreatedOlympiads] = useState<Olympiad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch("/api/auth/admin");
        if (response.ok) {
          const data = await response.json();
          if (data.isAdmin) {
            setIsAdmin(true);
            const createdResponse = await fetch("/api/olympiads/created");
            if (createdResponse.ok) {
              const createdData = await createdResponse.json();
              setCreatedOlympiads(createdData);
            }
          }
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Начальный":
        return "text-green-400";
      case "Средний":
        return "text-yellow-400";
      case "Продвинутый":
        return "text-red-400";
      default:
        return "text-gray-400";
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
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete olympiad");
      }

      // Refresh the list
      const createdResponse = await fetch("/api/olympiads/created");
      if (createdResponse.ok) {
        const createdData = await createdResponse.json();
        setCreatedOlympiads(createdData);
      }
    } catch (error) {
      console.error("Error deleting olympiad:", error);
      alert(error instanceof Error ? error.message : "Ошибка при удалении олимпиады");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <ChineseLoader text="Загрузка..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.04]">
        <Image
          src="/chinese-pattern.png"
          alt="Chinese Pattern"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="relative z-10 p-8 mt-[80px] md:mt-[100px]">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                <span className="text-red-200">汉语</span>
                <span>Личный кабинет</span>
              </h1>
              <p className="mt-2 text-red-200/80">
                {isAdmin ? "Управление олимпиадами" : "Добро пожаловать"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-red-200 bg-red-950/50 border border-red-200/20 rounded-lg hover:bg-red-900/50 transition-colors"
            >
              Выйти
            </button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => router.push("/olympiads")}
              className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-red-200/10 hover:bg-white/10 transition-all text-left"
            >
              <h3 className="text-lg font-semibold text-white mb-2">
                Доступные олимпиады
              </h3>
              <p className="text-red-200/80">
                Просмотр и участие в текущих олимпиадах
              </p>
            </button>
            <button
              onClick={() => router.push("/tests")}
              className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-red-200/10 hover:bg-white/10 transition-all text-left"
            >
              <h3 className="text-lg font-semibold text-white mb-2">
                Мои олимпиады
              </h3>
              <p className="text-red-200/80">
                История участия и результаты
              </p>
            </button>
          </div>

          {/* Created Olympiads (Admin Only) */}
          {isAdmin && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-white">
                  Созданные олимпиады
                </h2>
                <button
                  onClick={() => router.push("/olympiads/create")}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Создать олимпиаду
                </button>
              </div>

              <div className="grid gap-4">
                {createdOlympiads.map((olympiad) => (
                  <div
                    key={olympiad.id}
                    className="bg-white/5 backdrop-blur-sm rounded-xl border border-red-200/10 p-6"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {olympiad.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-red-200/80">
                          <span className={`font-medium ${getLevelColor(olympiad.level)}`}>
                            {olympiad.level}
                          </span>
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(olympiad.startDate).toLocaleDateString()}
                          </span>
                          {olympiad.isDraft ? (
                            <span className="text-yellow-400">Черновик</span>
                          ) : olympiad.isCompleted ? (
                            <span className="text-green-400">Завершена</span>
                          ) : (
                            <span className="text-blue-400">Активна</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {olympiad.isDraft ? (
                          <>
                            <button
                              onClick={() => router.push(`/olympiads/${olympiad.id}/edit`)}
                              className="px-3 py-1 text-sm font-medium text-red-200 bg-red-950/50 border border-red-200/20 rounded-lg hover:bg-red-900/50 transition-colors"
                            >
                              Редактировать
                            </button>
                            {!olympiad.hasQuestions && (
                              <button
                                onClick={() => router.push(`/olympiads/${olympiad.id}/questions`)}
                                className="px-3 py-1 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-600 transition-colors"
                              >
                                Добавить вопросы
                              </button>
                            )}
                            {olympiad.hasQuestions && !olympiad.hasPrizes && (
                              <button
                                onClick={() => router.push(`/olympiads/${olympiad.id}/prizes`)}
                                className="px-3 py-1 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-600 transition-colors"
                              >
                                Добавить призы
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => router.push(`/olympiads/${olympiad.id}/manage`)}
                            className="px-3 py-1 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Управление
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteOlympiad(olympiad.id)}
                          disabled={isDeleting}
                          className="p-1 text-red-200/80 hover:text-red-200 disabled:opacity-50"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {createdOlympiads.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-red-200/80">
                      У вас пока нет созданных олимпиад
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
