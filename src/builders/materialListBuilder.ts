/**
 * Формирование списка материалов из сметы
 *
 * Собирает все материалы из позиций сметы, объединяет одинаковые,
 * рассчитывает суммарные объёмы и стоимости.
 */

import type { Estimate, MaterialListOptions, MaterialListRow } from '../models/estimate';

/** Checks if item code is a material/price list code (not a work operation) */
function isMaterialCode(code: string): boolean {
  if (!code) return false;
  return /^(ФСБЦ|ФССЦ|ССЦ|ТСЦ|ТЦ_)/i.test(code.trim());
}

export interface MaterialListResult {
  rows: MaterialListRow[];
  totalMaterials: number;
  uniqueMaterials: number;
  unaccountedMaterials: number;
  totalCost: number;
}

/**
 * Формирует список материалов
 */
export function buildMaterialList(
  estimate: Estimate,
  options: Partial<MaterialListOptions> = {}
): MaterialListResult {
  const opts: MaterialListOptions = {
    groupBy: options.groupBy ?? 'flat',
    mergeIdentical: options.mergeIdentical ?? true,
    showSourcePositions: options.showSourcePositions ?? true,
    separateUnaccounted: options.separateUnaccounted ?? true,
    includeBasePrices: options.includeBasePrices ?? true,
    includeCurrentPrices: options.includeCurrentPrices ?? false,
    exportFormat: options.exportFormat ?? 'xlsx',
  };

  // 1. Собираем все материалы
  const allMaterials: {
    code: string;
    name: string;
    unit: string;
    quantity: number;
    price: number;
    total: number;
    type: 'basic' | 'unaccounted';
    sourcePosition: number;
    sectionName: string;
  }[] = [];

  for (const section of estimate.sections) {
    for (const item of section.items) {
      // Nested materials (from work item's material list)
      for (const mat of item.materials) {
        allMaterials.push({
          code: mat.code,
          name: mat.name,
          unit: mat.unit,
          quantity: mat.quantityTotal > 0 ? mat.quantityTotal :
                    (mat.quantityPerUnit * item.quantity),
          price: mat.priceBase,
          total: mat.priceTotal > 0 ? mat.priceTotal :
                 (mat.priceBase * (mat.quantityTotal > 0 ? mat.quantityTotal : mat.quantityPerUnit * item.quantity)),
          type: mat.type,
          sourcePosition: item.positionNumber,
          sectionName: section.name,
        });
      }

      // Standalone material items (ФСБЦ, ТЦ_, ФССЦ, ССЦ, ТСЦ codes — priced materials)
      if (isMaterialCode(item.code)) {
        allMaterials.push({
          code: item.code,
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
          price: item.directCostUnit > 0 ? item.directCostUnit :
                 (item.quantity > 0 ? item.directCostTotal / item.quantity : 0),
          total: item.directCostTotal,
          type: 'basic',
          sourcePosition: item.positionNumber,
          sectionName: section.name,
        });
      }
    }
  }

  // 2. Объединяем одинаковые (по коду)
  let rows: MaterialListRow[];

  if (opts.mergeIdentical) {
    rows = mergeMaterials(allMaterials);
  } else {
    rows = allMaterials.map((m, idx) => ({
      number: idx + 1,
      name: m.name,
      code: m.code,
      unit: m.unit,
      quantity: m.quantity,
      priceBase: m.price,
      totalBase: m.total,
      sourcePositions: [m.sourcePosition],
      type: m.type,
      sectionName: m.sectionName,
    }));
  }

  // 3. Группировка
  if (opts.groupBy === 'section') {
    rows = groupBySection(rows);
  } else if (opts.groupBy === 'type') {
    rows = groupByType(rows, opts.separateUnaccounted);
  }

  // 4. Сортировка (по алфавиту внутри групп)
  const sectionRows = rows.filter(r => r.isSection);
  const dataRows = rows.filter(r => !r.isSection);
  dataRows.sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  // Перенумеровываем
  let counter = 0;
  for (const row of dataRows) {
    counter++;
    row.number = counter;
  }

  // Если есть группировка, собираем обратно
  if (sectionRows.length > 0) {
    rows = rebuildGroupedRows(rows);
  } else {
    rows = dataRows;
  }

  const unaccounted = rows.filter(r => !r.isSection && r.type === 'unaccounted').length;
  const totalCost = rows.filter(r => !r.isSection).reduce((sum, r) => sum + r.totalBase, 0);

  return {
    rows,
    totalMaterials: allMaterials.length,
    uniqueMaterials: rows.filter(r => !r.isSection).length,
    unaccountedMaterials: unaccounted,
    totalCost,
  };
}

function mergeMaterials(materials: any[]): MaterialListRow[] {
  const merged = new Map<string, MaterialListRow>();

  for (const mat of materials) {
    const key = mat.code || mat.name; // Если код пустой — группируем по имени

    if (merged.has(key)) {
      const existing = merged.get(key)!;
      existing.quantity += mat.quantity;
      existing.totalBase += mat.total;
      if (!existing.sourcePositions.includes(mat.sourcePosition)) {
        existing.sourcePositions.push(mat.sourcePosition);
      }
    } else {
      merged.set(key, {
        number: 0,
        name: mat.name,
        code: mat.code,
        unit: mat.unit,
        quantity: mat.quantity,
        priceBase: mat.price,
        totalBase: mat.total,
        sourcePositions: [mat.sourcePosition],
        type: mat.type,
        sectionName: mat.sectionName,
      });
    }
  }

  return Array.from(merged.values());
}

function groupBySection(rows: MaterialListRow[]): MaterialListRow[] {
  const groups = new Map<string, MaterialListRow[]>();

  for (const row of rows) {
    const section = row.sectionName || 'Без раздела';
    if (!groups.has(section)) groups.set(section, []);
    groups.get(section)!.push(row);
  }

  const result: MaterialListRow[] = [];
  for (const [section, items] of groups) {
    result.push({
      number: 0,
      name: section,
      code: '',
      unit: '',
      quantity: 0,
      priceBase: 0,
      totalBase: 0,
      sourcePositions: [],
      type: 'basic',
      isSection: true,
    });
    result.push(...items);
  }

  return result;
}

function groupByType(rows: MaterialListRow[], separateUnaccounted: boolean): MaterialListRow[] {
  if (!separateUnaccounted) return rows;

  const basic = rows.filter(r => r.type === 'basic');
  const unaccounted = rows.filter(r => r.type === 'unaccounted');

  const result: MaterialListRow[] = [];

  if (basic.length > 0) {
    result.push({
      number: 0,
      name: 'Учтённые материалы',
      code: '', unit: '', quantity: 0, priceBase: 0, totalBase: 0,
      sourcePositions: [], type: 'basic', isSection: true,
    });
    result.push(...basic);
  }

  if (unaccounted.length > 0) {
    result.push({
      number: 0,
      name: 'Неучтённые материалы (требуют уточнения цены)',
      code: '', unit: '', quantity: 0, priceBase: 0, totalBase: 0,
      sourcePositions: [], type: 'unaccounted', isSection: true,
    });
    result.push(...unaccounted);
  }

  return result;
}

function rebuildGroupedRows(rows: MaterialListRow[]): MaterialListRow[] {
  // Перенумеровываем строки внутри каждой группы
  let counter = 0;
  return rows.map(row => {
    if (row.isSection) return row;
    counter++;
    return { ...row, number: counter };
  });
}
