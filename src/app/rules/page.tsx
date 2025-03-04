'use client';

import DocLayout from '@/components/docs/DocLayout';

export default function Rules() {
  return (
    <DocLayout title="Правила участия в олимпиаде">
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">
            Общие положения
          </h2>
          <p>
            Олимпиада по китайскому языку "汉语之星" - это онлайн-соревнование,
            направленное на выявление и поддержку талантливых учащихся,
            изучающих китайский язык.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">
            Участники олимпиады
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>К участию допускаются все желающие от 12 лет</li>
            <li>Участие возможно только после регистрации на сайте</li>
            <li>
              Каждый участник может принять участие только один раз в текущей
              олимпиаде
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">
            Порядок проведения
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Регистрация на сайте</li>
            <li>Выбор доступной олимпиады</li>
            <li>Оплата участия</li>
            <li>Выполнение заданий в указанное время</li>
            <li>Получение результатов и сертификата</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">
            Правила выполнения заданий
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Все задания выполняются самостоятельно</li>
            <li>Использование сторонних источников и помощи запрещено</li>
            <li>На выполнение заданий отводится ограниченное время</li>
            <li>Ответы сохраняются автоматически</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Награждение</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Все участники получают сертификаты участия</li>
            <li>Победители награждаются дипломами</li>
            <li>Результаты публикуются в личном кабинете</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">
            Технические требования
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Стабильное интернет-соединение</li>
            <li>Современный браузер (Chrome, Firefox, Safari)</li>
            <li>Включенный JavaScript</li>
            <li>Разрешение экрана не менее 1024x768</li>
          </ul>
        </section>
      </div>
    </DocLayout>
  );
}
