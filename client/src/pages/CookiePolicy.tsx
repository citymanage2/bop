export default function CookiePolicy() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Политика использования файлов cookie</h1>
      <p className="text-sm text-gray-500">Дата вступления в силу: 11 февраля 2026 г.</p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-200">1. Что такое cookie</h2>
        <p className="text-gray-400">
          Файлы cookie — это небольшие текстовые файлы, которые сохраняются на вашем
          устройстве при посещении веб-сайтов. Они помогают обеспечить корректную работу
          сайта и улучшить взаимодействие с пользователем.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-200">2. Какие cookie мы используем</h2>
        <div className="overflow-x-auto rounded-xl border border-[#333]">
          <table className="w-full text-sm">
            <thead className="bg-[#1F2023]">
              <tr>
                <th className="text-left px-3 py-2.5 border-b border-[#333] text-gray-400 font-medium">Тип</th>
                <th className="text-left px-3 py-2.5 border-b border-[#333] text-gray-400 font-medium">Назначение</th>
                <th className="text-left px-3 py-2.5 border-b border-[#333] text-gray-400 font-medium">Срок хранения</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 border-b border-[#2A2A2D] text-gray-300">Технические (необходимые)</td>
                <td className="px-3 py-2 border-b border-[#2A2A2D] text-gray-400">Обеспечение работоспособности Сервиса, хранение настроек сессии</td>
                <td className="px-3 py-2 border-b border-[#2A2A2D] text-gray-400">До окончания сессии</td>
              </tr>
              <tr>
                <td className="px-3 py-2 border-b border-[#2A2A2D] text-gray-300">Функциональные</td>
                <td className="px-3 py-2 border-b border-[#2A2A2D] text-gray-400">Сохранение пользовательских предпочтений</td>
                <td className="px-3 py-2 border-b border-[#2A2A2D] text-gray-400">До 30 дней</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-gray-400">
          Мы не используем рекламные или аналитические cookie третьих сторон.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-200">3. Управление cookie</h2>
        <p className="text-gray-400">
          Вы можете управлять файлами cookie через настройки вашего браузера.
          Обратите внимание, что отключение технических cookie может привести к
          некорректной работе Сервиса.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-200">4. Контактная информация</h2>
        <p className="text-gray-400">
          По вопросам использования файлов cookie обращайтесь по электронной почте:{' '}
          <a href="mailto:citymanage@yandex.ru" className="text-blue-400 hover:text-blue-300 underline">
            citymanage@yandex.ru
          </a>
        </p>
      </section>
    </div>
  );
}
