'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AuthForm from '@/components/auth/AuthForm';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Недействительная ссылка для сброса пароля');
      return;
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Произошла ошибка при сбросе пароля');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-500 mb-4">
          Недействительная ссылка для сброса пароля
        </p>
        <Link
          href="/login"
          className="text-red-500 hover:text-red-400 underline underline-offset-4"
        >
          Вернуться на страницу входа
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-white mb-2"
        >
          Новый пароль
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 bg-white/10 border border-red-200/10 rounded-lg text-white placeholder-red-200/50 focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Введите новый пароль"
          required
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-white mb-2"
        >
          Подтвердите пароль
        </label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-3 bg-white/10 border border-red-200/10 rounded-lg text-white placeholder-red-200/50 focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Подтвердите новый пароль"
          required
        />
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-center"
        >
          {error}
        </motion.p>
      )}

      {success && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-green-500 text-center"
        >
          Пароль успешно изменен! Перенаправление на страницу входа...
        </motion.p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-3 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white rounded-lg font-semibold transition-colors"
      >
        {isLoading ? 'Сброс пароля...' : 'Сбросить пароль'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
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
            Сброс пароля
          </motion.h3>
        </div>

        <Suspense
          fallback={<div className="text-white text-center">Загрузка...</div>}
        >
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
