'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const seasons = [
  {
    name: 'Осенняя олимпиада',
    period: 'Сентябрь - Ноябрь',
    description: 'Начните учебный год с проверки своих знаний китайского языка',
    icon: '🍁',
  },
  {
    name: 'Зимняя олимпиада',
    period: 'Декабрь - Февраль',
    description: 'Завершите год достижением новых высот в изучении китайского',
    icon: '❄️',
  },
  {
    name: 'Весенняя олимпиада',
    period: 'Март - Май',
    description: 'Встречайте весну с новыми успехами в китайском языке',
    icon: '🌸',
  },
];

export default function SeasonalOlympiads() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section
      className="py-16 bg-gradient-to-b from-gray-900 to-black"
      id="stages"
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
            Сезонные олимпиады
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-400"
          >
            Выберите удобное время для участия в олимпиаде
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {seasons.map((season, index) => (
            <motion.div
              key={season.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 text-center group hover:bg-gray-800/70 transition-all duration-300"
            >
              <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                {season.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {season.name}
              </h3>
              <p className="text-red-500 font-semibold mb-4">{season.period}</p>
              <p className="text-gray-400">{season.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center mt-12"
        >
          <p className="text-gray-400">
            Точные даты проведения и регистрации на олимпиады доступны в{' '}
            <a
              href="/dashboard"
              className="text-red-500 hover:text-red-400 transition-colors"
            >
              личном кабинете
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
