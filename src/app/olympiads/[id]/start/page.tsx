"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChineseLoader from "@/components/ChineseLoader";

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
  media?: {
    type: "image" | "video" | "audio";
    url: string;
  };
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

interface DragItem {
  id: string;
  content: string;
}

interface MatchingAnswer {
  leftIndex: number;
  rightIndex: number;
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
  const [scrambledAnswers, setScrambledAnswers] = useState<{
    [key: string]: DragItem[];
  }>({});
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0); // Will be set from olympiad.duration
  const [matchingSelections, setMatchingSelections] = useState<{
    [key: string]: MatchingAnswer[];
  }>({});
  const [selectedItem, setSelectedItem] = useState<{
    side: "left" | "right";
    index: number;
  } | null>(null);

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

        // Initialize scrambled answers for matching questions
        const initialScrambledAnswers: { [key: string]: DragItem[] } = {};
        questionsData.forEach((q: Question) => {
          if (q.type === "matching" && q.matchingPairs) {
            initialScrambledAnswers[q.id] = q.matchingPairs
              .map((pair) => ({
                id: `${q.id}-${pair.right}`,
                content: pair.right,
              }))
              .sort(() => Math.random() - 0.5);
          }
        });
        setScrambledAnswers(initialScrambledAnswers);

        setOlympiad(olympiadData);
        setQuestions(questionsData);
        setTimeLeft(olympiadData.duration);
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
    // Only start the timer and check for auto-submit if we've loaded the olympiad
    if (!olympiad) return;

    if (timeLeft <= 0) {
      handleSubmit(true); // Skip confirmation when timer runs out
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, olympiad]);

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

  const handleSubmit = async (skipConfirmation: boolean = false) => {
    if (!skipConfirmation && !confirm("Вы уверены, что хотите завершить олимпиаду?")) {
      return;
    }

    if (isSubmitting) return; // Prevent multiple submissions

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

  const handleDragStart = (e: React.DragEvent, item: DragItem) => {
    setDraggedItem(item);
    e.dataTransfer.setData("text/plain", item.content);
    e.currentTarget.classList.add("opacity-50");
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("opacity-50");
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("bg-red-700/30");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("bg-red-700/30");
  };

  const handleDrop = (
    e: React.DragEvent,
    questionId: string,
    leftItem: string
  ) => {
    e.preventDefault();
    e.currentTarget.classList.remove("bg-red-700/30");

    if (!draggedItem) return;

    const newMatchingAnswers = {
      ...matchingAnswers,
      [questionId]: {
        ...(matchingAnswers[questionId] || {}),
        [leftItem]: draggedItem.content,
      },
    };

    setMatchingAnswers(newMatchingAnswers);
    setAnswers((prev) => ({
      ...prev,
      [questionId]: JSON.stringify(newMatchingAnswers[questionId] || {}),
    }));
  };

  const handleMatchingClick = (
    questionId: string,
    side: "left" | "right",
    index: number
  ) => {
    if (!selectedItem) {
      // First selection
      setSelectedItem({ side, index });
    } else if (selectedItem.side === side) {
      // Clicked on same side - deselect
      setSelectedItem(null);
    } else {
      // Matching attempt
      const leftIndex = side === "left" ? index : selectedItem.index;
      const rightIndex = side === "right" ? index : selectedItem.index;

      // Remove any existing matches with these indices
      const filteredMatches = (matchingSelections[questionId] || []).filter(
        (match) =>
          match.leftIndex !== leftIndex && match.rightIndex !== rightIndex
      );

      const newMatches = [...filteredMatches, { leftIndex, rightIndex }];

      setMatchingSelections((prev) => ({
        ...prev,
        [questionId]: newMatches,
      }));

      // Convert to the format expected by the backend
      const matchingPairs = currentQuestion.matchingPairs || [];
      const matchingAnswersObj = newMatches.reduce(
        (acc, match) => ({
          ...acc,
          [matchingPairs[match.leftIndex].left]:
            matchingPairs[match.rightIndex].right,
        }),
        {}
      );

      setAnswers((prev) => ({
        ...prev,
        [questionId]: JSON.stringify(matchingAnswersObj),
      }));

      setSelectedItem(null);
    }
  };

  const isItemSelected = (
    questionId: string,
    side: "left" | "right",
    index: number
  ) => {
    return selectedItem?.side === side && selectedItem.index === index;
  };

  const isItemMatched = (
    questionId: string,
    side: "left" | "right",
    index: number
  ) => {
    const matches = matchingSelections[questionId] || [];
    return matches.some(
      (match) =>
        (side === "left" && match.leftIndex === index) ||
        (side === "right" && match.rightIndex === index)
    );
  };

  const getMatchedPair = (
    questionId: string,
    side: "left" | "right",
    index: number
  ) => {
    const matches = matchingSelections[questionId] || [];
    const match = matches.find(
      (m) =>
        (side === "left" && m.leftIndex === index) ||
        (side === "right" && m.rightIndex === index)
    );
    return match;
  };

  if (isLoading) {
    return <ChineseLoader text="Загрузка..." />;
  }

  if (!olympiad || questions.length === 0) {
    return <ChineseLoader text="Олимпиада не найдена" />;
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

                {/* Add media display */}
                {currentQuestion.media && (
                  <div className="mb-6">
                    {currentQuestion.media.type === "image" && (
                      <img
                        src={currentQuestion.media.url}
                        alt="Question media"
                        className="max-w-full max-h-[400px] rounded-lg object-contain mx-auto"
                      />
                    )}
                    {currentQuestion.media.type === "video" && (
                      <video
                        src={currentQuestion.media.url}
                        controls
                        className="max-w-full max-h-[400px] rounded-lg mx-auto"
                      />
                    )}
                    {currentQuestion.media.type === "audio" && (
                      <audio
                        src={currentQuestion.media.url}
                        controls
                        className="w-full"
                      />
                    )}
                  </div>
                )}

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
                            onClick={() =>
                              handleMatchingClick(
                                currentQuestion.id,
                                "left",
                                index
                              )
                            }
                            className={`p-4 rounded-lg transition-all cursor-pointer relative ${
                              isItemSelected(currentQuestion.id, "left", index)
                                ? "bg-red-700/50 border-2 border-red-200"
                                : isItemMatched(
                                    currentQuestion.id,
                                    "left",
                                    index
                                  )
                                ? "bg-white/20 border-2 border-green-400/50"
                                : "bg-white/10 hover:bg-white/20"
                            }`}
                          >
                            <span className="text-white">{pair.left}</span>
                            {isItemMatched(
                              currentQuestion.id,
                              "left",
                              index
                            ) && (
                              <div className="absolute right-0 top-0 h-full w-2 bg-green-400/50 rounded-r-lg" />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Right column */}
                      <div className="space-y-4">
                        {currentQuestion.matchingPairs.map((pair, index) => (
                          <div
                            key={`right-${index}`}
                            onClick={() =>
                              handleMatchingClick(
                                currentQuestion.id,
                                "right",
                                index
                              )
                            }
                            className={`p-4 rounded-lg transition-all cursor-pointer relative ${
                              isItemSelected(currentQuestion.id, "right", index)
                                ? "bg-red-700/50 border-2 border-red-200"
                                : isItemMatched(
                                    currentQuestion.id,
                                    "right",
                                    index
                                  )
                                ? "bg-white/20 border-2 border-green-400/50"
                                : "bg-white/10 hover:bg-white/20"
                            }`}
                          >
                            <span className="text-white">{pair.right}</span>
                            {isItemMatched(
                              currentQuestion.id,
                              "right",
                              index
                            ) && (
                              <div className="absolute left-0 top-0 h-full w-2 bg-green-400/50 rounded-l-lg" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Clear matches button */}
                    {matchingSelections[currentQuestion.id]?.length > 0 && (
                      <div className="flex justify-center mt-4">
                        <button
                          onClick={() => {
                            setMatchingSelections((prev) => ({
                              ...prev,
                              [currentQuestion.id]: [],
                            }));
                            setAnswers((prev) => ({
                              ...prev,
                              [currentQuestion.id]: JSON.stringify({}),
                            }));
                          }}
                          className="px-4 py-2 text-sm text-red-200 bg-red-950/50 border border-red-200/20 rounded-lg hover:bg-red-900/50 transition-colors"
                        >
                          Очистить сопоставления
                        </button>
                      </div>
                    )}
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
              onClick={() => handleSubmit(false)}
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
