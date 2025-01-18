"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface AuthFormProps {
  type: "register" | "login" | "forgot-password" | "reset-password";
  token?: string;
}

export default function AuthForm({ type, token }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (type === "register" || type === "reset-password") {
        if (password !== confirmPassword) {
          setError("Пароли не совпадают");
          setLoading(false);
          return;
        }
      }

      const endpoint =
        type === "reset-password"
          ? "/api/auth/reset-password"
          : `/api/auth/${type}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          token,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Что-то пошло не так");
      }

      setMessage(data.message);

      if (type === "login") {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="space-y-4 w-full max-w-md bg-white/5 backdrop-blur-sm p-8 rounded-lg shadow-xl border border-white/10"
    >
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-red-500/10 text-red-200 p-3 rounded-lg text-sm border border-red-500/20"
        >
          {error}
        </motion.div>
      )}
      {message && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-green-500/10 text-green-200 p-3 rounded-lg text-sm border border-green-500/20"
        >
          {message}
        </motion.div>
      )}

      {(type === "register" ||
        type === "login" ||
        type === "forgot-password") && (
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-white/90 mb-1"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-colors"
            placeholder="your@email.com"
          />
        </div>
      )}

      {(type === "register" ||
        type === "login" ||
        type === "reset-password") && (
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-white/90 mb-1"
          >
            Пароль
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-colors"
            placeholder="••••••••"
          />
        </div>
      )}

      {(type === "register" || type === "reset-password") && (
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-white/90 mb-1"
          >
            Подтвердите пароль
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-colors"
            placeholder="••••••••"
          />
        </div>
      )}

      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-red-900 bg-white hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <div className="flex items-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-red-900"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Загрузка...
          </div>
        ) : (
          getButtonText(type)
        )}
      </motion.button>
    </motion.form>
  );
}

function getButtonText(type: string) {
  switch (type) {
    case "register":
      return "Зарегистрироваться";
    case "login":
      return "Войти";
    case "forgot-password":
      return "Отправить инструкции";
    case "reset-password":
      return "Сбросить пароль";
    default:
      return "Отправить";
  }
}
