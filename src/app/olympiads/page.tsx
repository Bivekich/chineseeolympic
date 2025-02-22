"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChineseLoader from "@/components/ChineseLoader";
import Image from "next/image";

interface Olympiad {
  id: string;
  title: string;
  description: string | null;
  level: string;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
  price: number | null;
  questionsPerParticipant: number | null;
  prizes: string | null;
}

interface ModalProps {
  olympiad: Olympiad;
  onClose: () => void;
  onParticipate: () => void;
}

const OlympiadModal = ({ olympiad, onClose, onParticipate }: ModalProps) => (
  <div 
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
    onClick={onClose}
  >
    <div 
      className="bg-gradient-to-br from-red-900 to-red-800 rounded-xl border border-red-200/20 p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white pr-4">{olympiad.title}</h2>
        <button
          onClick={onClose}
          className="text-red-200 hover:text-white transition-colors flex-shrink-0"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 text-sm rounded-lg bg-red-700/50 text-white">
            {olympiad.level}
          </span>
        </div>

        {olympiad.description && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-white mb-2">Описание</h3>
            <p className="text-red-200/90 text-sm sm:text-base">{olympiad.description}</p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Стоимость участия</h3>
            <p className="text-red-200/90 text-sm sm:text-base">
              {olympiad.price ? `${(olympiad.price / 100).toFixed(2)} ₽` : 'Бесплатно'}
            </p>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Количество вопросов</h3>
            <p className="text-red-200/90 text-sm sm:text-base">
              {olympiad.questionsPerParticipant 
                ? `${olympiad.questionsPerParticipant} вопросов` 
                : 'Все вопросы олимпиады'}
            </p>
          </div>
        </div>

        {olympiad.prizes && (
          <div className="mt-4">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Призы</h3>
            <div className="bg-red-950/50 rounded-lg p-3 sm:p-4 text-red-200/90 text-sm sm:text-base">
              {olympiad.prizes}
            </div>
          </div>
        )}

        <div className="mt-4">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Даты проведения</h3>
          <div className="flex items-center gap-2 text-red-200/90 text-sm sm:text-base">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>
              {new Date(olympiad.startDate).toLocaleDateString()} - {new Date(olympiad.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onParticipate}
            className="w-full sm:w-auto px-6 py-3 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Участвовать
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default function OlympiadsPage() {
  const router = useRouter();
  const [olympiads, setOlympiads] = useState<Olympiad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOlympiad, setSelectedOlympiad] = useState<Olympiad | null>(null);

  useEffect(() => {
    const fetchOlympiads = async () => {
      try {
        const response = await fetch("/api/olympiads/available");
        if (!response.ok) {
          throw new Error("Failed to fetch olympiads");
        }
        const data = await response.json();
        console.log("Fetched olympiads:", data);
        setOlympiads(data);
      } catch (error) {
        console.error("Error fetching olympiads:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOlympiads();
  }, []);

  const handleParticipate = (olympiadId: string) => {
    setSelectedOlympiad(null);
    router.push(`/olympiads/${olympiadId}/participate`);
  };

  if (isLoading) {
    return <ChineseLoader text="Загрузка олимпиад..." />;
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
                  <span className="text-red-200">汉语</span>
                  <span>Доступные олимпиады</span>
                </h1>
                <p className="mt-2 text-red-200/80">
                  Выберите олимпиаду для участия
                </p>
              </div>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-red-200 bg-red-950/50 border border-red-200/20 rounded-lg hover:bg-red-900/50 transition-colors"
              >
                Вернуться
              </button>
            </div>
          </div>

          <div className="grid gap-6">
            {olympiads.map((olympiad) => (
              <div
                key={olympiad.id}
                className="bg-white/5 backdrop-blur-sm rounded-xl border border-red-200/10 p-4 sm:p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {olympiad.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-red-200/80">
                      <span className="px-3 py-1 text-sm rounded-lg bg-red-700/50">
                        {olympiad.level}
                      </span>
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(olympiad.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => setSelectedOlympiad(olympiad)}
                      className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-red-200 bg-red-950/50 border border-red-200/20 rounded-lg hover:bg-red-900/50 transition-colors"
                    >
                      Подробнее
                    </button>
                    <button
                      onClick={() => handleParticipate(olympiad.id)}
                      className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-600 transition-colors"
                    >
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

      {selectedOlympiad && (
        <OlympiadModal
          olympiad={selectedOlympiad}
          onClose={() => setSelectedOlympiad(null)}
          onParticipate={() => handleParticipate(selectedOlympiad.id)}
        />
      )}
    </div>
  );
}
