'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export default function Contact() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const contacts = [
    {
      title: 'Email',
      value: 'info@hanyuzhixing.ru',
      icon: '📧',
      link: 'mailto:info@hanyuzhixing.ru',
    },
    {
      title: 'Телефон',
      value: '8 (800) 123-45-67',
      icon: '📞',
      link: 'tel:+78001234567',
    },
    {
      title: 'Адрес',
      value: 'г. Москва, ул. Примерная, д. 1',
      icon: '📍',
      link: 'https://maps.google.com',
    },
  ];

  const socials = [
    { name: 'VK', icon: '/vk.svg', link: '#' },
    { name: 'Telegram', icon: '/telegram.svg', link: '#' },
    { name: 'WeChat', icon: '/wechat.svg', link: '#' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section
      className="py-24 bg-gradient-to-b from-white to-red-50"
      id="contact"
      ref={ref}
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Свяжитесь с нами
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Мы всегда готовы ответить на ваши вопросы
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
          >
            {contacts.map((contact, index) => (
              <motion.a
                key={index}
                href={contact.link}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8"
              >
                <div className="flex flex-col items-center text-center">
                  <span className="text-4xl mb-4">{contact.icon}</span>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {contact.title}
                  </h3>
                  <p className="text-red-600 hover:text-red-700 transition-colors">
                    {contact.value}
                  </p>
                </div>
              </motion.a>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Остались вопросы?
            </h3>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div variants={itemVariants} className="relative">
                  <input
                    type="text"
                    placeholder="Ваше имя"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                  />
                </motion.div>
                <motion.div variants={itemVariants} className="relative">
                  <input
                    type="email"
                    placeholder="Ваш email"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                  />
                </motion.div>
              </div>
              <motion.div variants={itemVariants} className="relative">
                <textarea
                  placeholder="Ваше сообщение"
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                ></textarea>
              </motion.div>
              <motion.div variants={itemVariants} className="text-center">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-300"
                >
                  Отправить сообщение
                </button>
              </motion.div>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex justify-center items-center space-x-6 mt-12"
          >
            {socials.map((social, index) => (
              <motion.a
                key={index}
                href={social.link}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                className="text-gray-600 hover:text-red-600 transition-colors"
              >
                {social.name}
              </motion.a>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
