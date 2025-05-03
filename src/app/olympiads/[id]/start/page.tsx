'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ChineseLoader from '@/components/ChineseLoader';

interface MatchingPair {
  left: string;
  right: string;
}

interface Question {
  id: string;
  question: string;
  type: 'text' | 'multiple_choice' | 'matching';
  choices?: string[];
  matchingPairs?: MatchingPair[];
  correctAnswer: string;
  media?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    key?: string;
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
    side: 'left' | 'right';
    index: number;
  } | null>(null);
  const [scrambledChoices, setScrambledChoices] = useState<{
    [key: string]: string[];
  }>({});
  const [scrambledPairs, setScrambledPairs] = useState<{
    [key: string]: number[];
  }>({});

  // Define handleSubmit before it's used in useEffect, wrapped in useCallback
  const handleSubmit = useCallback(
    async (skipConfirmation: boolean = false) => {
      if (
        !skipConfirmation &&
        !confirm('Вы уверены, что хотите завершить олимпиаду?')
      ) {
        return;
      }

      if (isSubmitting) return; // Prevent multiple submissions

      setIsSubmitting(true);
      try {
        // Clear timer data from localStorage
        localStorage.removeItem(`olympiad_timer_${params.id}`);
        localStorage.removeItem(`olympiad_answers_${params.id}`);

        const response = await fetch(`/api/olympiads/${params.id}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ answers }),
        });

        if (!response.ok) {
          throw new Error('Failed to submit answers');
        }

        router.push(`/olympiads/${params.id}/results`);
      } catch (error) {
        console.error('Error submitting answers:', error);
        alert('Ошибка при отправке ответов');
      } finally {
        setIsSubmitting(false);
      }
    },
    [params.id, answers, isSubmitting, router]
  );

  // Функция для обновления presigned URL
  const refreshPresignedUrl = async (objectKey: string) => {
    if (!objectKey) return null;

    try {
      const response = await fetch(
        `/api/olympiads/${params.id}/media?key=${encodeURIComponent(objectKey)}`
      );
      if (!response.ok) {
        throw new Error('Failed to refresh presigned URL');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error refreshing presigned URL:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [olympiadResponse, questionsResponse] = await Promise.all([
          fetch(`/api/olympiads/${params.id}`),
          fetch(`/api/olympiads/${params.id}/questions`),
        ]);

        if (!olympiadResponse.ok || !questionsResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const olympiadData = await olympiadResponse.json();
        let questionsData = await questionsResponse.json();

        // Handle randomization and question limit
        if (olympiadData[0].randomizeQuestions) {
          questionsData = [...questionsData].sort(() => Math.random() - 0.5);
        }

        if (
          olympiadData[0].questionsPerParticipant &&
          olympiadData[0].questionsPerParticipant < questionsData.length
        ) {
          questionsData = questionsData.slice(
            0,
            olympiadData[0].questionsPerParticipant
          );
        }

        // Try to load existing scrambled orders from localStorage
        const scrambledKey = `olympiad_scrambled_${params.id}`;
        const savedScrambled = localStorage.getItem(scrambledKey);
        let scrambledData = savedScrambled ? JSON.parse(savedScrambled) : null;

        if (!scrambledData) {
          // Initialize new scrambled orders if none exist
          const initialScrambledChoices: { [key: string]: string[] } = {};
          const initialScrambledPairs: { [key: string]: number[] } = {};

          questionsData.forEach((q: Question) => {
            if (q.type === 'multiple_choice' && q.choices) {
              // Create array of indices and shuffle them
              const indices = Array.from(
                { length: q.choices.length },
                (_, i) => i
              );
              initialScrambledChoices[q.id] = indices
                .sort(() => Math.random() - 0.5)
                .map((i) => q.choices![i]);
            }
            if (q.type === 'matching' && q.matchingPairs) {
              // Create array of indices and shuffle them
              const indices = Array.from(
                { length: q.matchingPairs.length },
                (_, i) => i
              );
              initialScrambledPairs[q.id] = indices.sort(
                () => Math.random() - 0.5
              );
            }
          });

          // Save to localStorage
          localStorage.setItem(
            scrambledKey,
            JSON.stringify({
              choices: initialScrambledChoices,
              pairs: initialScrambledPairs,
            })
          );

          setScrambledChoices(initialScrambledChoices);
          setScrambledPairs(initialScrambledPairs);
        } else {
          // Use existing scrambled orders
          setScrambledChoices(scrambledData.choices);
          setScrambledPairs(scrambledData.pairs);
        }

        setOlympiad(olympiadData[0]);
        setQuestions(questionsData);

        // Check if we have a saved timer state in localStorage
        const timerKey = `olympiad_timer_${params.id}`;
        const savedEndTime = localStorage.getItem(timerKey);

        if (savedEndTime) {
          // Calculate remaining time based on saved end time
          const endTime = parseInt(savedEndTime, 10);
          const now = Math.floor(Date.now() / 1000);
          const remaining = Math.max(0, endTime - now);

          if (remaining > 0) {
            // If there's time remaining, use it
            setTimeLeft(remaining);
          } else {
            // If time has expired, submit automatically
            handleSubmit(true);
            return;
          }
        } else {
          // If no saved timer, initialize with full duration and save end time
          setTimeLeft(olympiadData[0].duration);
          const endTime =
            Math.floor(Date.now() / 1000) + olympiadData[0].duration;
          localStorage.setItem(timerKey, endTime.toString());
        }

        // Also try to load saved answers
        const answersKey = `olympiad_answers_${params.id}`;
        const savedAnswers = localStorage.getItem(answersKey);
        if (savedAnswers) {
          try {
            setAnswers(JSON.parse(savedAnswers));
          } catch (e) {
            console.error('Error parsing saved answers:', e);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id, handleSubmit]);

  // Timer effect
  useEffect(() => {
    // Only start the timer and check for auto-submit if we've loaded the olympiad
    if (!olympiad) return;

    if (timeLeft <= 0) {
      handleSubmit(true); // Skip confirmation when timer runs out
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newValue = prev - 1;
        return newValue;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, olympiad, handleSubmit]);

  // Save answers to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      const answersKey = `olympiad_answers_${params.id}`;
      localStorage.setItem(answersKey, JSON.stringify(answers));
    }
  }, [answers, params.id]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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

  const handleDragStart = (e: React.DragEvent, item: DragItem) => {
    setDraggedItem(item);
    e.dataTransfer.setData('text/plain', item.content);
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-red-700/30');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-red-700/30');
  };

  const handleDrop = (
    e: React.DragEvent,
    questionId: string,
    leftItem: string
  ) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-red-700/30');

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
    side: 'left' | 'right',
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
      const leftIndex = side === 'left' ? index : selectedItem.index;
      const rightIndex = side === 'right' ? index : selectedItem.index;

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
      const matchingPairs = questions[currentQuestionIndex].matchingPairs || [];
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
    side: 'left' | 'right',
    index: number
  ) => {
    return selectedItem?.side === side && selectedItem.index === index;
  };

  const isItemMatched = (
    questionId: string,
    side: 'left' | 'right',
    index: number
  ) => {
    const matches = matchingSelections[questionId] || [];
    return matches.some(
      (match) =>
        (side === 'left' && match.leftIndex === index) ||
        (side === 'right' && match.rightIndex === index)
    );
  };

  const getMatchedPair = (
    questionId: string,
    side: 'left' | 'right',
    index: number
  ) => {
    const matches = matchingSelections[questionId] || [];
    const match = matches.find(
      (m) =>
        (side === 'left' && m.leftIndex === index) ||
        (side === 'right' && m.rightIndex === index)
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
                        ? 'bg-green-500'
                        : 'bg-red-200/20'
                    } ${
                      index === currentQuestionIndex
                        ? 'ring-2 ring-red-200'
                        : ''
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
                {currentQuestion.media && currentQuestion.media.url && (
                  <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-red-200/20">
                    {currentQuestion.media.type === 'image' && (
                      <div className="flex justify-center">
                        <img
                          src={currentQuestion.media.url}
                          alt="Question media"
                          className="max-w-full h-auto max-h-[300px] rounded-lg"
                          onLoad={() =>
                            console.log('Image loaded successfully')
                          }
                          onError={async (e) => {
                            console.error(
                              `Failed to load image: ${currentQuestion.media?.url}`
                            );
                            const errorImg = e.currentTarget;

                            // Если у объекта есть ключ, обновляем presigned URL
                            if (currentQuestion.media?.key) {
                              const newUrl = await refreshPresignedUrl(
                                currentQuestion.media.key
                              );
                              if (newUrl) {
                                errorImg.src = newUrl;

                                // Обновляем URL в состоянии вопросов
                                const updatedQuestions = [...questions];
                                if (
                                  updatedQuestions[currentQuestionIndex].media
                                ) {
                                  updatedQuestions[
                                    currentQuestionIndex
                                  ].media!.url = newUrl;
                                  setQuestions(updatedQuestions);
                                }
                                return;
                              }
                            }

                            // Если не удалось обновить URL или нет ключа, показываем сообщение об ошибке
                            errorImg.style.display = 'none';
                            const errorContainer = errorImg.parentElement;
                            if (errorContainer) {
                              const errorMsg = document.createElement('div');
                              errorMsg.className =
                                'text-red-300 text-center p-4';
                              errorMsg.textContent = `Не удалось загрузить изображение (${currentQuestion.media?.url})`;
                              errorContainer.appendChild(errorMsg);
                            }
                          }}
                        />
                      </div>
                    )}
                    {currentQuestion.media.type === 'video' && (
                      <div className="flex justify-center">
                        <video
                          src={currentQuestion.media.url}
                          controls
                          className="max-w-full h-auto max-h-[300px] rounded-lg"
                          onError={async (e) => {
                            console.error(
                              `Failed to load video: ${currentQuestion.media?.url}`
                            );
                            const errorVideo = e.currentTarget;

                            // Если у объекта есть ключ, обновляем presigned URL
                            if (currentQuestion.media?.key) {
                              const newUrl = await refreshPresignedUrl(
                                currentQuestion.media.key
                              );
                              if (newUrl) {
                                errorVideo.src = newUrl;

                                // Обновляем URL в состоянии вопросов
                                const updatedQuestions = [...questions];
                                if (
                                  updatedQuestions[currentQuestionIndex].media
                                ) {
                                  updatedQuestions[
                                    currentQuestionIndex
                                  ].media!.url = newUrl;
                                  setQuestions(updatedQuestions);
                                }
                                return;
                              }
                            }

                            // Если не удалось обновить URL или нет ключа, показываем сообщение об ошибке
                            errorVideo.style.display = 'none';
                            const errorContainer = errorVideo.parentElement;
                            if (errorContainer) {
                              const errorDiv = document.createElement('div');
                              errorDiv.className =
                                'text-red-300 text-center p-4';
                              errorDiv.textContent = `Не удалось загрузить видео (${currentQuestion.media?.url})`;
                              errorContainer.appendChild(errorDiv);
                            }
                          }}
                        />
                      </div>
                    )}
                    {currentQuestion.media.type === 'audio' && (
                      <div className="flex flex-col items-center gap-2">
                        <audio
                          src={currentQuestion.media.url}
                          controls
                          className="w-full"
                          preload="auto"
                          onLoadedMetadata={() => {
                            console.log('Audio metadata loaded successfully');
                          }}
                          onCanPlay={() => {
                            console.log('Audio can play now');
                          }}
                          onError={async (e) => {
                            console.error(
                              `Failed to load audio: ${currentQuestion.media?.url}`
                            );
                            const errorAudio = e.currentTarget;

                            // Проверяем, что элемент не имеет атрибут 'data-retried'
                            if (
                              !errorAudio.hasAttribute('data-retried') &&
                              currentQuestion.media?.key
                            ) {
                              errorAudio.setAttribute('data-retried', 'true');
                              const newUrl = await refreshPresignedUrl(
                                currentQuestion.media.key
                              );
                              if (newUrl) {
                                errorAudio.src = newUrl;

                                // Обновляем URL в состоянии вопросов
                                const updatedQuestions = [...questions];
                                if (
                                  updatedQuestions[currentQuestionIndex].media
                                ) {
                                  updatedQuestions[
                                    currentQuestionIndex
                                  ].media!.url = newUrl;
                                  setQuestions(updatedQuestions);
                                }
                                return;
                              }
                            }

                            // Если это повторная попытка или нет ключа, показываем fallback
                            errorAudio.style.display = 'none';
                            const errorContainer = errorAudio.parentElement;
                            if (errorContainer) {
                              const errorDiv = document.createElement('div');
                              errorDiv.className =
                                'text-red-300 text-center p-4';
                              errorDiv.textContent = `Не удалось загрузить аудио (${currentQuestion.media?.url})`;
                              errorContainer.appendChild(errorDiv);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {currentQuestion.type === 'multiple_choice' &&
                currentQuestion.choices ? (
                  <div className="space-y-3">
                    {(
                      scrambledChoices[currentQuestion.id] ||
                      currentQuestion.choices
                    ).map((choice, index) => (
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
                ) : currentQuestion.type === 'matching' &&
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
                                'left',
                                index
                              )
                            }
                            className={`p-4 rounded-lg transition-all cursor-pointer relative ${
                              isItemSelected(currentQuestion.id, 'left', index)
                                ? 'bg-red-700/50 border-2 border-red-200'
                                : isItemMatched(
                                    currentQuestion.id,
                                    'left',
                                    index
                                  )
                                ? 'bg-white/20 border-2 border-green-400/50'
                                : 'bg-white/10 hover:bg-white/20'
                            }`}
                          >
                            <span className="text-white">{pair.left}</span>
                            {isItemMatched(
                              currentQuestion.id,
                              'left',
                              index
                            ) && (
                              <div className="absolute right-0 top-0 h-full w-2 bg-green-400/50 rounded-r-lg" />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Right column - now using scrambled order */}
                      <div className="space-y-4">
                        {currentQuestion.matchingPairs &&
                          scrambledPairs[currentQuestion.id]?.map(
                            (scrambledIndex) => {
                              const pair =
                                currentQuestion.matchingPairs![scrambledIndex];
                              return (
                                <div
                                  key={`right-${scrambledIndex}`}
                                  onClick={() =>
                                    handleMatchingClick(
                                      currentQuestion.id,
                                      'right',
                                      scrambledIndex
                                    )
                                  }
                                  className={`p-4 rounded-lg transition-all cursor-pointer relative ${
                                    isItemSelected(
                                      currentQuestion.id,
                                      'right',
                                      scrambledIndex
                                    )
                                      ? 'bg-red-700/50 border-2 border-red-200'
                                      : isItemMatched(
                                          currentQuestion.id,
                                          'right',
                                          scrambledIndex
                                        )
                                      ? 'bg-white/20 border-2 border-green-400/50'
                                      : 'bg-white/10 hover:bg-white/20'
                                  }`}
                                >
                                  <span className="text-white">
                                    {pair.right}
                                  </span>
                                  {isItemMatched(
                                    currentQuestion.id,
                                    'right',
                                    scrambledIndex
                                  ) && (
                                    <div className="absolute left-0 top-0 h-full w-2 bg-green-400/50 rounded-l-lg" />
                                  )}
                                </div>
                              );
                            }
                          )}
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
                    value={answers[currentQuestion.id] || ''}
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
              {isSubmitting ? 'Отправка...' : 'Завершить олимпиаду'}
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
