'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChineseLoader from '@/components/ChineseLoader';

interface Olympiad {
  id: string;
  title: string;
  description: string | null;
  level: string;
  startDate: string;
  endDate: string;
  isDraft: boolean;
  isCompleted: boolean;
  duration: number;
  randomizeQuestions: boolean;
  questionsPerParticipant: number | null;
  price: number;
}

export default function EditOlympiadPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [olympiad, setOlympiad] = useState<Olympiad | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState(7200); // Default 2 hours
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [questionsPerParticipant, setQuestionsPerParticipant] = useState<
    number | null
  >(null);
  const [price, setPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [hasParticipants, setHasParticipants] = useState(false);

  useEffect(() => {
    const fetchOlympiad = async () => {
      try {
        const response = await fetch(`/api/olympiads/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched olympiad data:', data);
          setOlympiad(data[0]);
          setTitle(data[0].title);
          setDescription(data[0].description ?? '');
          setLevel(data[0].level);
          setStartDate(new Date(data[0].startDate).toISOString().split('T')[0]);
          setEndDate(new Date(data[0].endDate).toISOString().split('T')[0]);
          setDuration(data[0].duration);
          setRandomizeQuestions(data[0].randomizeQuestions);
          setQuestionsPerParticipant(data[0].questionsPerParticipant);
          setPrice(data[0].price);
          setIsPublished(!data[0].isDraft);

          // Проверяем есть ли участники, если олимпиада опубликована
          if (!data[0].isDraft) {
            const participantsResponse = await fetch(
              `/api/olympiads/${params.id}/participants`
            );
            if (participantsResponse.ok) {
              const participantsData = await participantsResponse.json();
              setHasParticipants(
                participantsData.participants &&
                  participantsData.participants.length > 0
              );
            }
          }
        } else {
          throw new Error('Failed to fetch olympiad');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/olympiads/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          level,
          startDate,
          endDate,
          isDraft: olympiad?.isDraft,
          duration,
          randomizeQuestions,
          questionsPerParticipant,
          price,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update olympiad');
      }

      alert('Олимпиада успешно обновлена');

      if (olympiad?.isDraft) {
        router.push(`/olympiads/${params.id}/questions`);
      } else {
        router.push(`/dashboard`);
      }
    } catch (error) {
      console.error('Error updating olympiad:', error);
      alert(
        error instanceof Error ? error.message : 'Failed to update olympiad'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <ChineseLoader text="Загрузка..." />;
  }

  if (!olympiad) {
    return <ChineseLoader text="Олимпиада не найдена" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      <div className="p-8 mt-[80px] md:mt-[100px]">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <span className="text-red-800">汉语</span>
              <span className="text-gray-800">Редактирование олимпиады</span>
            </h1>
            <p className="mt-2 text-gray-600">
              Измените информацию об олимпиаде
            </p>
          </div>

          {isPublished && (
            <div className="mb-6 bg-amber-50 border-l-4 border-amber-400 p-4 text-amber-800 rounded">
              <h3 className="font-bold text-amber-900">Внимание!</h3>
              <p>Эта олимпиада уже опубликована и доступна для участников.</p>
              {hasParticipants && (
                <p className="mt-2">
                  <span className="font-semibold">Важно:</span> У этой олимпиады
                  уже есть зарегистрированные участники, поэтому некоторые
                  изменения могут повлиять на их опыт.
                </p>
              )}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8"
          >
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название олимпиады
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-gray-900 placeholder-gray-500"
                  placeholder="Например: Осенняя олимпиада 2024"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-gray-900 placeholder-gray-500"
                  placeholder="Опишите олимпиаду..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Уровень сложности
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-gray-900"
                  required
                >
                  <option value="">Выберите уровень</option>
                  <option value="Начальный">Начальный</option>
                  <option value="Средний">Средний</option>
                  <option value="Продвинутый">Продвинутый</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата начала
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-gray-900"
                    required
                    disabled={isPublished && hasParticipants}
                  />
                  {isPublished && hasParticipants && (
                    <p className="text-xs text-amber-600 mt-1">
                      Нельзя изменить дату начала после регистрации участников
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата окончания
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-gray-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Длительность (в минутах)
                </label>
                <input
                  type="number"
                  value={duration / 60}
                  onChange={(e) => setDuration(parseInt(e.target.value) * 60)}
                  min="1"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-gray-900"
                  required
                  disabled={isPublished && hasParticipants}
                />
                {isPublished && hasParticipants && (
                  <p className="text-xs text-amber-600 mt-1">
                    Нельзя изменить длительность после регистрации участников
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Количество вопросов на участника
                </label>
                <input
                  type="number"
                  value={questionsPerParticipant || ''}
                  onChange={(e) =>
                    setQuestionsPerParticipant(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  min="1"
                  placeholder="Оставьте пустым для всех вопросов"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-gray-900"
                  disabled={isPublished && hasParticipants}
                />
                {isPublished && hasParticipants && (
                  <p className="text-xs text-amber-600 mt-1">
                    Нельзя изменить количество вопросов после регистрации
                    участников
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Стоимость участия (в рублях)
                </label>
                <input
                  type="number"
                  value={price / 100}
                  onChange={(e) =>
                    setPrice(Math.round(parseFloat(e.target.value) * 100))
                  }
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-gray-900"
                  required
                  disabled={isPublished && hasParticipants}
                />
                {isPublished && hasParticipants && (
                  <p className="text-xs text-amber-600 mt-1">
                    Нельзя изменить стоимость после регистрации участников
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  id="randomize"
                  checked={randomizeQuestions}
                  onChange={(e) => setRandomizeQuestions(e.target.checked)}
                  className="h-5 w-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  disabled={isPublished && hasParticipants}
                />
                <label
                  htmlFor="randomize"
                  className="text-sm font-medium text-gray-700"
                >
                  Случайный порядок вопросов
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400"
                >
                  {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
          </form>

          {olympiad.isDraft ? (
            <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4 text-blue-800 rounded">
              <h3 className="font-bold">Следующие шаги</h3>
              <p>После сохранения изменений вы сможете:</p>
              <ul className="list-disc list-inside mt-2">
                <li>Добавить вопросы для олимпиады</li>
                <li>Настроить призы для победителей</li>
                <li>Опубликовать олимпиаду для участников</li>
              </ul>
            </div>
          ) : !olympiad.isCompleted ? (
            <div className="mt-6 bg-green-50 border-l-4 border-green-400 p-4 text-green-800 rounded">
              <h3 className="font-bold">Олимпиада активна</h3>
              <p>
                Ваши изменения будут применены немедленно и станут видны всем
                участникам.
              </p>
              <button
                onClick={() => router.push(`/olympiads/${params.id}/manage`)}
                className="mt-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
              >
                Перейти к управлению
              </button>
            </div>
          ) : (
            <div className="mt-6 bg-gray-50 border-l-4 border-gray-400 p-4 text-gray-800 rounded">
              <h3 className="font-bold">Олимпиада завершена</h3>
              <p>
                Эта олимпиада уже завершена. Вы можете изменить данные, но это
                не повлияет на результаты.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
