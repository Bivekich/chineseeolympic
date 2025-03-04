'use client';

import { useState } from 'react';
import DocLayout from '@/components/docs/DocLayout';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'Как принять участие в олимпиаде?',
    answer:
      'Для участия необходимо зарегистрироваться на сайте, выбрать доступную олимпиаду, оплатить участие и в назначенное время приступить к выполнению заданий.',
  },
  {
    question: 'Сколько стоит участие?',
    answer:
      'Стоимость участия зависит от выбранной олимпиады. Актуальные цены указаны на странице каждой олимпиады.',
  },
  {
    question: 'Как получить сертификат?',
    answer:
      'После завершения олимпиады и подведения итогов сертификат будет доступен для скачивания в вашем личном кабинете.',
  },
  {
    question: 'Можно ли участвовать несколько раз?',
    answer:
      'В одной олимпиаде можно участвовать только один раз, но вы можете принимать участие в разных олимпиадах.',
  },
  {
    question: 'Что делать, если произошел технический сбой?',
    answer:
      'В случае технического сбоя немедленно свяжитесь с нашей службой поддержки через форму обратной связи или по электронной почте.',
  },
  {
    question: 'Как происходит проверка работ?',
    answer:
      'Проверка работ осуществляется автоматически системой. Результаты доступны сразу после завершения олимпиады.',
  },
  {
    question: 'Какой уровень китайского языка необходим?',
    answer:
      'Для каждой олимпиады указан рекомендуемый уровень владения языком. Выбирайте олимпиаду, соответствующую вашему уровню.',
  },
  {
    question: 'Можно ли пользоваться словарем?',
    answer:
      'Нет, использование словарей и других вспомогательных материалов во время олимпиады запрещено.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <DocLayout title="Часто задаваемые вопросы">
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-gray-700 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-700 transition-colors"
            >
              <span className="text-lg font-medium text-white">
                {faq.question}
              </span>
              <motion.span
                animate={{ rotate: openIndex === index ? 180 : 0 }}
                className="text-white"
              >
                ▼
              </motion.span>
            </button>
            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-gray-700"
                >
                  <div className="px-6 py-4 text-gray-300">{faq.answer}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </DocLayout>
  );
}
