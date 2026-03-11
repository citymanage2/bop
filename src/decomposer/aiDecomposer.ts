/**
 * Декомпозиция расценок через Claude API
 *
 * Используется, когда расценка не найдена в локальной базе.
 * Результаты кэшируются для повторного использования.
 */

import { v4 as uuid } from 'uuid';
import type { WorkItem, SmetaItem } from '../models/estimate';
import { config } from '../config';

interface AIWorkResult {
  name: string;
  unit: string;
  quantityRatio: number;
  description: string;
}

/**
 * Декомпозирует расценку через Claude API
 */
export async function decomposeWithAI(item: SmetaItem): Promise<WorkItem[]> {
  if (!config.anthropicApiKey) {
    // Без API-ключа возвращаем расценку как есть (одна работа = одна расценка)
    return [createSingleWork(item)];
  }

  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: config.anthropicApiKey });

    const prompt = `Ты эксперт по сметному делу в строительстве (Россия).

Расценка: ${item.code}
Наименование: ${item.name}
Единица измерения: ${item.unit}
Объём: ${item.quantity}

Определи все виды работ, входящие в состав данной расценки.
Для каждого вида работ укажи:
1. Наименование работы
2. Единицу измерения
3. Коэффициент объёма относительно основной расценки (обычно 1.0)
4. Краткое описание

Ответь строго в формате JSON (без markdown-обёртки):
{
  "works": [
    {
      "name": "...",
      "unit": "...",
      "quantityRatio": 1.0,
      "description": "..."
    }
  ]
}`;

    const response = await client.messages.create({
      model: config.claudeModel,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('');

    const parsed = parseAIResponse(text);

    if (parsed && parsed.length > 0) {
      return parsed.map(w => ({
        id: uuid(),
        parentItemId: item.id,
        code: item.code,
        name: w.name,
        unit: w.unit || item.unit,
        quantity: item.quantity * w.quantityRatio,
        quantityRatio: w.quantityRatio,
        description: w.description || '',
        source: 'ai_decomposed' as const,
      }));
    }
  } catch (err: any) {
    console.error(`AI decomposition failed for ${item.code}: ${err.message}`);
  }

  // Fallback: одна работа = одна расценка
  return [createSingleWork(item)];
}

/**
 * Батчевая декомпозиция (для экономии токенов)
 */
export async function decomposeWithAIBatch(items: SmetaItem[]): Promise<Map<string, WorkItem[]>> {
  const results = new Map<string, WorkItem[]>();

  // Обрабатываем батчами по 10
  const batchSize = 10;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    // Параллельная обработка внутри батча
    const promises = batch.map(async item => {
      const works = await decomposeWithAI(item);
      return { itemId: item.id, works };
    });

    const batchResults = await Promise.all(promises);
    for (const result of batchResults) {
      results.set(result.itemId, result.works);
    }
  }

  return results;
}

function parseAIResponse(text: string): AIWorkResult[] | null {
  try {
    // Пытаемся извлечь JSON из ответа
    let jsonStr = text.trim();

    // Убираем markdown code blocks если есть
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);
    if (parsed.works && Array.isArray(parsed.works)) {
      return parsed.works.map((w: any) => ({
        name: String(w.name || ''),
        unit: String(w.unit || ''),
        quantityRatio: typeof w.quantityRatio === 'number' ? w.quantityRatio : 1.0,
        description: String(w.description || ''),
      }));
    }
  } catch {
    // Parsing failed
  }
  return null;
}

function createSingleWork(item: SmetaItem): WorkItem {
  return {
    id: uuid(),
    parentItemId: item.id,
    code: item.code,
    name: item.name,
    unit: item.unit,
    quantity: item.quantity,
    quantityRatio: 1.0,
    description: '',
    source: 'parsed' as const,
  };
}
