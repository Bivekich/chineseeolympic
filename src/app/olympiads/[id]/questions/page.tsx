'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChineseLoader from '@/components/ChineseLoader';
interface MatchingPair {
  left: string;
  right: string;
}

interface QuestionMedia {
  type: 'image' | 'video' | 'audio';
  url: string;
}

interface Question {
  id?: string;
  question: string;
  type: 'text' | 'multiple_choice' | 'matching';
  choices?: string[];
  matchingPairs?: MatchingPair[];
  correctAnswer: string;
  media?: QuestionMedia;
}

interface Olympiad {
  id: string;
  title: string;
  level: string;
  startDate: Date;
  endDate: Date;
  creatorId: string;
  isCompleted: boolean;
  isDraft: boolean;
  hasQuestions: boolean;
  hasPrizes: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function AddQuestionsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [olympiad, setOlympiad] = useState<Olympiad | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchOlympiad = async () => {
      try {
        // Fetch both olympiad and questions data in parallel
        const [olympiadResponse, questionsResponse] = await Promise.all([
          fetch(`/api/olympiads/${params.id}`),
          fetch(`/api/olympiads/${params.id}/questions`),
        ]);

        if (!olympiadResponse.ok) {
          throw new Error('Failed to fetch olympiad');
        }

        const olympiadData = await olympiadResponse.json();
        setOlympiad(olympiadData[0]); // Fix: get first item from array

        if (questionsResponse.ok) {
          const questionsData = await questionsResponse.json();
          if (questionsData && questionsData.length > 0) {
            setQuestions(questionsData);
          } else {
            // If no questions exist, start with one empty question
            setQuestions([{ question: '', type: 'text', correctAnswer: '' }]);
          }
        }
      } catch (error) {
        console.error('Error fetching olympiad:', error);
        alert('Ошибка при загрузке олимпиады');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOlympiad();
  }, [params.id]);

  // Проверяем, есть ли зарегистрированные участники, если олимпиада не черновик
  useEffect(() => {
    const checkParticipants = async () => {
      if (olympiad && !olympiad.isDraft) {
        try {
          const response = await fetch(
            `/api/olympiads/${params.id}/participants`
          );
          if (response.ok) {
            const data = await response.json();
            const hasParticipants =
              data.participants && data.participants.length > 0;

            if (hasParticipants) {
              alert(
                'Внимание! У олимпиады уже есть зарегистрированные участники. Добавление или изменение вопросов может повлиять на их результаты.'
              );
            }
          }
        } catch (error) {
          console.error('Error checking participants:', error);
        }
      }
    };

    if (olympiad) {
      checkParticipants();
    }
  }, [olympiad, params.id]);

  const handleQuestionChange = (
    index: number,
    field: keyof Question,
    value: string | string[]
  ) => {
    const newQuestions = [...questions];
    if (field === 'type') {
      if (value === 'multiple_choice') {
        newQuestions[index] = {
          ...newQuestions[index],
          type: 'multiple_choice',
          choices: ['', '', '', ''],
          correctAnswer: '',
        };
      } else if (value === 'matching') {
        newQuestions[index] = {
          ...newQuestions[index],
          type: 'matching',
          matchingPairs: [
            { left: '', right: '' },
            { left: '', right: '' },
          ],
          correctAnswer: JSON.stringify([0, 1]), // Default sequential matching
        };
      } else {
        const { choices, matchingPairs, ...rest } = newQuestions[index];
        newQuestions[index] = { ...rest, type: 'text' };
      }
    } else {
      newQuestions[index] = { ...newQuestions[index], [field]: value };
    }
    setQuestions(newQuestions);
  };

