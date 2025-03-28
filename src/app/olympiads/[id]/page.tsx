import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { olympiads, prizes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const olympiad = await db.query.olympiads.findFirst({
    where: eq(olympiads.id, params.id),
  });

  if (!olympiad) {
    return {
      title: 'Олимпиада не найдена',
    };
  }

  return {
    title: `${olympiad.title} | Китайская олимпиада`,
    description: olympiad.description || 'Подробная информация об олимпиаде',
  };
}

export default async function OlympiadPage({ params }: PageProps) {
  const olympiad = await db.query.olympiads.findFirst({
    where: eq(olympiads.id, params.id),
  });

  if (!olympiad) {
    notFound();
  }

  const olympiadPrizes = await db
    .select({
      id: prizes.id,
      placement: prizes.placement,
      description: prizes.description,
    })
    .from(prizes)
    .where(eq(prizes.olympiadId, olympiad.id))
    .orderBy(prizes.placement);

  // Проверка доступности олимпиады (не черновик и начало в прошлом или будущем)
  const currentDate = new Date();
  const isAvailable = !olympiad.isDraft;
  const hasStarted = new Date(olympiad.startDate) <= currentDate;
  const hasEnded = new Date(olympiad.endDate) < currentDate;

  // Форматирование даты в формат DD.MM.YYYY
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ru-RU');
  };

  // Преобразование цены из копеек в рубли
  const formatPrice = (kopeks: number) => {
    return (kopeks / 100).toLocaleString('ru-RU') + ' ₽';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link
          href="/"
          className="text-red-500 hover:text-red-400 transition-colors flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Вернуться на главную
        </Link>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-4">{olympiad.title}</h1>

        <div className="bg-gray-700/50 p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-300 mb-2">
              <span className="font-semibold">Период проведения:</span>{' '}
              {formatDate(olympiad.startDate)} - {formatDate(olympiad.endDate)}
            </p>
            <p className="text-gray-300 mb-2">
              <span className="font-semibold">Уровень сложности:</span>{' '}
              {olympiad.level}
            </p>
            <p className="text-gray-300 mb-2">
              <span className="font-semibold">Стоимость участия:</span>{' '}
              {olympiad.price > 0 ? formatPrice(olympiad.price) : 'Бесплатно'}
            </p>
          </div>
          <div>
            <p className="text-gray-300 mb-2">
              <span className="font-semibold">Продолжительность:</span>{' '}
              {Math.floor(olympiad.duration / 3600)} ч{' '}
              {Math.floor((olympiad.duration % 3600) / 60)} мин
            </p>
            {olympiad.questionsPerParticipant && (
              <p className="text-gray-300 mb-2">
                <span className="font-semibold">Количество вопросов:</span>{' '}
                {olympiad.questionsPerParticipant}
              </p>
            )}
            <p className="text-gray-300 mb-2">
              <span className="font-semibold">Статус:</span>{' '}
              {hasEnded
                ? 'Олимпиада завершена'
                : hasStarted
                ? 'Олимпиада идет'
                : 'Олимпиада еще не началась'}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Описание</h2>
          <div className="prose prose-invert prose-lg max-w-none">
            <p className="text-gray-300 whitespace-pre-line">
              {olympiad.description || 'Описание отсутствует'}
            </p>
          </div>
        </div>

        {olympiadPrizes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Призы</h2>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <ul className="space-y-2">
                {olympiadPrizes.map((prize) => (
                  <li key={prize.id} className="flex items-start gap-3">
                    <div className="font-bold text-yellow-500 min-w-[80px]">
                      {prize.placement === 1
                        ? '1-е место'
                        : prize.placement === 2
                        ? '2-е место'
                        : prize.placement === 3
                        ? '3-е место'
                        : `${prize.placement}-е место`}
                    </div>
                    <div className="text-gray-300">{prize.description}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href="/register"
            className="text-center text-white bg-red-600 hover:bg-red-700 py-3 px-6 rounded transition-colors duration-300 font-medium"
          >
            Зарегистрироваться для участия
          </Link>
          <Link
            href="/login"
            className="text-center text-white bg-gray-700 hover:bg-gray-600 py-3 px-6 rounded transition-colors duration-300 font-medium"
          >
            Войти в личный кабинет
          </Link>
        </div>
      </div>
    </div>
  );
}
