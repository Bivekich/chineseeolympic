"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Olympiad {
  id: string;
  title: string;
  level: string;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
}

export default function OlympiadsPage() {
  const router = useRouter();
  const [olympiads, setOlympiads] = useState<Olympiad[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOlympiads = async () => {
      try {
        const response = await fetch("/api/olympiads/available");
        if (!response.ok) {
          throw new Error("Failed to fetch olympiads");
        }
        const data = await response.json();
        setOlympiads(data);
      } catch (error) {
        console.error("Error fetching olympiads:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOlympiads();
  }, []);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Начальный":
        return "bg-emerald-100 text-emerald-800";
      case "Средний":
        return "bg-amber-100 text-amber-800";
      case "Продвинутый":
        return "bg-rose-100 text-rose-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900">
        <div className="p-8 mt-[80px] md:mt-[100px]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <p className="text-red-200/80">Загрузка олимпиад...</p>
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
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <span className="text-red-200">汉语</span>
              <span>Доступные олимпиады</span>
            </h1>
            <p className="mt-2 text-red-200/80">
              Выберите олимпиаду для участия
            </p>
          </div>

          <div className="grid gap-6">
            {olympiads.map((olympiad) => (
              <div
                key={olympiad.id}
                className="bg-white/5 backdrop-blur-sm rounded-xl border border-red-200/10 p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {olympiad.title}
                      </h3>
                    </div>
                    <div className="text-white/90 text-xl">
                      Уровень - {olympiad.level}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-red-100">
                    <div className="flex items-center gap-2 text-lg">
                      <svg
                        className="w-6 h-6"
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
                        {new Date(olympiad.startDate).toLocaleDateString()} -{" "}
                        {new Date(olympiad.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-red-200/10">
                    <button
                      onClick={() =>
                        router.push(`/olympiads/${olympiad.id}/participate`)
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
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Участвовать
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {olympiads.length === 0 && (
              <div className="text-center py-12">
                <p className="text-red-200/80">
                  На данный момент нет доступных олимпиад
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
