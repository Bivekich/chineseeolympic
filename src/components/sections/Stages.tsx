'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export default function Stages() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const stages = [
    {
      title: 'Регистрация и прохождение',
      date: '1-30 сентября',
      description: 'Регистрация на платформе и выполнение олимпиадных заданий',
      icon: '🎯',
      details: [
        'Создание личного кабинета',
        'Выбор уровня сложности',
        'Выполнение заданий онлайн',
      ],
    },
    {
      title: 'Подведение итогов',
      date: '1-7 октября',
      description: 'Проверка работ и объявление победителей',
      icon: '🏆',
      details: [
        'Проверка работ экспертами',
        'Публикация результатов',
        'Награждение победителей',
      ],
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { x: -50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section className="py-24 bg-white" id="stages" ref={ref}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Этапы олимпиады
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Путь к победе состоит из трёх этапов
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="relative"
        >
          {/* Линия прогресса */}
          <div className="absolute left-[50%] top-0 bottom-0 w-0.5 bg-gray-200 hidden md:block" />

          {stages.map((stage, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="relative mb-16 last:mb-0"
            >
              <div
                className={`flex items-center gap-8 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Точка на линии */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : {}}
                  transition={{ delay: 0.5 + index * 0.2 }}
                  className="absolute left-[50%] transform -translate-x-1/2 hidden md:block"
                >
                  <div className="w-6 h-6 rounded-full bg-red-600 border-4 border-white shadow-lg" />
                </motion.div>

                {/* Контент */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`flex-1 ${
                    index % 2 === 0 ? 'md:text-right' : 'md:text-left'
                  }`}
                >
                  <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center gap-4 mb-4 text-red-600">
                      <span className="text-4xl">{stage.icon}</span>
                      <div className="bg-red-100 px-4 py-1 rounded-full text-sm font-semibold">
                        {stage.date}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {stage.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{stage.description}</p>
                    <ul className="space-y-2">
                      {stage.details.map((detail, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={isInView ? { opacity: 1, x: 0 } : {}}
                          transition={{ delay: 0.7 + idx * 0.1 + index * 0.2 }}
                          className="flex items-center gap-2 text-gray-600"
                        >
                          <span className="text-red-500">•</span>
                          {detail}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="text-center mt-16"
        >
          <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-300">
            Зарегистрироваться
          </button>
        </motion.div>
      </div>
    </section>
  );
}
