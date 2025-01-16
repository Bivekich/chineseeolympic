'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function NotFound() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const characters = ['4', '0', '4', '页', '面', '未', '找', '到'];

  useEffect(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center px-4">
      <div className="text-center">
        {/* Анимированные иероглифы */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="mb-8 relative h-24"
        >
          {characters.map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 50 }}
              animate={{
                opacity: 1,
                y: 0,
                rotate: [-10, 10, 0],
              }}
              transition={{
                duration: 0.8,
                delay: i * 0.1,
                rotate: {
                  duration: 1.5,
                  delay: i * 0.1,
                  ease: 'easeOut',
                },
              }}
              className={`inline-block mx-1 text-5xl font-bold ${
                i < 3 ? 'text-red-200' : 'text-white'
              }`}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>

        {/* Основной контент */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-white mb-4">
            Страница не найдена
          </h1>
          <p className="text-red-100 mb-8 max-w-md mx-auto">
            Возможно, страница была удалена или её адрес был изменён. Не
            волнуйтесь, вы всегда можете вернуться на главную страницу.
          </p>

          <div className="space-y-4">
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-red-500 hover:bg-red-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Вернуться на главную
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Декоративные элементы */}
        {dimensions.width > 0 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0.1, 0.3, 0.1],
                  scale: 1,
                  x: Math.random() * dimensions.width * 0.8,
                  y: Math.random() * dimensions.height * 0.8,
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
                className="absolute text-2xl text-white opacity-10"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
              >
                学
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
