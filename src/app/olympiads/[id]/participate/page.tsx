"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Olympiad {
  id: string;
  title: string;
  level: string;
  startDate: string;
  endDate: string;
}

type EducationType = "school" | "university" | "none";

export default function ParticipateForm({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [olympiad, setOlympiad] = useState<Olympiad | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [educationType, setEducationType] = useState<EducationType>("none");
  const [grade, setGrade] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    const fetchOlympiad = async () => {
      try {
        const response = await fetch(`/api/olympiads/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch olympiad");
        }
        const data = await response.json();
        setOlympiad(data);
      } catch (error) {
        console.error("Error fetching olympiad:", error);
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
      const response = await fetch(`/api/olympiads/${params.id}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          educationType,
          grade: educationType !== "none" ? grade : undefined,
          institutionName:
            educationType !== "none" ? institutionName : undefined,
          phoneNumber,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to register");
      }

      // Redirect to the actual olympiad page
      router.push(`/olympiads/${params.id}/start`);
    } catch (error) {
      console.error("Error registering:", error);
      alert("Ошибка при регистрации");
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

  if (!olympiad) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900">
      <div className="p-8 mt-[80px] md:mt-[100px]">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <span className="text-red-200">汉语</span>
              <span>{olympiad.title}</span>
            </h1>
            <p className="mt-2 text-red-200/80">
              Пожалуйста, заполните информацию о себе перед началом олимпиады
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-red-200/10 p-6">
              <div className="space-y-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-red-200 mb-2">
                    ФИО
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-red-200/10 rounded-lg text-white placeholder-red-200/50 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Введите ваше полное имя"
                    required
                  />
                </div>

                {/* Education Type */}
                <div>
                  <label className="block text-sm font-medium text-red-200 mb-2">
                    Место обучения
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        value="school"
                        checked={educationType === "school"}
                        onChange={(e) =>
                          setEducationType(e.target.value as EducationType)
                        }
                        className="text-red-500 focus:ring-red-500"
                      />
                      <span className="text-red-200">Школа</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        value="university"
                        checked={educationType === "university"}
                        onChange={(e) =>
                          setEducationType(e.target.value as EducationType)
                        }
                        className="text-red-500 focus:ring-red-500"
                      />
                      <span className="text-red-200">Университет</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        value="none"
                        checked={educationType === "none"}
                        onChange={(e) =>
                          setEducationType(e.target.value as EducationType)
                        }
                        className="text-red-500 focus:ring-red-500"
                      />
                      <span className="text-red-200">Не учусь</span>
                    </label>
                  </div>
                </div>

                {/* Conditional Fields for School/University */}
                {educationType !== "none" && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-red-200 mb-2">
                        {educationType === "school" ? "Класс" : "Курс"}
                      </label>
                      <input
                        type="text"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-red-200/10 rounded-lg text-white placeholder-red-200/50 focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder={
                          educationType === "school"
                            ? "Например: 11"
                            : "Например: 2"
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-red-200 mb-2">
                        {educationType === "school"
                          ? "Название школы"
                          : "Название университета"}
                      </label>
                      <input
                        type="text"
                        value={institutionName}
                        onChange={(e) => setInstitutionName(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-red-200/10 rounded-lg text-white placeholder-red-200/50 focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Введите название учебного заведения"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-red-200 mb-2">
                    Номер телефона
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-red-200/10 rounded-lg text-white placeholder-red-200/50 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="+7 (999) 999-99-99"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 text-sm font-medium text-red-200 bg-red-950/50 border border-red-200/20 rounded-lg hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-800 focus:ring-red-500 transition-colors"
              >
                Назад
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-800 focus:ring-red-500 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Подождите..." : "Начать олимпиаду"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
