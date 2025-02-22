"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-red-900 via-red-800 to-red-900 px-4 py-20 md:py-0">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.1]">
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
        className="absolute inset-0 pointer-events-none hidden md:block"
      >
        {["学", "习", "中", "文"].map((char, i) => (
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
                repeatType: "reverse",
                delay: i * 0.2,
              },
              opacity: { duration: 1, delay: i * 0.2 },
            }}
            className="absolute text-6xl md:text-8xl text-white font-bold"
            style={{
              left: `${20 + i * 25}%`,
              top: `${30 + (i % 2) * 40}%`,
              textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            {char}
          </motion.div>
        ))}
      </motion.div>

      {/* Основной контент */}
      <div className="relative z-10 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl font-bold text-white mb-6"
        >
          汉语之星
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl text-white/90 mb-8"
        >
          Всероссийская олимпиада по китайскому языку
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Link
            href="/register"
            className="inline-block bg-white text-red-900 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-white/90 transition-colors"
          >
            Принять участие
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
