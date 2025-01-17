'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

export default function Prizes() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const prizes = [
    {
      title: '1 место',
      medal: '🥇',
      items: [
        'Электронный сертификат на 12000 рублей на обучение в "Эффективный китайский"',
        'Комплект учебной литературы',
        'Диплом победителя',
      ],
      highlight: true,
      order: 1,
      translateY: { mobile: '0px', desktop: '0px' },
    },
    {
      title: '2 место',
      medal: '🥈',
      items: [
        'Электронный сертификат на 8000 рублей на обучение в "Эффективный китайский"',
        'Комплект учебной литературы',
        'Диплом призёра',
      ],
      order: 2,
      translateY: { mobile: '0px', desktop: '40px' },
    },
    {
      title: '3 место',
      medal: '🥉',
      items: [
        'Электронный сертификат на 4000 рублей на обучение в "Эффективный китайский"',
        'Учебное пособие',
        'Диплом призёра',
      ],
      order: 3,
      translateY: { mobile: '0px', desktop: '80px' },
    },
  ];

  return (
    <section
      className="py-12 md:py-24 bg-gradient-to-b from-red-50 to-white overflow-hidden"
      id="prizes"
      ref={ref}
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-24"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Призовой фонд
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Победители и призёры получат ценные награды
          </p>
        </motion.div>

        <div className="relative">
          <div className="flex flex-col md:flex-row flex-wrap justify-center gap-6 md:gap-8 relative z-10">
            {prizes.map((prize, index) => (
              <motion.div
                key={prize.title}
                initial={{ opacity: 0, y: 50 }}
                animate={
                  isInView
                    ? {
                        opacity: 1,
                        y: isMobile
                          ? prize.translateY.mobile
                          : prize.translateY.desktop,
                      }
                    : {}
                }
                transition={{ duration: 0.6, delay: 0.3 }}
                className={`w-full md:w-[300px] ${
                  prize.highlight && !isMobile ? 'md:-mt-8' : ''
                }`}
                style={{ order: prize.order }}
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
                    className="absolute -top-6 md:-top-8 left-1/2 transform -translate-x-1/2 text-4xl md:text-6xl"
                  >
                    {prize.medal}
                  </motion.div>

                  <div className="pt-8 md:pt-12 p-6 md:p-8">
                    <div className="text-center mb-4 md:mb-6">
                      <h3
                        className={`text-xl md:text-2xl font-bold ${
                          prize.highlight ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {prize.title}
                      </h3>
                    </div>

                    <ul className="space-y-3 md:space-y-4">
                      {prize.items.map((item, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={isInView ? { opacity: 1, x: 0 } : {}}
                          transition={{ delay: 0.7 + idx * 0.1 }}
                          className="flex items-start"
                        >
                          <span className="mr-3 text-lg md:text-xl">
                            {prize.highlight ? '★' : '•'}
                          </span>
                          <span
                            className={`text-sm md:text-base ${
                              prize.highlight ? 'text-white' : 'text-gray-600'
                            }`}
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
          className="text-center mt-12 md:mt-32"
        >
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            Все участники получат сертификаты об участии в олимпиаде
          </p>
        </motion.div>
      </div>
    </section>
  );
}
