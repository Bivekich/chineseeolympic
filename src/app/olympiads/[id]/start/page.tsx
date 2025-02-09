"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface MatchingPair {
  left: string;
  right: string;
}

interface Question {
  id: string;
  question: string;
  type: "text" | "multiple_choice" | "matching";
  choices?: string[];
  matchingPairs?: MatchingPair[];
  correctAnswer: string;
}

interface Olympiad {
  id: string;
  title: string;
  level: string;
  startDate: string;
  endDate: string;
  duration: number;
  randomizeQuestions: boolean;
  questionsPerParticipant: number | null;
}

export default function StartOlympiadPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [olympiad, setOlympiad] = useState<Olympiad | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [matchingAnswers, setMatchingAnswers] = useState<{
    [key: string]: { [key: string]: string };
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0); // Will be set from olympiad.duration

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [olympiadResponse, questionsResponse] = await Promise.all([
          fetch(`/api/olympiads/${params.id}`),
          fetch(`/api/olympiads/${params.id}/questions`),
        ]);

        if (!olympiadResponse.ok || !questionsResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const olympiadData = await olympiadResponse.json();
        let questionsData = await questionsResponse.json();

        // Handle randomization and question limit
        if (olympiadData.randomizeQuestions) {
          questionsData = [...questionsData].sort(() => Math.random() - 0.5);
        }

        if (
          olympiadData.questionsPerParticipant &&
          olympiadData.questionsPerParticipant < questionsData.length
        ) {
          questionsData = questionsData.slice(
            0,
            olympiadData.questionsPerParticipant
          );
        }

        setOlympiad(olympiadData);
        setQuestions(questionsData);
        setTimeLeft(olympiadData.duration); // Set timer from olympiad settings
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleMatchingChange = (
    questionId: string,
    leftItem: string,
    rightItem: string
  ) => {
    // Store the actual matching pairs rather than indices
    setMatchingAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        [leftItem]: rightItem,
      },
    }));

    // Update answers with the complete matching state
    setAnswers((prev) => ({
      ...prev,
      [questionId]: JSON.stringify(matchingAnswers[questionId] || {}),
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!confirm("Вы уверены, что хотите завершить олимпиаду?")) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/olympiads/${params.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit answers");
      }

      router.push(`/olympiads/${params.id}/results`);
    } catch (error) {
      console.error("Error submitting answers:", error);
      alert("Ошибка при отправке ответов");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900">
        <div className="p-8 mt-[80px] md:mt-[100px]">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <p className="text-red-200/80">Загрузка...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!olympiad || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900">
        <div className="p-8 mt-[80px] md:mt-[100px]">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <p className="text-red-200">Олимпиада не найдена</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900">
      <div className="p-8 mt-[80px] md:mt-[100px]">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                <span className="text-red-200">汉语</span>
                <span>{olympiad.title}</span>
              </h1>
              <div className="text-2xl font-mono text-red-200">
                {formatTime(timeLeft)}
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <p className="text-red-200/80">
                Вопрос {currentQuestionIndex + 1} из {questions.length}
              </p>
              <div className="flex items-center gap-2">
                {questions.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full ${
                      answers[questions[index].id]
                        ? "bg-green-500"
                        : "bg-red-200/20"
                    } ${
                      index === currentQuestionIndex
                        ? "ring-2 ring-red-200"
                        : ""
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-red-200/10 p-6 mb-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-medium text-white mb-4">
                  {currentQuestion.question}
                </h3>

                {currentQuestion.type === "multiple_choice" &&
                currentQuestion.choices ? (
                  <div className="space-y-3">
                    {currentQuestion.choices.map((choice, index) => (
                      <label
                        key={index}
                        className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors"
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value={choice}
                          checked={answers[currentQuestion.id] === choice}
                          onChange={(e) =>
                            handleAnswerChange(
                              currentQuestion.id,
                              e.target.value
                            )
                          }
                          className="text-red-500 focus:ring-red-500"
                        />
                        <span className="text-white">{choice}</span>
                      </label>
                    ))}
                  </div>
                ) : currentQuestion.type === "matching" &&
                  currentQuestion.matchingPairs ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-8">
                      {/* Left column */}
                      <div className="space-y-4">
                        {currentQuestion.matchingPairs.map((pair, index) => (
                          <div
                            key={`left-${index}`}
                            className="p-3 bg-white/10 rounded-lg"
                          >
                            <span className="text-white">{pair.left}</span>
                          </div>
                        ))}
                      </div>

                      {/* Right column - draggable/selectable items */}
                      <div className="space-y-4">
                        {currentQuestion.matchingPairs.map((pair, index) => (
                          <select
                            key={`right-${index}`}
                            value={
                              matchingAnswers[currentQuestion.id]?.[
                                currentQuestion.matchingPairs![index].left
                              ] || ""
                            }
                            onChange={(e) =>
                              handleMatchingChange(
                                currentQuestion.id,
                                currentQuestion.matchingPairs![index].left,
                                e.target.value
                              )
                            }
                            className="w-full p-3 bg-white/10 border border-red-200/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            <option value="">Выберите соответствие</option>
                            {currentQuestion.matchingPairs.map((p, i) => (
                              <option
                                key={i}
                                value={p.right}
                                className="bg-red-900 text-white"
                              >
                                {p.right}
                              </option>
                            ))}
                          </select>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <textarea
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(currentQuestion.id, e.target.value)
                    }
                    className="w-full px-4 py-3 bg-white/10 border border-red-200/10 rounded-lg text-white placeholder-red-200/50 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Введите ваш ответ"
                    rows={4}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 text-sm font-medium text-red-200 bg-red-950/50 border border-red-200/20 rounded-lg hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-800 focus:ring-red-500 transition-colors disabled:opacity-50"
            >
              Предыдущий вопрос
            </button>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-800 focus:ring-red-500 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Отправка..." : "Завершить олимпиаду"}
            </button>

            <button
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1}
              className="px-6 py-3 text-sm font-medium text-red-200 bg-red-950/50 border border-red-200/20 rounded-lg hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-800 focus:ring-red-500 transition-colors disabled:opacity-50"
            >
              Следующий вопрос
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
