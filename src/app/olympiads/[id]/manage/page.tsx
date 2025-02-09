"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Participant {
  id: string;
  userId: string;
  score: string;
  completedAt: string;
  user: {
    email: string;
  };
}

interface Olympiad {
  id: string;
  title: string;
  level: string;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
}

export default function ManageOlympiadPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [olympiad, setOlympiad] = useState<Olympiad | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    fetchOlympiadData();
  }, [params.id]);

  const fetchOlympiadData = async () => {
    try {
      const [olympiadResponse, participantsResponse] = await Promise.all([
        fetch(`/api/olympiads/${params.id}`),
        fetch(`/api/olympiads/${params.id}/participants`),
      ]);

      if (olympiadResponse.ok && participantsResponse.ok) {
        const olympiadData = await olympiadResponse.json();
        const participantsData = await participantsResponse.json();
        setOlympiad(olympiadData);
        setParticipants(participantsData);
      }
    } catch (error) {
      console.error("Error fetching olympiad data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalizeResults = async () => {
    if (
      !confirm(
        "Вы уверены, что хотите подвести итоги? Это действие нельзя отменить."
      )
    ) {
      return;
    }

    setIsFinalizing(true);
    try {
      const response = await fetch(`/api/olympiads/${params.id}/finalize`, {
        method: "POST",
      });

      if (response.ok) {
        await fetchOlympiadData();
        alert("Итоги подведены успешно. Участникам отправлены уведомления.");
      } else {
        const error = await response.json();
        alert(error.message || "Произошла ошибка при подведении итогов");
      }
    } catch (error) {
      console.error("Error finalizing results:", error);
      alert("Произошла ошибка при подведении итогов");
    } finally {
      setIsFinalizing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 mt-[80px] md:mt-[100px]">
        <div className="max-w-4xl mx-auto">
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!olympiad) {
    return (
      <div className="min-h-screen p-8 mt-[80px] md:mt-[100px]">
        <div className="max-w-4xl mx-auto">
          <p>Олимпиада не найдена</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 mt-[80px] md:mt-[100px]">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">{olympiad.title}</h1>
            {!olympiad.isCompleted && (
              <button
                onClick={handleFinalizeResults}
                disabled={isFinalizing || participants.length === 0}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                  isFinalizing || participants.length === 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isFinalizing ? "Подведение итогов..." : "Подвести итоги"}
              </button>
            )}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <p>Уровень: {olympiad.level}</p>
            <p>
              Период: {new Date(olympiad.startDate).toLocaleDateString()} -{" "}
              {new Date(olympiad.endDate).toLocaleDateString()}
            </p>
            <p>Статус: {olympiad.isCompleted ? "Завершена" : "Активна"}</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Участники</h2>
          {participants.length === 0 ? (
            <p className="text-gray-600">Пока нет участников</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Балл
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата прохождения
                    </th>
                    {olympiad.isCompleted && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Место
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {participants.map((participant) => (
                    <tr key={participant.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {participant.user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {participant.score}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(participant.completedAt).toLocaleString()}
                      </td>
                      {olympiad.isCompleted && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {participant.place}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
