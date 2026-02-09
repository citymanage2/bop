# Сметный парсер — сервис формирования ВОР и списка материалов

Веб-сервис для автоматического парсинга локальных сметных расчётов ГрандСмета и формирования:
- **ВОР** (ведомость объёмов работ) с декомпозицией составных расценок
- **Списка материалов** с объединением и группировкой

## Стек

- **Backend:** Node.js + Express + TypeScript
- **Frontend:** React + TypeScript + Tailwind CSS
- **Парсинг:** ExcelJS, pdf-parse, fast-xml-parser
- **AI-декомпозиция:** Claude API (Anthropic)
- **Экспорт:** XLSX (ExcelJS), DOCX (docx)

## Запуск

```bash
# Установка зависимостей
npm install
cd client && npm install && cd ..

# Бэкенд (dev mode)
npm run dev

# Фронтенд (dev mode, в другом терминале)
npm run client:dev

# Тесты
npm test
```

## Поддерживаемые форматы

| Формат | Расширения | Статус |
|--------|-----------|--------|
| Excel  | .xlsx, .xls | Полная поддержка |
| PDF    | .pdf | Базовая поддержка |
| XML    | .xml | Полная поддержка |
| GSN    | .gsn | Базовая поддержка |

## API

- `POST /api/estimates/upload` — загрузка и парсинг сметы
- `GET /api/estimates` — список загруженных смет
- `GET /api/estimates/:id` — данные сметы
- `POST /api/estimates/:id/decompose` — декомпозиция расценок
- `POST /api/estimates/:id/vor` — генерация ВОР (XLSX/DOCX)
- `POST /api/estimates/:id/materials` — генерация списка материалов
- `GET /api/estimates/:id/vor/preview` — предпросмотр ВОР (JSON)
- `GET /api/estimates/:id/materials/preview` — предпросмотр материалов (JSON)
- `GET /api/downloads/:id` — скачивание файла

## Конфигурация

Скопируйте `.env.example` в `.env` и настройте:
- `PORT` — порт сервера (по умолчанию 3001)
- `ANTHROPIC_API_KEY` — ключ API Claude для AI-декомпозиции
