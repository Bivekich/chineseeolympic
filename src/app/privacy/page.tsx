'use client';

import DocLayout from '@/components/docs/DocLayout';

export default function Privacy() {
  return (
    <DocLayout title="Политика конфиденциальности">
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">
            1. Общие положения
          </h2>
          <p>
            Настоящая политика конфиденциальности описывает, как "汉语之星"
            собирает, использует и защищает информацию, которую вы
            предоставляете при использовании нашего сайта.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">
            2. Сбор информации
          </h2>
          <p className="mb-4">Мы собираем следующие типы информации:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Личная информация (имя, email, телефон)</li>
            <li>Данные об образовании и уровне владения китайским языком</li>
            <li>Информация о выполненных заданиях и результатах</li>
            <li>Технические данные (IP-адрес, тип браузера)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">
            3. Использование информации
          </h2>
          <p className="mb-4">Собранная информация используется для:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Организации и проведения олимпиад</li>
            <li>Выдачи сертификатов и дипломов</li>
            <li>Улучшения качества наших услуг</li>
            <li>Связи с участниками</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">
            4. Защита информации
          </h2>
          <p className="mb-4">
            Мы принимаем следующие меры для защиты вашей информации:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Использование защищенного соединения (SSL)</li>
            <li>Регулярное обновление систем безопасности</li>
            <li>Ограничение доступа к личным данным</li>
            <li>Шифрование конфиденциальной информации</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">
            5. Передача информации третьим лицам
          </h2>
          <p>
            Мы не передаем вашу личную информацию третьим лицам без вашего
            согласия, за исключением случаев, предусмотренных законодательством
            РФ.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">6. Cookies</h2>
          <p>
            Наш сайт использует cookies для улучшения пользовательского опыта.
            Вы можете отключить cookies в настройках вашего браузера, но это
            может повлиять на функциональность сайта.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">
            7. Изменения в политике конфиденциальности
          </h2>
          <p>
            Мы оставляем за собой право вносить изменения в политику
            конфиденциальности. Все изменения будут опубликованы на этой
            странице.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">8. Контакты</h2>
          <p>
            Если у вас есть вопросы относительно политики конфиденциальности,
            пожалуйста, свяжитесь с нами по электронной почте.
          </p>
        </section>
      </div>
    </DocLayout>
  );
}
