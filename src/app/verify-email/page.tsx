'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ChineseLoader from '@/components/ChineseLoader';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Недействительная ссылка для подтверждения email');
      setIsLoading(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || 'Произошла ошибка при подтверждении email'
          );
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

    verifyEmail();
  }, [token, router]);

  if (isLoading) {
    return (
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-500 border-r-transparent align-[-0.125em]"
          role="status"
        >
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Загрузка...
          </span>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 mb-4"
        >
          {error}
        </motion.p>
        <Link
          href="/login"
          className="text-red-500 hover:text-red-400 underline underline-offset-4"
        >
          Вернуться на страницу входа
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="text-green-500 mb-4">
          Email успешно подтвержден! Перенаправление на страницу входа...
        </p>
        <Link
          href="/login"
          className="text-red-500 hover:text-red-400 underline underline-offset-4"
        >
          Перейти на страницу входа
        </Link>
      </motion.div>
    );
  }

  return null;
}

export default function VerifyEmailPage() {
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
            Подтверждение Email
          </motion.h3>
        </div>

        <Suspense
          fallback={<div className="text-white text-center">Загрузка...</div>}
        >
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
