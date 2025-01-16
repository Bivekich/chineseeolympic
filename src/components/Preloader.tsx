'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function Preloader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // 2 секунды для демонстрации загрузки

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-red-900"
        >
          <div className="text-center">
            {/* Анимированный логотип */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <span className="text-6xl font-bold text-white">汉语之星</span>
            </motion.div>

            {/* Анимированные иероглифы */}
            <div className="flex justify-center space-x-2 mb-8">
              {['学', '习', '中', '文'].map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    repeat: Infinity,
                    repeatDelay: 0.5,
                  }}
                  className="text-2xl text-red-200"
                >
                  {char}
                </motion.span>
              ))}
            </div>

            {/* Индикатор загрузки */}
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: 'easeInOut' }}
              className="h-1 bg-red-500 rounded-full max-w-[200px] mx-auto"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
