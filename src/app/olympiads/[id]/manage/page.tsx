"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChineseLoader from "@/components/ChineseLoader";

interface Participant {
  id: string;
  fullName: string;
  email: string;
  country: string;
  city: string;
  age: number;
  educationType: string;
  grade?: string;
  institutionName?: string;
  phoneNumber: string;
  score?: string;
  place?: string;
}

interface Olympiad {
  id: string;
  title: string;
  level: string;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
  hasPrizes: boolean;
  description: string | null;
  duration: number;
  randomizeQuestions: boolean;
  questionsPerParticipant: number | null;
  price: number;
  hasQuestions: boolean;
}

interface Question {
  id: string;
  question: string;
  type: "text" | "multiple_choice" | "matching";
  choices?: string[];
  matchingPairs?: { left: string; right: string }[];
  correctAnswer: string;
  media?: {
    type: "image" | "video" | "audio";
    url: string;
  };
}

interface Prize {
  id: string;
  placement: number;
  promoCode: string | null;
}

interface PromoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (promoCode: string) => void;
  participantName: string;
  participantEmail: string;
}

const PromoCodeModal = ({ isOpen, onClose, onSubmit, participantName, participantEmail }: PromoCodeModalProps) => {
  const [promoCode, setPromoCode] = useState("");

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Отправка приза
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Участник:</p>
            <p className="font-medium text-gray-900">{participantName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email:</p>
            <p className="font-medium text-gray-900">{participantEmail}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Промокод
            </label>
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black"
              placeholder="Введите промокод"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={() => {
              onSubmit(promoCode);
              setPromoCode("");
            }}
            disabled={!promoCode.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ManageOlympiadPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [olympiad, setOlympiad] = useState<Olympiad | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEndingOlympiad, setIsEndingOlympiad] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [isPromoCodeModalOpen, setIsPromoCodeModalOpen] = useState(false);
  const [sendingPrizeForId, setSendingPrizeForId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'participants' | 'settings'>('participants');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [olympiadResponse, participantsResponse, questionsResponse, prizesResponse] = await Promise.all([
          fetch(`/api/olympiads/${params.id}`),
          fetch(`/api/olympiads/${params.id}/participants`),
          fetch(`/api/olympiads/${params.id}/questions`),
          fetch(`/api/olympiads/${params.id}/prizes`),
        ]);

        if (!olympiadResponse.ok) {
          throw new Error("Failed to fetch olympiad");
        }

        const olympiadData = await olympiadResponse.json();
        setOlympiad(olympiadData[0]);

        if (participantsResponse.ok) {
          const participantsData = await participantsResponse.json();
          setParticipants(participantsData.participants);
        }

        if (questionsResponse.ok) {
          const questionsData = await questionsResponse.json();
          setQuestions(questionsData);
        }

        if (prizesResponse.ok) {
          const prizesData = await prizesResponse.json();
          setPrizes(prizesData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleEndOlympiad = async () => {
    if (!confirm("Вы уверены, что хотите завершить олимпиаду? Это действие нельзя отменить.")) {
      return;
    }

    setIsEndingOlympiad(true);
    try {
      const response = await fetch(`/api/olympiads/${params.id}/end`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to end olympiad");
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Error ending olympiad:", error);
      alert("Ошибка при завершении олимпиады");
    } finally {
      setIsEndingOlympiad(false);
    }
  };

  const handleSendPrize = async (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsPromoCodeModalOpen(true);
  };

  const handlePromoCodeSubmit = async (promoCode: string) => {
    if (!selectedParticipant) return;

    setSendingPrizeForId(selectedParticipant.id);
    setIsPromoCodeModalOpen(false);
    
    try {
      const response = await fetch(`/api/olympiads/${params.id}/send-prizes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participantId: selectedParticipant.id,
          promoCode,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send prize");
      }

      alert("Приз успешно отправлен!");
    } catch (error) {
      console.error("Error sending prize:", error);
      alert(error instanceof Error ? error.message : "Ошибка при отправке приза");
    } finally {
      setSendingPrizeForId(null);
      setSelectedParticipant(null);
    }
  };

  if (isLoading) {
    return <ChineseLoader text="Загрузка..." />;
  }

  if (!olympiad) {
    return <ChineseLoader text="Олимпиада не найдена" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900">
      <div className="p-8 mt-[80px] md:mt-[100px]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <span className="text-red-200">汉语</span>
              <span>{olympiad.title}</span>
            </h1>
            <p className="mt-2 text-red-200/80">
              Управление олимпиадой
            </p>
          </div>

          {/* Olympiad Info */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-red-200/10 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-red-200/80">Уровень</h3>
                <p className="text-white">{olympiad.level}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-200/80">Дата начала</h3>
                <p className="text-white">{new Date(olympiad.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-200/80">Дата окончания</h3>
                <p className="text-white">{new Date(olympiad.endDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('participants')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'participants'
                  ? 'bg-red-700 text-white'
                  : 'bg-white/5 text-red-200 hover:bg-white/10'
              }`}
            >
              Участники
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'settings'
                  ? 'bg-red-700 text-white'
                  : 'bg-white/5 text-red-200 hover:bg-white/10'
              }`}
            >
              Настройки
            </button>
          </div>

          {/* Content */}
          {activeTab === 'participants' ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">
                Участники ({participants.length})
              </h2>
              {/* Existing participants list */}
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="bg-white/5 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-white">
                        {participant.fullName}
                      </h3>
                      <div className="mt-1 space-y-1 text-sm text-red-200/80">
                        <p>Email: {participant.email}</p>
                        <p>Страна: {participant.country}</p>
                        <p>Город: {participant.city}</p>
                        <p>Возраст: {participant.age} лет</p>
                        <p>Тип обучения: {participant.educationType}</p>
                        {participant.grade && (
                          <p>{participant.educationType === "school" ? "Класс" : "Курс"}: {participant.grade}</p>
                        )}
                        {participant.institutionName && (
                          <p>Учебное заведение: {participant.institutionName}</p>
                        )}
                        <p>Телефон: {participant.phoneNumber}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <div className="text-lg font-medium text-white">
                          {participant.score ? `${participant.score}%` : "Не завершено"}
                        </div>
                        {participant.place && (
                          <div className="text-sm text-red-200">
                            {participant.place} место
                          </div>
                        )}
                      </div>
                      {olympiad.hasPrizes && participant.place && parseInt(participant.place) <= 3 && (
                        <button
                          onClick={() => handleSendPrize(participant)}
                          disabled={sendingPrizeForId === participant.id}
                          className="px-3 py-1 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          {sendingPrizeForId === participant.id
                            ? "Отправка..."
                            : "Отправить приз"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {participants.length === 0 && (
                <p className="text-red-200/80">
                  Пока нет участников
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* General Settings */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-red-200/10 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Общие настройки</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-red-200/80 mb-2">Описание</h4>
                    <p className="text-white">{olympiad.description || "Нет описания"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-red-200/80 mb-2">Длительность</h4>
                    <p className="text-white">{Math.floor(olympiad.duration || 0) / 60} минут</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-red-200/80 mb-2">Случайный порядок вопросов</h4>
                    <p className="text-white">{olympiad.randomizeQuestions ? "Да" : "Нет"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-red-200/80 mb-2">Количество вопросов на участника</h4>
                    <p className="text-white">{olympiad.questionsPerParticipant || "Все вопросы"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-red-200/80 mb-2">Стоимость участия</h4>
                    <p className="text-white">{olympiad.price ? `${olympiad.price / 100} руб.` : "Бесплатно"}</p>
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-red-200/10 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Вопросы</h3>
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div key={question.id} className="p-4 bg-white/5 rounded-lg">
                      <h4 className="text-lg font-medium text-white mb-2">
                        Вопрос {index + 1}
                      </h4>
                      <div className="space-y-2">
                        <p className="text-red-200">{question.question}</p>
                        <div className="text-sm text-red-200/80">
                          <p>Тип: {
                            question.type === "text" ? "Текстовый ответ" :
                            question.type === "multiple_choice" ? "С вариантами ответа" :
                            "На сопоставление"
                          }</p>
                          {question.type === "multiple_choice" && question.choices && (
                            <div className="mt-2">
                              <p className="mb-1">Варианты ответов:</p>
                              <ul className="list-disc list-inside">
                                {question.choices.map((choice, i) => (
                                  <li key={i} className={choice === question.correctAnswer ? "text-green-400" : ""}>
                                    {choice} {choice === question.correctAnswer && "(правильный)"}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {question.type === "matching" && question.matchingPairs && (
                            <div className="mt-2">
                              <p className="mb-1">Пары для сопоставления:</p>
                              <div className="grid grid-cols-2 gap-2">
                                {question.matchingPairs.map((pair, i) => (
                                  <div key={i} className="flex gap-2">
                                    <span>{pair.left}</span>
                                    <span>→</span>
                                    <span>{pair.right}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {question.type === "text" && (
                            <div className="mt-2">
                              <p>Правильный ответ: {question.correctAnswer}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {questions.length === 0 && (
                    <p className="text-red-200/80">Вопросы не добавлены</p>
                  )}
                </div>
              </div>

              {/* Prizes */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-red-200/10 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Призы</h3>
                <div className="space-y-4">
                  {prizes.map((prize) => (
                    <div key={prize.id} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-lg font-medium text-white">
                            {prize.placement} место
                          </h4>
                          {prize.promoCode && (
                            <p className="text-sm text-red-200/80">
                              Промокод: {prize.promoCode}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {prizes.length === 0 && (
                    <p className="text-red-200/80">Призы не добавлены</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 text-sm font-medium text-red-200 bg-red-950/50 border border-red-200/20 rounded-lg hover:bg-red-900/50 transition-colors"
            >
              Назад
            </button>
            {!olympiad.isCompleted && (
              <button
                onClick={handleEndOlympiad}
                disabled={isEndingOlympiad}
                className="px-6 py-3 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isEndingOlympiad ? "Завершение..." : "Завершить олимпиаду"}
              </button>
            )}
          </div>
        </div>
      </div>

      <PromoCodeModal
        isOpen={isPromoCodeModalOpen}
        onClose={() => {
          setIsPromoCodeModalOpen(false);
          setSelectedParticipant(null);
        }}
        onSubmit={handlePromoCodeSubmit}
        participantName={selectedParticipant?.fullName || ""}
        participantEmail={selectedParticipant?.email || ""}
      />
    </div>
  );
}
