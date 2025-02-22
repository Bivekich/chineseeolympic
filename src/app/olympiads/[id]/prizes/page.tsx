"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChineseLoader from "@/components/ChineseLoader";

interface Prize {
  id?: string;
  placement: number;
  promoCode?: string | null;
  description?: string;
}

interface Olympiad {
  id: string;
  title: string;
  level: string;
  startDate: string;
  endDate: string;
  isDraft: boolean;
  hasQuestions: boolean;
  hasPrizes: boolean;
}

export default function PrizesPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [olympiad, setOlympiad] = useState<Olympiad | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([
    { placement: 1, description: "Первое место" },
    { placement: 2, description: "Второе место" },
    { placement: 3, description: "Третье место" },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOlympiad = async () => {
      try {
        const [olympiadResponse, prizesResponse] = await Promise.all([
          fetch(`/api/olympiads/${params.id}`),
          fetch(`/api/olympiads/${params.id}/prizes`),
        ]);

        if (olympiadResponse.ok) {
          const olympiadData = await olympiadResponse.json();
          setOlympiad(olympiadData);

          if (prizesResponse.ok) {
            const prizesData = await prizesResponse.json();
            if (prizesData.length > 0) {
              setPrizes(prizesData);
            }
          }
        } else {
          const error = await olympiadResponse.json();
          throw new Error(error.message || "Failed to fetch olympiad");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error instanceof Error ? error.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOlympiad();
  }, [params.id]);

  const handlePrizeChange = (
    index: number,
    field: keyof Prize,
    value: string
  ) => {
    const newPrizes = [...prizes];
    newPrizes[index] = {
      ...newPrizes[index],
      [field]: field === "placement" ? parseInt(value) : value,
    };
    setPrizes(newPrizes);
  };

  const addPrize = () => {
    setPrizes([
      ...prizes,
      {
        placement: prizes.length + 1,
        description: `${prizes.length + 1}-е место`,
      },
    ]);
  };

  const removePrize = (index: number) => {
    if (prizes.length > 1) {
      const newPrizes = prizes.filter((_, i) => i !== index);
      setPrizes(newPrizes);
    }
  };

  const handleSubmit = async (publish: boolean = false) => {
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch(`/api/olympiads/${params.id}/prizes`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prizes: prizes.map(prize => ({
            ...prize,
            promoCode: prize.promoCode || null,
          })),
          publish,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save prizes");
      }

      if (publish) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const verifyResponse = await fetch(`/api/olympiads/${params.id}`);
        if (!verifyResponse.ok) {
          throw new Error("Failed to verify olympiad state");
        }
        const olympiadState = await verifyResponse.json();
        if (!olympiadState.hasPrizes || olympiadState.isDraft) {
          throw new Error("Failed to update olympiad state");
        }
        router.push("/dashboard");
      } else {
        alert("Призы сохранены");
      }
    } catch (error) {
      console.error("Error saving prizes:", error);
      setError(error instanceof Error ? error.message : "Failed to save prizes");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <ChineseLoader text="Загрузка..." />;
  }

  if (error) {
    return <ChineseLoader text={error} />;
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
              <span className="text-gray-800">{olympiad.title}</span>
            </h1>
            <p className="mt-2 text-gray-600">Укажите описание для каждого призового места. Промокоды указывать не надо.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8">
            <form className="space-y-6">
              {prizes.map((prize, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-xl p-6 space-y-4 relative"
                >
                  <div className="absolute top-4 right-4">
                    {prizes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePrize(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        Удалить
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Описание
                      </label>
                      <input
                        type="text"
                        required
                        value={prize.description || ""}
                        onChange={(e) =>
                          handlePrizeChange(index, "description", e.target.value)
                        }
                        placeholder="Например: Первое место - Промокод на 1000 рублей"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-gray-900 placeholder-gray-500"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addPrize}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors"
              >
                + Добавить приз
              </button>

              <div className="flex justify-end space-x-4 mt-8">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Назад
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={isSaving || !olympiad?.hasQuestions}
                  className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-800 to-red-700 rounded-lg hover:from-red-700 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-lg transform transition hover:-translate-y-0.5"
                >
                  {isSaving ? "Сохранение..." : "Опубликовать"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
