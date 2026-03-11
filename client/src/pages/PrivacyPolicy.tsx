export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Политика конфиденциальности</h1>
      <p className="text-sm text-gray-500">Дата вступления в силу: 11 февраля 2026 г.</p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-200">1. Общие положения</h2>
        <p className="text-gray-400">
          Настоящая Политика конфиденциальности определяет порядок обработки и защиты
          персональных данных пользователей сервиса «Сметный парсер» (далее — Сервис).
        </p>
        <p className="text-gray-400">
          Используя Сервис, вы соглашаетесь с условиями настоящей Политики.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-200">2. Какие данные мы собираем</h2>
        <ul className="list-disc list-inside text-gray-400 space-y-1">
          <li>Загруженные файлы смет (Excel, XML, PDF) — для выполнения основной функции Сервиса</li>
          <li>Технические данные: IP-адрес, тип браузера, время обращения — для обеспечения работоспособности</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-200">3. Цели обработки данных</h2>
        <ul className="list-disc list-inside text-gray-400 space-y-1">
          <li>Парсинг и анализ загруженных файлов смет</li>
          <li>Формирование ВОР (ведомостей объёмов работ) и списков материалов</li>
          <li>Обеспечение стабильной работы Сервиса</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-200">4. Хранение данных</h2>
        <p className="text-gray-400">
          Загруженные файлы хранятся на сервере временно и используются исключительно для обработки.
          Файлы автоматически удаляются после завершения сессии или по запросу пользователя.
          Мы не передаём ваши данные третьим лицам.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-200">5. Защита данных</h2>
        <p className="text-gray-400">
          Мы применяем технические и организационные меры для защиты данных от
          несанкционированного доступа, изменения, раскрытия или уничтожения.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-200">6. Права пользователя</h2>
        <p className="text-gray-400">
          Вы имеете право запросить удаление своих данных, а также получить информацию
          о том, какие данные о вас обрабатываются. Для этого свяжитесь с нами по адресу
          электронной почты, указанному ниже.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-200">7. Контактная информация</h2>
        <p className="text-gray-400">
          По всем вопросам, связанным с обработкой персональных данных, обращайтесь
          по электронной почте:{' '}
          <a href="mailto:citymanage@yandex.ru" className="text-blue-400 hover:text-blue-300 underline">
            citymanage@yandex.ru
          </a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-200">8. Изменения политики</h2>
        <p className="text-gray-400">
          Мы оставляем за собой право вносить изменения в настоящую Политику.
          Актуальная версия всегда доступна на данной странице.
        </p>
      </section>
    </div>
  );
}
