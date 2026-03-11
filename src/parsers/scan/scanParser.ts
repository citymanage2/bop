/**
 * Парсер сканов смет через Claude Vision API
 *
 * Принимает изображения (JPG, PNG) или PDF-сканы смет,
 * отправляет их в Claude Vision для распознавания,
 * возвращает структурированные данные.
 */

import fs from 'fs';
import path from 'path';
import { config } from '../../config';

// ============================================================
// Типы данных
// ============================================================

export interface ScanEstimateRow {
  posNumber: string;
  code: string;
  name: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  total: string;
  section: string;
  isSection: boolean;
  isTotal: boolean;
  isUnreadable: boolean;
  rawText?: string;
}

export interface ScanEstimateMeta {
  estimateType: string;
  estimateName: string;
  estimateNumber: string;
  objectName: string;
  customer: string;
  contractor: string;
  baseDate: string;
  currentDate: string;
  normBase: string;
}

export interface ScanParseResult {
  meta: ScanEstimateMeta;
  rows: ScanEstimateRow[];
  totals: {
    subtotals: { name: string; value: string }[];
    overhead: string;
    profit: string;
    total: string;
    vat: string;
    totalWithVat: string;
  };
  quality: {
    totalPages: number;
    processedPages: number;
    unreadableRows: number;
    confidence: 'high' | 'medium' | 'low';
  };
  warnings: string[];
}

// ============================================================
// Основной парсер
// ============================================================

/**
 * Парсит скан сметы через Claude Vision API
 */
export async function parseScan(
  filePaths: string[],
  originalName: string,
): Promise<ScanParseResult> {
  if (!config.anthropicApiKey) {
    throw new Error(
      'Для распознавания сканов необходим API-ключ Anthropic. ' +
      'Установите переменную окружения ANTHROPIC_API_KEY.',
    );
  }

  // Подготовка изображений для API
  const imageContents = await Promise.all(
    filePaths.map(fp => prepareImageContent(fp)),
  );

  // Отправляем в Claude Vision
  const rawResult = await callClaudeVision(imageContents, originalName);

  // Парсим ответ
  return parseClaudeResponse(rawResult, filePaths.length);
}

/**
 * Парсит одностраничный файл (JPG/PNG/PDF)
 */
export async function parseScanFile(
  filePath: string,
  originalName: string,
): Promise<ScanParseResult> {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === '.pdf') {
    // Для PDF отправляем как документ
    return parseScan([filePath], originalName);
  }

  // Для изображений
  return parseScan([filePath], originalName);
}

// ============================================================
// Подготовка данных для API
// ============================================================

interface ImageContent {
  type: 'image';
  source: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

interface DocumentContent {
  type: 'document';
  source: {
    type: 'base64';
    media_type: 'application/pdf';
    data: string;
  };
}

async function prepareImageContent(filePath: string): Promise<ImageContent | DocumentContent> {
  const ext = path.extname(filePath).toLowerCase();
  const data = fs.readFileSync(filePath);
  const base64 = data.toString('base64');

  if (ext === '.pdf') {
    return {
      type: 'document',
      source: {
        type: 'base64',
        media_type: 'application/pdf',
        data: base64,
      },
    };
  }

  const mediaType = ext === '.png' ? 'image/png'
    : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
    : ext === '.webp' ? 'image/webp'
    : ext === '.gif' ? 'image/gif'
    : 'image/jpeg';

  return {
    type: 'image',
    source: {
      type: 'base64',
      media_type: mediaType,
      data: base64,
    },
  };
}

// ============================================================
// Вызов Claude Vision API
// ============================================================

const SYSTEM_PROMPT = `Ты — AI-ассистент строительной компании ООО «Сити Менедж», генерального подрядчика полного цикла. Ты работаешь со сметной документацией: распознаёшь, структурируешь и переносишь данные из сканов смет в структурированный формат.

Важные правила:
- Не додумывай данные — если позиция нечитаема, ставь пометку [нечитаемо]
- Сохраняй оригинальную нумерацию — не переупорядочивай позиции
- Не округляй самостоятельно — переноси числа в том виде, в котором они указаны в скане
- Если значение отсутствует или не читается — оставь пустую строку ""`;

const USER_PROMPT = `Проанализируй скан сметы и извлеки все данные в формате JSON.

Определи:
1. Тип сметы (локальная, объектная, сводная, КС-2 и т.д.)
2. Систему нормирования (ФЕР, ТЕР, ГЭСН, авторская)
3. Качество скана (высокое/среднее/низкое)

Извлеки все структурированные данные. Ответь СТРОГО в формате JSON (без markdown-обёртки):
{
  "meta": {
    "estimateType": "тип сметы (локальная/объектная/сводная/КС-2/КС-3/другая)",
    "estimateName": "полное наименование сметы из шапки",
    "estimateNumber": "номер сметы",
    "objectName": "наименование объекта",
    "customer": "заказчик (если указан)",
    "contractor": "подрядчик (если указан)",
    "baseDate": "базисная дата (если указана)",
    "currentDate": "текущая дата (если указана)",
    "normBase": "система нормирования (ФЕР/ТЕР/ГЭСН/авторская)"
  },
  "rows": [
    {
      "posNumber": "номер позиции (как в скане)",
      "code": "шифр/код расценки",
      "name": "наименование работ и затрат (полностью)",
      "unit": "единица измерения",
      "quantity": "объём/количество (как строка, с сохранением формата)",
      "unitPrice": "цена за единицу",
      "total": "итоговая сумма позиции",
      "section": "название раздела, к которому относится позиция",
      "isSection": false,
      "isTotal": false,
      "isUnreadable": false
    }
  ],
  "totals": {
    "subtotals": [{"name": "Итого по разделу N", "value": "сумма"}],
    "overhead": "накладные расходы (сумма или пусто)",
    "profit": "сметная прибыль (сумма или пусто)",
    "total": "итого по смете",
    "vat": "НДС (сумма или пусто)",
    "totalWithVat": "всего с НДС"
  },
  "quality": {
    "confidence": "high/medium/low",
    "unreadableRows": 0
  },
  "warnings": ["список проблемных мест, нечитаемых фрагментов"]
}

Для строк-заголовков разделов: isSection=true, остальные поля пустые кроме name и section.
Для итоговых строк (итого по разделу, всего и т.п.): isTotal=true.
Если позиция нечитаема: isUnreadable=true, в name укажи "[нечитаемо]" или частично читаемый текст.
Для многострочных наименований — объедини в одну строку.
Числа переноси как строки, сохраняя оригинальный формат (пробелы, запятые).`;

async function callClaudeVision(
  imageContents: (ImageContent | DocumentContent)[],
  originalName: string,
): Promise<string> {
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: config.anthropicApiKey });

  const userContent: any[] = [];

  // Добавляем все изображения/документы
  for (const img of imageContents) {
    userContent.push(img);
  }

  // Добавляем текстовый промпт
  userContent.push({
    type: 'text',
    text: `Файл: "${originalName}"\n\n${USER_PROMPT}`,
  });

  const response = await client.messages.create({
    model: config.claudeModel,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  });

  const text = response.content
    .filter((block: any) => block.type === 'text')
    .map((block: any) => block.text)
    .join('');

  return text;
}

