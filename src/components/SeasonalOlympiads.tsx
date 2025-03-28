'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';

type Prize = {
  placement: number;
  description: string | null;
};

type Olympiad = {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  level: string;
  price: number;
  prizes: Prize[];
};

export default function SeasonalOlympiads() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [olympiads, setOlympiads] = useState<Olympiad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOlympiads() {
      try {
        const response = await fetch('/api/olympiads/public');
        if (!response.ok) {
          throw new Error('Ошибка при загрузке данных об олимпиадах');
        }
        const data = await response.json();
        setOlympiads(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
        console.error('Ошибка при загрузке олимпиад:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOlympiads();
  }, []);

  // Format date to DD.MM.YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  // Format price from kopeks to rubles
  const formatPrice = (kopeks: number) => {
    return (kopeks / 100).toLocaleString('ru-RU') + ' ₽';
  };

  return (
    <section
      className="py-16 bg-gradient-to-b from-gray-900 to-black"
      id="olympiads"
      ref={ref}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Текущие и ближайшие олимпиады
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-400"
          >
            Проверьте свои знания китайского языка в наших олимпиадах
          </motion.p>
        </div>

        {loading ? (
          <div className="text-center text-gray-400">Загрузка олимпиад...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : olympiads.length === 0 ? (
          <div className="text-center text-gray-400">
            В настоящее время нет доступных олимпиад. Следите за обновлениями!
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {olympiads.map((olympiad, index) => (
              <motion.div
                key={olympiad.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 text-left group hover:bg-gray-800/70 transition-all duration-300 flex flex-col h-full"
              >
                <h3 className="text-xl font-bold text-white mb-2">
                  {olympiad.title}
                </h3>
                <div className="text-red-500 font-semibold mb-2">
                  {formatDate(olympiad.startDate)} -{' '}
                  {formatDate(olympiad.endDate)}
                </div>
                <div className="text-yellow-500 font-semibold mb-2">
                  Уровень: {olympiad.level}
                </div>
                {olympiad.price > 0 && (
                  <div className="text-green-500 font-semibold mb-2">
                    Стоимость: {formatPrice(olympiad.price)}
                  </div>
                )}
                {olympiad.price === 0 && (
                  <div className="text-green-500 font-semibold mb-2">
                    Бесплатно
                  </div>
                )}
                <p className="text-gray-400 mb-4 flex-grow">
                  {olympiad.description || 'Описание отсутствует'}
                </p>

                {olympiad.prizes && olympiad.prizes.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-white font-semibold mb-2">Призы:</h4>
                    <ul className="text-gray-400 list-disc list-inside">
                      {olympiad.prizes.map((prize) => (
                        <li key={prize.placement}>
                          {prize.placement === 1
                            ? '1-е место'
                            : prize.placement === 2
                            ? '2-е место'
                            : prize.placement === 3
                            ? '3-е место'
                            : `${prize.placement}-е место`}
                          {prize.description ? `: ${prize.description}` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-auto">
                  <Link
                    href={`/olympiads/${olympiad.id}`}
                    className="block text-center text-white bg-red-600 hover:bg-red-700 py-2 px-4 rounded transition-colors duration-300 mt-2"
                  >
                    Подробнее
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center mt-12"
        >
          <p className="text-gray-400">
            Для участия в олимпиадах необходимо{' '}
            <Link
              href="/register"
              className="text-red-500 hover:text-red-400 transition-colors"
            >
              зарегистрироваться
            </Link>{' '}
            или{' '}
            <Link
              href="/login"
              className="text-red-500 hover:text-red-400 transition-colors"
            >
              войти
            </Link>{' '}
            в свой аккаунт
          </p>
        </motion.div>
      </div>
    </section>
  );
}
