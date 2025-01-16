'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export default function Prizes() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const prizes = [
    {
      title: '2 место',
      medal: '🥈',
      items: [
        'Электронный сертификат на 20000 рублей',
        'Полугодовая подписка на образовательную платформу',
        'Комплект учебной литературы',
        'Диплом призёра',
      ],
      order: 1,
      translateY: '40px',
    },
    {
      title: '1 место',
      medal: '🥇',
      items: [
        'Электронный сертификат на 30000 рублей',
        'Годовая подписка на образовательную платформу',
        'Комплект учебной литературы',
        'Диплом победителя',
      ],
      highlight: true,
      order: 2,
      translateY: '0px',
    },
    {
      title: '3 место',
      medal: '🥉',
      items: [
        'Электронный сертификат на 10000 рублей',
        'Трёхмесячная подписка на образовательную платформу',
        'Учебное пособие',
        'Диплом призёра',
      ],
      order: 3,
      translateY: '80px',
    },
  ];

  return (
    <section
      className="py-24 bg-gradient-to-b from-red-50 to-white overflow-hidden"
      id="prizes"
      ref={ref}
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-24"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Призовой фонд
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Победители и призёры получат ценные награды
          </p>
        </motion.div>

        <div className="relative">
          {/* Пьедестал */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-5xl h-48 flex justify-center items-end"
          >
            <div className="relative w-full flex justify-center items-end gap-4">
              <div className="w-1/3 h-32 bg-gradient-to-t from-gray-200 to-gray-100 rounded-t-lg" />
              <div className="w-1/3 h-40 bg-gradient-to-t from-red-600 to-red-500 rounded-t-lg" />
              <div className="w-1/3 h-24 bg-gradient-to-t from-gray-200 to-gray-100 rounded-t-lg" />
            </div>
          </motion.div>

          {/* Призовые карточки */}
          <div className="grid grid-cols-3 gap-8 relative z-10">
            {prizes.map((prize, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 100 }}
                animate={isInView ? { opacity: 1, y: prize.translateY } : {}}
                transition={{ duration: 0.6, delay: 0.2 * index }}
                style={{ order: prize.order }}
                className="relative"
              >
                <motion.div
                  whileHover={{ y: -5 }}
                  className={`relative rounded-xl ${
                    prize.highlight
                      ? 'bg-gradient-to-br from-red-600 to-red-700 text-white'
                      : 'bg-white'
                  } shadow-lg hover:shadow-xl transition-all duration-300`}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.2 }}
                    className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-6xl"
                  >
                    {prize.medal}
                  </motion.div>

                  <div className="pt-12 p-8">
                    <div className="text-center mb-6">
                      <h3
                        className={`text-2xl font-bold ${
                          prize.highlight ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {prize.title}
                      </h3>
                    </div>

                    <ul className="space-y-4">
                      {prize.items.map((item, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={isInView ? { opacity: 1, x: 0 } : {}}
                          transition={{ delay: 0.7 + idx * 0.1 }}
                          className="flex items-start"
                        >
                          <span className="mr-3 text-xl">
                            {prize.highlight ? '★' : '•'}
                          </span>
                          <span
                            className={
                              prize.highlight ? 'text-white' : 'text-gray-600'
                            }
                          >
                            {item}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="text-center mt-32"
        >
          <p className="text-gray-600 max-w-2xl mx-auto">
            Все участники получат сертификаты об участии в олимпиаде
          </p>
        </motion.div>
      </div>
    </section>
  );
}
