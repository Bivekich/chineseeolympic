'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const steps = [
    {
      number: '01',
      title: 'Регистрация',
      description:
        'Создайте личный кабинет участника олимпиады и заполните профиль',
      icon: '🎯',
    },
    {
      number: '02',
      title: 'Выбор уровня',
      description:
        'Выберите свой уровень владения китайским языком: начинающий, средний или продвинутый',
      icon: '📊',
    },
    {
      number: '03',
      title: 'Подготовка',
      description: 'Ознакомьтесь с форматом заданий и пройдите пробный тест',
      icon: '📝',
    },
    {
      number: '04',
      title: 'Участие',
      description:
        'Выполните задания олимпиады в указанное время и получите результаты',
      icon: '🏆',
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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section className="py-20 bg-gray-50" id="how-it-works" ref={ref}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Как это работает
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Четыре простых шага к участию в олимпиаде
          </p>
        </motion.div>

        <div className="relative">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10"
          >
            {steps.map((step, index) => (
              <motion.div key={index} variants={itemVariants} className="flex">
                <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">{step.icon}</span>
                    <span className="text-2xl font-bold text-red-600">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 flex-grow">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Стрелки между карточками */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 transform -translate-y-1/2 z-0">
            <div className="grid grid-cols-4 gap-8">
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.8 + index * 0.2 }}
                  className="flex justify-center items-center col-span-1"
                >
                  <div className="w-full flex justify-center items-center">
                    <svg
                      className="w-8 h-8 text-red-600 opacity-50 transform translate-x-full"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-center mt-16"
        >
          <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-300">
            Начать участие
          </button>
        </motion.div>
      </div>
    </section>
  );
}
