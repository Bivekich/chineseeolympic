"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChineseLoader from "@/components/ChineseLoader";
import Image from "next/image";

interface ParticipatedOlympiad {
  id: string;
  score: string;
  olympiad: {
    id: string;
    title: string;
    level: string;
    startDate: string;
    endDate: string;
    isCompleted: boolean;
  };
}

export default function TestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<ParticipatedOlympiad[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await fetch("/api/olympiads/participated");
        if (!response.ok) {
          throw new Error("Failed to fetch tests");
        }
        const data = await response.json();
        setTests(data);
      } catch (error) {
        console.error("Error fetching tests:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTests();
  }, []);

  if (isLoading) {
    return <ChineseLoader text="Загрузка результатов..." />;
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
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                  <span className="text-red-200">汉语</span>
                  <span>Мои олимпиады</span>
                </h1>
                <p className="mt-2 text-red-200/80">
                  История участия в олимпиадах
                </p>
              </div>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2 text-sm font-medium text-red-200 bg-red-950/50 border border-red-200/20 rounded-lg hover:bg-red-900/50 transition-colors"
              >
                Вернуться
              </button>
            </div>
          </div>

          <div className="grid gap-6">
            {tests.map((test) => (
              <div
                key={test.id}
                className="bg-white/5 backdrop-blur-sm rounded-xl border border-red-200/10 p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {test.olympiad.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-red-200/80">
                      <span className="px-3 py-1 text-sm rounded-lg bg-red-700/50">
                        {test.olympiad.level}
                      </span>
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(test.olympiad.startDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Результат: {test.score}%
                      </span>
                      {test.olympiad.isCompleted && (
                        <span className="text-green-400">Завершена</span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => router.push(`/olympiads/${test.olympiad.id}/results`)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Подробнее
                  </button>
                </div>
              </div>
            ))}
            {tests.length === 0 && (
              <div className="text-center py-12">
                <p className="text-red-200/80">
                  Вы еще не участвовали в олимпиадах
                </p>
                <button
                  onClick={() => router.push("/olympiads")}
                  className="mt-4 px-6 py-3 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Найти олимпиаду
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 