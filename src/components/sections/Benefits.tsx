'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export default function Benefits() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const benefits = [
    {
      title: 'Развитие навыков',
      description:
        'Улучшите владение китайским языком через практические задания разного уровня сложности',
      icon: '📚',
      color: 'from-red-500 to-red-600',
    },
    {
      title: 'Сертификация',
      description:
        'Получите официальный сертификат участника олимпиады для вашего портфолио',
      icon: '🎓',
      color: 'from-yellow-500 to-yellow-600',
    },
    {
      title: 'Конкуренция',
      description:
        'Соревнуйтесь с участниками со всей России и проверьте свой уровень знаний',
      icon: '🏆',
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Networking',
      description:
        'Познакомьтесь с единомышленниками и расширьте свой круг общения',
      icon: '🤝',
      color: 'from-blue-500 to-blue-600',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <section
      className="py-24 bg-gradient-to-b from-gray-50 to-white"
      id="benefits"
      ref={ref}
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Преимущества участия
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Откройте для себя новые возможности в изучении китайского языка
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="relative group"
            >
              <div
                className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl -m-1 p-1"
                style={{
                  backgroundImage: `linear-gradient(to right, ${benefit.color})`,
                }}
              ></div>
              <div className="relative bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
