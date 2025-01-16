'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-red-900 via-red-800 to-red-900">
      {/* Декоративные элементы */}
      <div className="absolute inset-0 opacity-10">
        <Image
          src="/chinese-pattern.png"
          alt="Chinese Pattern"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Плавающие иероглифы */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 pointer-events-none"
      >
        {['学', '习', '中', '文'].map((char, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 100 }}
            animate={{
              opacity: 0.3,
              y: [-20, 20],
              x: Math.sin(i) * 10,
            }}
            transition={{
              y: {
                duration: 3,
                repeat: Infinity,
                repeatType: 'reverse',
                delay: i * 0.2,
              },
              opacity: { duration: 1, delay: i * 0.2 },
            }}
            className="absolute text-8xl text-white font-bold"
            style={{
              left: `${20 + i * 25}%`,
              top: `${30 + (i % 2) * 40}%`,
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            {char}
          </motion.div>
        ))}
      </motion.div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-7xl font-bold text-white mb-6">
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="block mb-4 text-red-200"
            >
              汉语之星
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="block text-4xl"
            >
              Олимпиада по китайскому языку
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="text-xl text-red-100/90 mb-12 max-w-2xl mx-auto"
          >
            Раскройте свой потенциал в изучении китайского языка и культуры
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="flex gap-6 justify-center"
          >
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-red-500 hover:bg-red-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Регистрация
              </motion.button>
            </Link>
            <Link href="#benefits">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Узнать больше
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-white/70"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}
