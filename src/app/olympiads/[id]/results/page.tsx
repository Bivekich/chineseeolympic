"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChineseLoader from "@/components/ChineseLoader";

interface Result {
  id: string;
  score: string;
  completedAt: string;
  olympiad: {
    title: string;
    level: string;
  };
}

export default function ResultsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [result, setResult] = useState<Result | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await fetch(`/api/olympiads/${params.id}/result`);
        if (!response.ok) {
          throw new Error("Failed to fetch result");
        }
        const data = await response.json();
        setResult(data);
      } catch (error) {
        console.error("Error fetching result:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResult();
  }, [params.id]);

  if (isLoading) {
    return <ChineseLoader text="Загрузка результатов..." />;
  }

  if (!result) {
    return <ChineseLoader text="Результаты не найдены" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900">
      <div className="p-8 mt-[80px] md:mt-[100px]">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <span className="text-red-200">汉语</span>
              <span>Результаты олимпиады</span>
            </h1>
            <p className="mt-2 text-red-200/80">{result.olympiad.title}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-red-200/10 p-8">
            <div className="space-y-8">
              <div className="text-center">
                <div className="text-6xl font-bold text-white mb-2">
                  {result.score}%
                </div>
                <p className="text-red-200/80">Ваш результат</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 bg-white/10 rounded-lg">
                  <p className="text-sm text-red-200/80 mb-1">Уровень</p>
                  <p className="text-lg text-white">{result.olympiad.level}</p>
                </div>
                <div className="p-4 bg-white/10 rounded-lg">
                  <p className="text-sm text-red-200/80 mb-1">
                    Дата прохождения
                  </p>
                  <p className="text-lg text-white">
                    {new Date(result.completedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex justify-center pt-6">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-6 py-3 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-800 focus:ring-red-500 transition-colors"
                >
                  Вернуться на главную
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
