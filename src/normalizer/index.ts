/**
 * Нормализатор данных сметы
 *
 * Приводит данные от всех парсеров к единому формату,
 * исправляет типичные проблемы и заполняет пропущенные поля.
 */

import { v4 as uuid } from 'uuid';
import type { Estimate, SmetaItem, MaterialItem } from '../models/estimate';
import { normalizeUnit } from '../utils/unitNormalizer';
import { cleanText } from '../utils/textClean';

/**
 * Нормализует распарсенную смету
 */
export function normalizeEstimate(estimate: Estimate): Estimate {
  const normalized = { ...estimate };

  for (const section of normalized.sections) {
    for (let i = 0; i < section.items.length; i++) {
      section.items[i] = normalizeItem(section.items[i]);
    }
  }

  return normalized;
}

function normalizeItem(item: SmetaItem): SmetaItem {
  const normalized = { ...item };

  // Нормализуем единицу измерения
  const unitInfo = normalizeUnit(normalized.unit);
  normalized.unit = unitInfo.original; // Сохраняем оригинал для отображения

  // Очищаем наименование
  normalized.name = cleanText(normalized.name);

  // Убеждаемся, что ID есть у всех вложенных элементов
  normalized.materials = normalized.materials.map(m => ({
    ...m,
    id: m.id || uuid(),
    parentItemId: normalized.id,
    name: cleanText(m.name),
  }));

  normalized.machines = normalized.machines.map(m => ({
    ...m,
    id: m.id || uuid(),
    parentItemId: normalized.id,
    name: cleanText(m.name),
  }));

  normalized.works = normalized.works.map(w => ({
    ...w,
    id: w.id || uuid(),
    parentItemId: normalized.id,
    name: cleanText(w.name),
  }));

  // Пересчитываем quantityTotal для материалов, если не заполнено
  for (const mat of normalized.materials) {
    if (mat.quantityTotal === 0 && mat.quantityPerUnit > 0 && normalized.quantity > 0) {
      mat.quantityTotal = mat.quantityPerUnit * normalized.quantity;
    }
    if (mat.priceTotal === 0 && mat.priceBase > 0 && mat.quantityTotal > 0) {
      mat.priceTotal = mat.priceBase * mat.quantityTotal;
    }
  }

  // Пересчитываем итоговые стоимости, если не заполнены
  if (normalized.directCostTotal === 0 && normalized.directCostUnit > 0 && normalized.quantity > 0) {
    normalized.directCostTotal = normalized.directCostUnit * normalized.quantity;
  }
  if (normalized.laborCostTotal === 0 && normalized.laborCostUnit > 0 && normalized.quantity > 0) {
    normalized.laborCostTotal = normalized.laborCostUnit * normalized.quantity;
  }
  if (normalized.machineCostTotal === 0 && normalized.machineCostUnit > 0 && normalized.quantity > 0) {
    normalized.machineCostTotal = normalized.machineCostUnit * normalized.quantity;
  }
  if (normalized.materialCostTotal === 0 && normalized.materialCostUnit > 0 && normalized.quantity > 0) {
    normalized.materialCostTotal = normalized.materialCostUnit * normalized.quantity;
  }

  return normalized;
}
