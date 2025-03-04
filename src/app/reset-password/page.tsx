'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthForm from '@/components/auth/AuthForm';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-600">
            Недействительная ссылка
          </h2>
          <p className="text-gray-600">
            Ссылка для сброса пароля недействительна или истекла.
          </p>
          <Link
            href="/forgot-password"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Запросить новую ссылку
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Создание нового пароля
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Введите и подтвердите новый пароль
          </p>
        </div>

        <AuthForm type="reset-password" token={token} />
      </div>
    </div>
  );
}
