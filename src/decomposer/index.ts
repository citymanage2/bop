/**
 * Оркестратор декомпозиции расценок
 *
 * Многоуровневая стратегия:
 * 1. Прямой парсинг (если состав уже есть из файла)
 * 2. Локальная база составов расценок
 * 3. AI-анализ через Claude API
 */

import type { Estimate, SmetaItem, WorkItem, DecompositionResult } from '../models/estimate';
import { decomposeFromCache, saveToCache } from './cacheDecomposer';
import { decomposeWithAI } from './aiDecomposer';

/**
 * Декомпозирует все расценки в смете
 */
export async function decomposeEstimate(
  estimate: Estimate,
  options: {
    itemIds?: string[];   // Конкретные позиции (или все)
    forceAI?: boolean;    // Принудительно через AI
  } = {}
): Promise<DecompositionResult> {
  const result: DecompositionResult = {
    totalItems: 0,
    decomposed: 0,
    fromCache: 0,
    fromAI: 0,
    fromParsed: 0,
    warnings: [],
  };

  for (const section of estimate.sections) {
    for (const item of section.items) {
      // Пропускаем, если указаны конкретные позиции
      if (options.itemIds && options.itemIds.length > 0 && !options.itemIds.includes(item.id)) {
        continue;
      }

      if (item.type !== 'work') continue;

      result.totalItems++;

      const works = await decomposeItem(item, options.forceAI || false, result);
      item.works = works;
      result.decomposed++;
    }
  }

  return result;
}

async function decomposeItem(
  item: SmetaItem,
  forceAI: boolean,
  result: DecompositionResult
): Promise<WorkItem[]> {
  // Уровень 1: Прямой парсинг (если уже есть из файла)
  if (!forceAI && item.works.length > 0) {
    result.fromParsed++;
    return item.works;
  }

  // Уровень 2: Локальная база
  if (!forceAI) {
    const cached = decomposeFromCache(item);
    if (cached) {
      result.fromCache++;
      return cached;
    }
  }

  // Уровень 3: AI-декомпозиция
  try {
    const aiWorks = await decomposeWithAI(item);
    if (aiWorks.length > 0) {
      result.fromAI++;

      // Сохраняем в кэш для будущего использования
      saveToCache(item.code, item.name, item.unit, aiWorks);

      return aiWorks;
    }
  } catch (err: any) {
    result.warnings.push(`Ошибка AI-декомпозиции для ${item.code}: ${err.message}`);
  }

  // Fallback: одна работа = одна расценка
  return [{
    id: require('uuid').v4(),
    parentItemId: item.id,
    code: item.code,
    name: item.name,
    unit: item.unit,
    quantity: item.quantity,
    quantityRatio: 1.0,
    description: '',
    source: 'parsed',
  }];
}

/**
 * Обновляет состав работ для конкретной позиции (ручная корректировка)
 */
export function updateItemWorks(
  estimate: Estimate,
  itemId: string,
  works: WorkItem[]
): boolean {
  for (const section of estimate.sections) {
    const item = section.items.find(i => i.id === itemId);
    if (item) {
      item.works = works;
      // Сохраняем в кэш
      saveToCache(item.code, item.name, item.unit, works);
      return true;
    }
  }
  return false;
}
