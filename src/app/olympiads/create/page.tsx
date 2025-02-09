"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateOlympiadPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [duration, setDuration] = useState("120"); // Default 120 minutes
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [questionsPerParticipant, setQuestionsPerParticipant] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/olympiads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          level,
          startDate,
          endDate,
          duration: parseInt(duration) * 60, // Convert minutes to seconds
          randomizeQuestions,
          questionsPerParticipant: questionsPerParticipant
            ? parseInt(questionsPerParticipant)
            : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create olympiad");
      }

      const olympiad = await response.json();
      // Add a delay to ensure the olympiad is created in the database
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.push(`/olympiads/${olympiad.id}/questions`);
    } catch (error) {
      console.error("Error creating olympiad:", error);
      alert(
        error instanceof Error ? error.message : "Failed to create olympiad"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900">
      <div className="p-8 mt-[80px] md:mt-[100px]">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <span className="text-red-200">汉语</span>
              <span>Создание олимпиады</span>
            </h1>
            <p className="mt-2 text-red-200/80">
              Заполните основную информацию об олимпиаде
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-red-200/10 p-6">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-red-200 mb-2">
                    Название олимпиады
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-red-200/10 rounded-lg text-white placeholder-red-200/50 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Например: Осенняя олимпиада 2024"
                    required
                  />
                </div>

                {/* Level */}
                <div>
                  <label className="block text-sm font-medium text-red-200 mb-2">
                    Уровень сложности
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-red-200/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  >
                    <option value="" className="bg-red-900">
                      Выберите уровень
                    </option>
                    <option value="Начальный" className="bg-red-900">
                      Начальный
                    </option>
                    <option value="Средний" className="bg-red-900">
                      Средний
                    </option>
                    <option value="Продвинутый" className="bg-red-900">
                      Продвинутый
                    </option>
                  </select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-red-200 mb-2">
                      Дата начала
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-red-200/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-red-200 mb-2">
                      Дата окончания
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-red-200/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-red-200 mb-2">
                    Длительность (в минутах)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min="1"
                    className="w-full px-4 py-3 bg-white/10 border border-red-200/10 rounded-lg text-white placeholder-red-200/50 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Например: 120"
                    required
                  />
                </div>

                {/* Questions Settings */}
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={randomizeQuestions}
                        onChange={(e) =>
                          setRandomizeQuestions(e.target.checked)
                        }
                        className="text-red-500 focus:ring-red-500 bg-white/10 border-red-200/10 rounded"
                      />
                      <span className="text-red-200">
                        Случайный порядок вопросов
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-red-200 mb-2">
                      Количество вопросов для каждого участника
                    </label>
                    <input
                      type="number"
                      value={questionsPerParticipant}
                      onChange={(e) =>
                        setQuestionsPerParticipant(e.target.value)
                      }
                      min="1"
                      className="w-full px-4 py-3 bg-white/10 border border-red-200/10 rounded-lg text-white placeholder-red-200/50 focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Оставьте пустым, чтобы использовать все вопросы"
                    />
                    <p className="mt-1 text-sm text-red-200/60">
                      Если оставить пустым, участникам будут показаны все
                      вопросы
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 text-sm font-medium text-red-200 bg-red-950/50 border border-red-200/20 rounded-lg hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-800 focus:ring-red-500 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-800 focus:ring-red-500 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Создание..." : "Далее: Добавить вопросы"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