  const handleChoiceChange = (
    questionIndex: number,
    choiceIndex: number,
    value: string
  ) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].choices) {
      newQuestions[questionIndex].choices![choiceIndex] = value;
      setQuestions(newQuestions);
    }
  };

  const addChoice = (questionIndex: number) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].choices) {
      newQuestions[questionIndex].choices!.push('');
      setQuestions(newQuestions);
    }
  };

  const removeChoice = (questionIndex: number, choiceIndex: number) => {
    const newQuestions = [...questions];
    if (
      newQuestions[questionIndex].choices &&
      newQuestions[questionIndex].choices!.length > 2
    ) {
      newQuestions[questionIndex].choices!.splice(choiceIndex, 1);
      setQuestions(newQuestions);
    }
  };

  const handleMatchingPairChange = (
    questionIndex: number,
    pairIndex: number,
    side: 'left' | 'right',
    value: string
  ) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].matchingPairs) {
      newQuestions[questionIndex].matchingPairs![pairIndex][side] = value;
      // For matching questions, we don't need a separate correctAnswer
      if (newQuestions[questionIndex].type === 'matching') {
        newQuestions[questionIndex].correctAnswer = '';
      }
      setQuestions(newQuestions);
    }
  };

  const addMatchingPair = (questionIndex: number) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].matchingPairs) {
      const currentPairs = newQuestions[questionIndex].matchingPairs!;
      newQuestions[questionIndex].matchingPairs = [
        ...currentPairs,
        { left: '', right: '' },
      ];
      // Update correctAnswer to maintain sequential matching
      newQuestions[questionIndex].correctAnswer = JSON.stringify(
        currentPairs.map((_, i) => i)
      );
      setQuestions(newQuestions);
    }
  };

  const removeMatchingPair = (questionIndex: number, pairIndex: number) => {
    const newQuestions = [...questions];
    if (
      newQuestions[questionIndex].matchingPairs &&
      newQuestions[questionIndex].matchingPairs!.length > 2
    ) {
      newQuestions[questionIndex].matchingPairs!.splice(pairIndex, 1);
      // Update correctAnswer to maintain sequential matching
      newQuestions[questionIndex].correctAnswer = JSON.stringify(
        newQuestions[questionIndex].matchingPairs!.map((_, i) => i)
      );
      setQuestions(newQuestions);
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { question: '', type: 'text', correctAnswer: '' },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      const newQuestions = questions.filter((_, i) => i !== index);
      setQuestions(newQuestions);
    }
  };

  const handleMediaUpload = async (questionIndex: number, file: File) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('questionIndex', questionIndex.toString());

    try {
      console.log(
        `Uploading file for question ${questionIndex}: ${file.name}, size: ${file.size} bytes, type: ${file.type}`
      );
      const response = await fetch(`/api/olympiads/${params.id}/media`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Upload error: ${response.status} ${response.statusText}`,
          errorText
        );
        throw new Error(`Failed to upload media: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(
        `Media upload successful. URL: ${data.url}, Type: ${data.type}`
      );

      const newQuestions = [...questions];
      newQuestions[questionIndex] = {
        ...newQuestions[questionIndex],
        media: {
          type: file.type.startsWith('image/')
            ? 'image'
            : file.type.startsWith('video/')
            ? 'video'
            : 'audio',
          url: data.url,
        },
      };
      setQuestions(newQuestions);
      alert(`Файл ${file.name} успешно загружен.
Путь: ${data.url}
Тип: ${data.type}
Директория: public/olympiad-media (в корне проекта)`);
    } catch (error) {
      console.error('Error uploading media:', error);
      alert(
        `Ошибка при загрузке медиафайла: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const saveQuestions = async (publish: boolean = false) => {
    setIsSaving(true);
    // Validate all questions based on their type
    const invalidQuestions = questions.some((q) => {
      if (!q.question) return true; // Question text is always required

      switch (q.type) {
        case 'text':
          return !q.correctAnswer;

        case 'multiple_choice':
          return (
            !q.choices ||
            q.choices.some((choice) => !choice) || // Check if any choice is empty
            !q.correctAnswer ||
            !q.choices.includes(q.correctAnswer)
          ); // Check if correct answer is one of the choices

        case 'matching':
          if (!q.matchingPairs || q.matchingPairs.length < 2) return true;
          return q.matchingPairs.some((pair) => !pair.left || !pair.right);
      }
    });

    if (invalidQuestions) {
      setIsSaving(false);
      alert('Пожалуйста, заполните все поля вопросов корректно');
      return false;
    }

    try {
      const response = await fetch(`/api/olympiads/${params.id}/questions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questions,
          publish: false, // Never publish from questions page
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save questions');
      }

      if (!publish) {
        alert('Вопросы успешно сохранены');
      }

      return true;
    } catch (error) {
      console.error('Error saving questions:', error);
      alert('Ошибка при сохранении вопросов');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <ChineseLoader text="Загрузка..." />;
  }

  if (!olympiad) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Олимпиада не найдена</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      <div className="p-8 mt-[80px] md:mt-[100px]">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <span className="text-red-800">汉语</span>
              <span className="text-gray-800">{olympiad.title}</span>
            </h1>
            <p className="mt-2 text-gray-600">
              {olympiad.isDraft
                ? 'Добавьте вопросы для олимпиады'
                : 'Редактирование вопросов олимпиады'}
            </p>
            {!olympiad.isDraft && (
              <div className="mt-2 bg-amber-50 border-l-4 border-amber-400 p-4 text-amber-800 rounded">
                <p>
                  <span className="font-semibold">Внимание!</span> Эта олимпиада
                  уже опубликована. Изменение, удаление или добавление вопросов
                  может повлиять на опыт участников.
                </p>
              </div>
            )}
          </div>

          <form className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8">
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div
                  key={index}
                  className="p-6 bg-gray-50 rounded-xl space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                      Вопрос {index + 1}
                    </h3>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Удалить
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Тип вопроса
                    </label>
                    <select
                      value={question.type}
                      onChange={(e) =>
                        handleQuestionChange(index, 'type', e.target.value)
                      }
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-gray-900"
                    >
                      <option value="text">Текстовый ответ</option>
                      <option value="multiple_choice">
                        С вариантами ответа
                      </option>
                      <option value="matching">На сопоставление</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Вопрос
                    </label>
                    <textarea
                      value={question.question}
                      onChange={(e) =>
                        handleQuestionChange(index, 'question', e.target.value)
                      }
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-gray-900"
                      rows={3}
                      required
                    />
                  </div>

                  {/* Multiple Choice Question */}
                  {question.type === 'multiple_choice' && (
                    <div className="space-y-4">
                      <div className="space-y-2 text-gray-900">
                        {(question.choices || []).map((choice, choiceIndex) => (
                          <div
                            key={choiceIndex}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="text"
                              value={choice}
                              onChange={(e) =>
                                handleChoiceChange(
                                  index,
                                  choiceIndex,
                                  e.target.value
                                )
                              }
                              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                              placeholder={`Вариант ${choiceIndex + 1}`}
                              required
                            />
                            {(question.choices || []).length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeChoice(index, choiceIndex)}
                                className="p-2 text-red-600 hover:text-red-700"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => addChoice(index)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        + Добавить вариант ответа
                      </button>
                    </div>
                  )}

                  {/* Matching Question */}
                  {question.type === 'matching' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        {(question.matchingPairs || []).map(
                          (pair, pairIndex) => (
                            <div
                              key={pairIndex}
                              className="flex items-center gap-2"
                            >
                              <div className="flex-1 grid grid-cols-2 gap-4 text-gray-900">
                                <input
                                  type="text"
                                  value={pair.left}
                                  onChange={(e) =>
                                    handleMatchingPairChange(
                                      index,
                                      pairIndex,
                                      'left',
                                      e.target.value
                                    )
                                  }
                                  className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                  placeholder="Левая часть"
                                  required
                                />
                                <input
                                  type="text"
                                  value={pair.right}
                                  onChange={(e) =>
                                    handleMatchingPairChange(
                                      index,
                                      pairIndex,
                                      'right',
                                      e.target.value
                                    )
                                  }
                                  className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                  placeholder="Правая часть"
                                  required
                                />
                              </div>
                              {(question.matchingPairs || []).length > 2 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeMatchingPair(index, pairIndex)
                                  }
                                  className="p-2 text-red-600 hover:text-red-700"
                                >
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              )}
                            </div>
                          )
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => addMatchingPair(index)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        + Добавить пару
                      </button>
                    </div>
                  )}

                  <div>
                    {question.type === 'matching' ? (
                      <div className="text-sm text-gray-600 mt-2">
                        Правильный ответ определяется автоматически из созданных
                        пар
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {question.type === 'multiple_choice'
                            ? 'Правильный вариант ответа'
                            : 'Правильный ответ'}
                        </label>
                        <input
                          type="text"
                          value={question.correctAnswer}
                          onChange={(e) =>
                            handleQuestionChange(
                              index,
                              'correctAnswer',
                              e.target.value
                            )
                          }
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-gray-900"
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Медиафайл (изображение, видео или аудио)
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept="image/*,video/*,audio/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleMediaUpload(index, file);
                          }
                        }}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-red-50 file:text-red-700
                          hover:file:bg-red-100"
                      />
                      {question.media && (
                        <div className="relative">
                          {question.media.type === 'image' && (
                            <img
                              src={question.media.url}
                              alt="Question media"
                              className="h-20 w-20 object-cover rounded-lg"
                            />
                          )}
                          {question.media.type === 'video' && (
                            <video
                              src={question.media.url}
                              className="h-20 w-20 object-cover rounded-lg"
                              controls
                            />
                          )}
                          {question.media.type === 'audio' && (
                            <audio
                              src={question.media.url}
                              className="w-full"
                              controls
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const newQuestions = [...questions];
                              newQuestions[index] = {
                                ...newQuestions[index],
                                media: undefined,
                              };
                              setQuestions(newQuestions);
                            }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-4">
                <button
                  type="button"
                  onClick={addQuestion}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  + Добавить вопрос
                </button>
              </div>

              <div className="pt-8 flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Назад
                  </button>
                  <button
                    type="button"
                    onClick={() => saveQuestions(false)}
                    disabled={isSaving}
                    className="px-6 py-3 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400"
                  >
                    {isSaving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>

                {olympiad.isDraft && (
                  <button
                    type="button"
                    onClick={async () => {
                      const isSuccess = await saveQuestions(false);
                      if (isSuccess) {
                        router.push(`/olympiads/${params.id}/prizes`);
                      }
                    }}
                    disabled={isSaving}
                    className="px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400"
                  >
                    {isSaving ? 'Сохранение...' : 'Далее: Призы'}
                  </button>
                )}

                {!olympiad.isDraft && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/olympiads/${params.id}/manage`)
                    }
                    className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    К управлению олимпиадой
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
