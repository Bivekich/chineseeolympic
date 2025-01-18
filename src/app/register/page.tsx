"use client";

import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";
import { motion } from "framer-motion";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-red-900 via-red-800 to-red-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 bg-pattern" />

      <div className="relative z-10 max-w-md w-full space-y-8">
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-white"
          >
            汉语之星
          </motion.h2>
          <motion.h3
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-2 text-2xl font-semibold text-white"
          >
            Регистрация
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-2 text-sm text-white/80"
          >
            Уже есть аккаунт?{" "}
            <Link
              href="/login"
              className="font-medium text-white hover:text-white/80 underline underline-offset-4 transition-colors"
            >
              Войти
            </Link>
          </motion.p>
        </div>

        <AuthForm type="register" />
      </div>
    </div>
  );
}
