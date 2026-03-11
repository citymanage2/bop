/**
 * Формирование ВОР (Ведомость объёмов работ)
 *
 * Ключевая логика: каждая расценка декомпозируется на отдельные виды работ,
 * и каждый вид работы выводится отдельной строкой.
 */

import type { Estimate, VOROptions, VORRow, DEFAULT_VOR_OPTIONS } from '../models/estimate';

export interface VORResult {
  rows: VORRow[];
  totalWorks: number;
  sections: number;
}

/**
 * Формирует ВОР из распарсенной и декомпозированной сметы
 */
export function buildVOR(estimate: Estimate, options: Partial<VOROptions> = {}): VORResult {
  const opts: VOROptions = {
    groupBySection: options.groupBySection ?? true,
    includeSourceCode: options.includeSourceCode ?? true,
    mergeIdenticalWorks: options.mergeIdenticalWorks ?? false,
    includeQuantityFormula: options.includeQuantityFormula ?? false,
    decompositionLevel: options.decompositionLevel ?? 'full',
    exportFormat: options.exportFormat ?? 'xlsx',
  };

  let rows: VORRow[] = [];
  let rowCounter = 0;

  for (const section of estimate.sections) {
    // Заголовок раздела
    if (opts.groupBySection) {
      rows.push({
        number: 0,
        name: section.name,
        unit: '',
        quantity: 0,
        sourceCode: '',
        sourcePositionNumber: 0,
        sectionName: section.name,
        isSection: true,
      });
    }

    for (const item of section.items) {
      if (item.type !== 'work') continue;

      if (item.works.length > 0) {
        // Декомпозированная расценка — каждый вид работ отдельной строкой
        for (const work of item.works) {
          rowCounter++;
          rows.push({
            number: rowCounter,
            name: work.name,
            unit: work.unit || item.unit,
            quantity: work.quantity,
            sourceCode: opts.includeSourceCode ? item.code : '',
            sourcePositionNumber: item.positionNumber,
            sectionName: section.name,
          });
        }
      } else {
        // Не декомпозированная — как есть
        rowCounter++;
        rows.push({
          number: rowCounter,
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
          sourceCode: opts.includeSourceCode ? item.code : '',
          sourcePositionNumber: item.positionNumber,
          sectionName: section.name,
        });
      }
    }
  }

  // Объединение одинаковых работ
  if (opts.mergeIdenticalWorks) {
    rows = mergeIdenticalWorks(rows);
  }

  return {
    rows,
    totalWorks: rows.filter(r => !r.isSection).length,
    sections: estimate.sections.length,
  };
}

/**
 * Объединяет одинаковые работы (по наименованию + единице измерения)
 */
function mergeIdenticalWorks(rows: VORRow[]): VORRow[] {
  const merged: VORRow[] = [];
  const workMap = new Map<string, VORRow>();

  for (const row of rows) {
    if (row.isSection) {
      merged.push(row);
      continue;
    }

    const key = `${row.name}|${row.unit}`;
    const existing = workMap.get(key);

    if (existing) {
      existing.quantity += row.quantity;
      // Добавляем коды источников
      if (row.sourceCode && !existing.sourceCode.includes(row.sourceCode)) {
        existing.sourceCode += ', ' + row.sourceCode;
      }
    } else {
      const newRow = { ...row };
      workMap.set(key, newRow);
      merged.push(newRow);
    }
  }

  // Перенумеровываем
  let counter = 0;
  for (const row of merged) {
    if (!row.isSection) {
      counter++;
      row.number = counter;
    }
  }

  return merged;
}