// ============================================================
// Парсинг ответа Claude
// ============================================================

function parseClaudeResponse(text: string, totalPages: number): ScanParseResult {
  let jsonStr = text.trim();

  // Убираем markdown code blocks если есть
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    // Пробуем найти JSON в тексте
    const start = jsonStr.indexOf('{');
    const end = jsonStr.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        parsed = JSON.parse(jsonStr.substring(start, end + 1));
      } catch {
        throw new Error('Не удалось распознать ответ AI. Попробуйте загрузить файл с лучшим качеством скана.');
      }
    } else {
      throw new Error('Не удалось распознать ответ AI. Попробуйте загрузить файл с лучшим качеством скана.');
    }
  }

  const meta: ScanEstimateMeta = {
    estimateType: parsed.meta?.estimateType || '',
    estimateName: parsed.meta?.estimateName || '',
    estimateNumber: parsed.meta?.estimateNumber || '',
    objectName: parsed.meta?.objectName || '',
    customer: parsed.meta?.customer || '',
    contractor: parsed.meta?.contractor || '',
    baseDate: parsed.meta?.baseDate || '',
    currentDate: parsed.meta?.currentDate || '',
    normBase: parsed.meta?.normBase || '',
  };

  const rows: ScanEstimateRow[] = (parsed.rows || []).map((r: any) => ({
    posNumber: String(r.posNumber || ''),
    code: String(r.code || ''),
    name: String(r.name || ''),
    unit: String(r.unit || ''),
    quantity: String(r.quantity || ''),
    unitPrice: String(r.unitPrice || ''),
    total: String(r.total || ''),
    section: String(r.section || ''),
    isSection: !!r.isSection,
    isTotal: !!r.isTotal,
    isUnreadable: !!r.isUnreadable,
  }));

  const unreadableRows = rows.filter(r => r.isUnreadable).length;

  const totals = {
    subtotals: (parsed.totals?.subtotals || []).map((s: any) => ({
      name: String(s.name || ''),
      value: String(s.value || ''),
    })),
    overhead: String(parsed.totals?.overhead || ''),
    profit: String(parsed.totals?.profit || ''),
    total: String(parsed.totals?.total || ''),
    vat: String(parsed.totals?.vat || ''),
    totalWithVat: String(parsed.totals?.totalWithVat || ''),
  };

  const confidence = parsed.quality?.confidence || (unreadableRows > 5 ? 'low' : unreadableRows > 0 ? 'medium' : 'high');

  const warnings: string[] = parsed.warnings || [];
  if (unreadableRows > 0) {
    warnings.push(`Обнаружено нечитаемых строк: ${unreadableRows}. Требуется ручная проверка.`);
  }

  return {
    meta,
    rows,
    totals,
    quality: {
      totalPages,
      processedPages: totalPages,
      unreadableRows,
      confidence,
    },
    warnings,
  };
}
