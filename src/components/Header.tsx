'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { title: 'Преимущества', href: '#benefits' },
    { title: 'Как участвовать', href: '#how-it-works' },
    { title: 'Призы', href: '#prizes' },
    { title: 'Этапы', href: '#stages' },
    { title: 'Контакты', href: '#contact' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-md' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Логотип */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-red-600">汉语之星</span>
            <span
              className={`font-semibold ${
                isScrolled ? 'text-gray-900' : 'text-white'
              }`}
            >
              Олимпиада
            </span>
          </Link>

          {/* Десктопное меню */}
          <nav className="hidden md:flex items-center space-x-8">
            {menuItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={item.href}
                  className={`font-medium hover:text-red-600 transition-colors ${
                    isScrolled ? 'text-gray-900' : 'text-white'
                  }`}
                >
                  {item.title}
                </Link>
              </motion.div>
            ))}
            <Link href="/login">
              <motion.button
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: menuItems.length * 0.1 }}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Участвовать
              </motion.button>
            </Link>
          </nav>

          {/* Мобильная кнопка меню */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2"
          >
            <svg
              className={`w-6 h-6 ${
                isScrolled ? 'text-gray-900' : 'text-white'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Мобильное меню */}
        <motion.div
          initial={false}
          animate={
            isMobileMenuOpen
              ? { height: 'auto', opacity: 1 }
              : { height: 0, opacity: 0 }
          }
          className="md:hidden overflow-hidden bg-white rounded-b-xl shadow-lg"
        >
          <nav className="px-4 py-2 space-y-4">
            {menuItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-gray-900 hover:text-red-600 transition-colors"
                >
                  {item.title}
                </Link>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: menuItems.length * 0.1 }}
              className="pb-4"
            >
              <Link href="/login">
                <motion.button
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: menuItems.length * 0.1 }}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Участвовать
                </motion.button>
              </Link>
            </motion.div>
          </nav>
        </motion.div>
      </div>
    </motion.header>
  );
}
