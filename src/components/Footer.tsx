'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export default function Footer() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const links = {
    main: [
      { title: 'Преимущества', href: '#benefits' },
      { title: 'Как участвовать', href: '#how-it-works' },
      { title: 'Призы', href: '#prizes' },
      { title: 'Этапы', href: '#stages' },
      { title: 'Контакты', href: '#contact' },
    ],
    info: [
      { title: 'Правила', href: '/rules' },
      { title: 'FAQ', href: '/faq' },
      { title: 'Политика конфиденциальности', href: '/privacy' },
      { title: 'Условия использования', href: '/terms' },
    ],
    social: [
      {
        title: 'Telegram',
        href: 'https://t.me/uchukitaisky',
        icon: 'telegram',
      },
      {
        title: 'WeChat',
        href: 'https://u.wechat.com/kDvMRaDLCNF5B6ItXlcjM9Y',
        icon: 'wechat',
      },
    ],
  };

  return (
    <footer ref={ref} className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Логотип и описание */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="col-span-1 md:col-span-2"
          >
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <span className="text-2xl font-bold text-red-500">汉语之星</span>
              <span className="font-semibold text-white">Олимпиада</span>
            </Link>
            <p className="text-gray-400 mb-6">
              Всероссийская олимпиада по китайскому языку для школьников и
              студентов. Проверьте свои знания и выиграйте ценные призы!
            </p>
            <div className="flex space-x-4">
              {links.social.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  {social.title}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Навигация */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold mb-4">Навигация</h3>
            <ul className="space-y-2">
              {links.main.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Информация */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="text-lg font-semibold mb-4">Информация</h3>
            <ul className="space-y-2">
              {links.info.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Нижняя часть */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="pt-8 border-t border-gray-800"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} 汉语之星. Все права защищены.
              </p>
              <p className="text-gray-500 text-xs mt-1">
                ИП Тришкина Екатерина Васильевна, ОГРНИП 325220200006791, ИНН
                227102098395
              </p>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex space-x-6">
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-red-500 text-sm transition-colors"
                >
                  Политика конфиденциальности
                </Link>
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-red-500 text-sm transition-colors"
                >
                  Условия использования
                </Link>
              </div>
              <a
                href="https://biveki.ru"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 text-xs mt-2 hover:text-red-500 transition-colors"
              >
                Разработка сайтов BivekiGroup
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
