/**
 * Валидация распарсенных данных сметы
 */

import type { Estimate, Section, SmetaItem } from '../models/estimate';

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Полная валидация распарсенной сметы
 */
export function validateEstimate(estimate: Estimate): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Проверяем наличие разделов
  if (!estimate.sections || estimate.sections.length === 0) {
    errors.push('Смета не содержит разделов');
  }

  // Проверяем наличие позиций
  const totalItems = estimate.sections.reduce((sum, s) => sum + s.items.length, 0);
  if (totalItems === 0) {
    errors.push('Смета не содержит позиций (расценок)');
  }

  // Проверяем каждый раздел
  for (const section of estimate.sections) {
    validateSection(section, warnings, errors);
  }

  // Проверяем контрольные суммы
  validateTotals(estimate, warnings);

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

function validateSection(section: Section, warnings: string[], errors: string[]): void {
  if (!section.name) {
    warnings.push(`Раздел ${section.number}: отсутствует наименование`);
  }

  for (const item of section.items) {
    validateItem(item, section.number, warnings, errors);
  }
}

function validateItem(item: SmetaItem, sectionNum: number, warnings: string[], errors: string[]): void {
  // Проверяем обязательные поля
  if (!item.code) {
    warnings.push(`Позиция ${item.positionNumber} (раздел ${sectionNum}): отсутствует шифр расценки`);
  }

  if (!item.name) {
    warnings.push(`Позиция ${item.positionNumber} (раздел ${sectionNum}): отсутствует наименование`);
  }

  if (!item.unit) {
    warnings.push(`Позиция ${item.positionNumber} (раздел ${sectionNum}): не определена единица измерения`);
  }

  if (item.quantity === 0) {
    warnings.push(`Позиция ${item.positionNumber} (раздел ${sectionNum}): нулевой объём работ`);
  }

  // Проверяем согласованность стоимостей
  if (item.directCostUnit > 0 && item.quantity > 0) {
    const expectedTotal = item.directCostUnit * item.quantity;
    const actual = item.directCostTotal;
    if (actual > 0 && Math.abs(expectedTotal - actual) / actual > 0.05) {
      warnings.push(
        `Позиция ${item.positionNumber}: расхождение стоимости (${expectedTotal.toFixed(2)} ≠ ${actual.toFixed(2)})`
      );
    }
  }
}

function validateTotals(estimate: Estimate, warnings: string[]): void {
  // Пересчитываем итоги и сравниваем
  let calcDirectCost = 0;
  for (const section of estimate.sections) {
    for (const item of section.items) {
      calcDirectCost += item.directCostTotal;
    }
  }

  if (estimate.totals.directCost > 0 && calcDirectCost > 0) {
    const diff = Math.abs(calcDirectCost - estimate.totals.directCost);
    const tolerance = estimate.totals.directCost * 0.01; // 1% допуск
    if (diff > tolerance) {
      warnings.push(
        `Расхождение итогов: рассчитанные прямые затраты (${calcDirectCost.toFixed(2)}) ≠ итого по смете (${estimate.totals.directCost.toFixed(2)})`
      );
    }
  }
}
