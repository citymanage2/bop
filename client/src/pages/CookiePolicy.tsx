export default function CookiePolicy() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Политика использования файлов cookie</h1>
      <p className="text-sm text-gray-500">Дата вступления в силу: 11 февраля 2026 г.</p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-700">1. Что такое cookie</h2>
        <p className="text-gray-600">
          Файлы cookie — это небольшие текстовые файлы, которые сохраняются на вашем
          устройстве при посещении веб-сайтов. Они помогают обеспечить корректную работу
          сайта и улучшить взаимодействие с пользователем.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-700">2. Какие cookie мы используем</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-600 border border-gray-200 rounded">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 border-b">Тип</th>
                <th className="text-left px-3 py-2 border-b">Назначение</th>
                <th className="text-left px-3 py-2 border-b">Срок хранения</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 border-b">Технические (необходимые)</td>
                <td className="px-3 py-2 border-b">Обеспечение работоспособности Сервиса, хранение настроек сессии</td>
                <td className="px-3 py-2 border-b">До окончания сессии</td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b">Функциональные</td>
                <td className="px-3 py-2 border-b">Сохранение пользовательских предпочтений</td>
                <td className="px-3 py-2 border-b">До 30 дней</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-gray-600">
          Мы не используем рекламные или аналитические cookie третьих сторон.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-700">3. Управление cookie</h2>
        <p className="text-gray-600">
          Вы можете управлять файлами cookie через настройки вашего браузера.
          Обратите внимание, что отключение технических cookie может привести к
          некорректной работе Сервиса.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-700">4. Контактная информация</h2>
        <p className="text-gray-600">
          По вопросам использования файлов cookie обращайтесь по электронной почте:{' '}
          <a href="mailto:citymanage@yandex.ru" className="text-blue-600 hover:underline">
            citymanage@yandex.ru
          </a>
        </p>
      </section>
    </div>
  );
}
