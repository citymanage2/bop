/**
 * Маппинг колонок Excel-файла ГрандСмета
 *
 * Поддерживает два формата:
 * 1. Базисно-индексный (17 колонок): стоимость на ед. (5 подколонок) + общая стоимость (5 подколонок) + трудозатраты
 * 2. Ресурсно-индексный (12 колонок): количество (3 подколонки) + сметная стоимость (5 подколонок)
 *
 * Заголовок может занимать 2-3 строки (многострочный с merged cells).
 * После заголовка идёт строка с числовыми номерами колонок: 1 | 2 | 3 | ... | 12
 */

import type { Worksheet, Row } from 'exceljs';

export interface ColumnMapping {
  posNumber: number;         // № п/п
  code: number;              // Обоснование (шифр расценки)
  name: number;              // Наименование
  unit: number;              // Ед. изм.
  quantity: number;          // Кол-во (основное/на единицу)
  quantityTotal: number;     // Кол-во всего с коэффициентами (ресурсно-индексный)
  unitCostTotal: number;     // Стоимость ед. — Всего
  unitCostLabor: number;     // Стоимость ед. — ОЗП
  unitCostMachine: number;   // Стоимость ед. — ЭМ
  unitCostMachineLabor: number; // Стоимость ед. — в т.ч. ЗПМ
  unitCostMaterial: number;  // Стоимость ед. — Мат.
  totalCostTotal: number;    // Общая стоимость — Всего (или "всего в текущем уровне цен")
  totalCostLabor: number;    // Общая стоимость — ОЗП
  totalCostMachine: number;  // Общая стоимость — ЭМ
  totalCostMachineLabor: number; // Общая стоимость — в т.ч. ЗПМ
  totalCostMaterial: number; // Общая стоимость — Мат.
  laborHours: number;        // Трудозатраты — чел.-ч
  machineLaborHours: number; // Трудозатраты — маш.-ч
  headerRow: number;         // Номер строки заголовка (последняя строка заголовка, после которой идут данные)
  format: 'standard' | 'resource-index'; // Тип формата сметы
}

/**
 * Автоматически определяет маппинг колонок по заголовкам
 */
export function detectColumnMapping(worksheet: Worksheet): ColumnMapping | null {
  const maxSearchRow = Math.min(50, worksheet.rowCount);

  // Стратегия 1: ищем "числовую" строку (1 | 2 | 3 | ... | N) — она всегда идёт сразу после заголовка
  const numberedRow = findNumberedRow(worksheet, maxSearchRow);
  if (numberedRow) {
    return buildMappingFromNumberedRow(worksheet, numberedRow.rowIdx, numberedRow.logicalColumns, numberedRow.logicalToPhysical);
  }

  // Стратегия 2: ищем строку с характерными заголовками (№ п/п, Обоснование, Наименование)
  for (let rowIdx = 1; rowIdx <= maxSearchRow; rowIdx++) {
    const row = worksheet.getRow(rowIdx);
    const mapping = tryMapRow(row, rowIdx);
    if (mapping) return mapping;
  }

  // Стратегия 3: ищем в нескольких строках (заголовок может быть разбит на 2-3 строки)
  for (let rowIdx = 1; rowIdx <= maxSearchRow; rowIdx++) {
    const row = worksheet.getRow(rowIdx);
    if (rowContainsHeaders(row)) {
      return buildMappingFromHeaders(worksheet, rowIdx);
    }
  }

  // Стратегия 4: ищем первую строку с позицией (числом в колонке 1 и кодом расценки в колонке 2)
  const fallback = findFirstDataRow(worksheet, maxSearchRow);
  if (fallback) {
    return fallback;
  }

  return null;
}

/**
 * Ищет строку-нумератор колонок: 1 | 2 | 3 | ... | N
 * Учитывает merged cells: значения могут повторяться (напр. 1,2,3,3,3,3,3,4,5,6,7,8,9,10,11,12)
 * Возвращает номер строки, количество логических колонок и маппинг логический→физический номер колонки
 */
function findNumberedRow(worksheet: Worksheet, maxRow: number): {
  rowIdx: number;
  logicalColumns: number;
  logicalToPhysical: Map<number, number>;  // logical col number → first physical col number
} | null {
  for (let rowIdx = 1; rowIdx <= maxRow; rowIdx++) {
    const row = worksheet.getRow(rowIdx);
    const colValues: { col: number; val: number }[] = [];
    let allNumbers = true;

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const val = cell.value;
      if (typeof val === 'number') {
        colValues.push({ col: colNumber, val });
      } else if (typeof val === 'string') {
        const n = parseInt(val.trim(), 10);
        if (!isNaN(n) && val.trim() === String(n)) colValues.push({ col: colNumber, val: n });
        else allNumbers = false;
      } else {
        allNumbers = false;
      }
    });

    if (!allNumbers || colValues.length < 8) continue;

    // Дедуплицируем: берём ПЕРВУЮ физическую колонку для каждого логического номера
    const logicalToPhysical = new Map<number, number>();
    for (const { col, val } of colValues) {
      if (!logicalToPhysical.has(val)) {
        logicalToPhysical.set(val, col);
      }
    }

    // Проверяем, что уникальные значения — последовательные от 1 до N
    const uniqueVals = [...logicalToPhysical.keys()].sort((a, b) => a - b);
    if (uniqueVals.length < 8) continue;
    const isSequential = uniqueVals.every((v, i) => v === i + 1);
    if (isSequential) {
      return { rowIdx, logicalColumns: uniqueVals.length, logicalToPhysical };
    }
  }
  return null;
}

/**
 * Строит маппинг на основе числовой строки заголовка
 * Использует logicalToPhysical для конвертации логических номеров колонок в физические
 */
function buildMappingFromNumberedRow(
  worksheet: Worksheet,
  numberedRowIdx: number,
  logicalColumns: number,
  logicalToPhysical: Map<number, number>,
): ColumnMapping {
  // Хелпер: логический номер → физический номер колонки
  const phys = (logical: number): number => logicalToPhysical.get(logical) ?? -1;

  const mapping = createEmptyMapping(numberedRowIdx);

  // Логические колонки 1-4 всегда одинаковые
  mapping.posNumber = phys(1);   // № п/п
  mapping.code = phys(2);        // Обоснование
  mapping.name = phys(3);        // Наименование (первая физическая колонка мержа)
  mapping.unit = phys(4);        // Единица измерения

  if (logicalColumns === 12) {
    // Ресурсно-индексный метод (12 логических колонок)
    // Лог 5: Количество — на единицу измерения
    // Лог 6: Количество — коэффициенты
    // Лог 7: Количество — всего с учетом коэффициентов
    // Лог 8: Сметная стоимость — на ед. в базисном уровне цен
    // Лог 9: Сметная стоимость — индекс
    // Лог 10: Сметная стоимость — на ед. в текущем уровне цен
    // Лог 11: Сметная стоимость — коэффициенты
    // Лог 12: Сметная стоимость — всего в текущем уровне цен
    mapping.format = 'resource-index';
    mapping.quantity = phys(5);
    mapping.quantityTotal = phys(7);
    mapping.unitCostTotal = phys(8);
    mapping.totalCostTotal = phys(12);
  } else if (logicalColumns >= 17) {
    // Стандартный базисно-индексный метод (17+ колонок)
    mapping.format = 'standard';
    mapping.quantity = phys(5);
    mapping.unitCostTotal = phys(6);
    mapping.unitCostLabor = phys(7);
    mapping.unitCostMachine = phys(8);
    mapping.unitCostMachineLabor = phys(9);
    mapping.unitCostMaterial = phys(10);
    mapping.totalCostTotal = phys(11);
    mapping.totalCostLabor = phys(12);
    mapping.totalCostMachine = phys(13);
    mapping.totalCostMachineLabor = phys(14);
    mapping.totalCostMaterial = phys(15);
    mapping.laborHours = phys(16);
    mapping.machineLaborHours = phys(17);
  } else {
    // Между 12 и 17 — пытаемся как resource-index
    mapping.format = 'resource-index';
    mapping.quantity = phys(5);
    mapping.quantityTotal = phys(7);
    mapping.unitCostTotal = phys(8);
    mapping.totalCostTotal = phys(logicalColumns);
  }

  return mapping;
}

function getCellText(row: Row, col: number): string {
  const cell = row.getCell(col);
  if (!cell || !cell.value) return '';
  return String(cell.value).trim().toLowerCase();
}

function rowContainsHeaders(row: Row): boolean {
  const texts: string[] = [];
  row.eachCell((cell) => {
    if (cell.value) texts.push(String(cell.value).trim().toLowerCase());
  });
  const joined = texts.join(' ');
  return (
    (joined.includes('п/п') || joined.includes('№')) &&
    (joined.includes('обоснование') || joined.includes('шифр')) &&
    (joined.includes('наименование') || joined.includes('наимен'))
  );
}

function tryMapRow(row: Row, rowIdx: number): ColumnMapping | null {
  const cellTexts = new Map<number, string>();

  row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    if (cell.value) {
      cellTexts.set(colNumber, String(cell.value).trim().toLowerCase());
    }
  });

  // Нужны как минимум "№ п/п" и "Наименование"
  let hasNumber = false;
  let hasName = false;

  for (const text of cellTexts.values()) {
    if (text.includes('п/п') || text === '№') hasNumber = true;
    if (text.includes('наименование') || text.includes('наимен')) hasName = true;
  }

  if (!hasNumber || !hasName) return null;

  return buildMappingFromCells(cellTexts, rowIdx);
}

function buildMappingFromCells(cellTexts: Map<number, string>, headerRow: number): ColumnMapping {
  const mapping = createEmptyMapping(headerRow);

  for (const [col, text] of cellTexts.entries()) {
    if (text.includes('п/п') || text === '№') {
      mapping.posNumber = col;
    } else if (text.includes('обоснование') || text.includes('шифр')) {
      mapping.code = col;
    } else if (text.includes('наименование') || text.includes('наимен')) {
      mapping.name = col;
    } else if (text.includes('ед') && (text.includes('изм') || text.includes('.'))) {
      mapping.unit = col;
    } else if (text.includes('кол') && !text.includes('стоим')) {
      mapping.quantity = col;
    }
  }

  // Стандартный порядок ГрандСмета после "Кол."
  if (mapping.quantity > 0) {
    const base = mapping.quantity;
    mapping.unitCostTotal = base + 1;
    mapping.unitCostLabor = base + 2;
    mapping.unitCostMachine = base + 3;
    mapping.unitCostMachineLabor = base + 4;
    mapping.unitCostMaterial = base + 5;
    mapping.totalCostTotal = base + 6;
    mapping.totalCostLabor = base + 7;
    mapping.totalCostMachine = base + 8;
    mapping.totalCostMachineLabor = base + 9;
    mapping.totalCostMaterial = base + 10;
    mapping.laborHours = base + 11;
    mapping.machineLaborHours = base + 12;
  }

  return mapping;
}

function buildMappingFromHeaders(worksheet: Worksheet, headerRowIdx: number): ColumnMapping | null {
  const row = worksheet.getRow(headerRowIdx);
  const cellTexts = new Map<number, string>();

  row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    if (cell.value) {
      cellTexts.set(colNumber, String(cell.value).trim().toLowerCase());
    }
  });

  return buildMappingFromCells(cellTexts, headerRowIdx);
}

/**
 * Fallback: ищем первую строку данных по паттерну: число | код расценки | текст | ед.изм | число
 */
function findFirstDataRow(worksheet: Worksheet, maxRow: number): ColumnMapping | null {
  for (let rowIdx = 1; rowIdx <= maxRow; rowIdx++) {
    const row = worksheet.getRow(rowIdx);
    const c1 = getCellText(row, 1);
    const c2 = getCellText(row, 2);
    const c3 = getCellText(row, 3);

    // Проверяем: col1 = число, col2 = код расценки (содержит дефисы и цифры)
    const isPos = /^\d+$/.test(c1);
    const isCode = /^[а-яА-ЯёЁa-zA-Z]+\d{2}-\d{2}-\d{3}/.test(c2) || /^(ТЕР|ФЕР|ГЭСН|ОЕР)/i.test(c2);

    if (isPos && isCode && c3.length > 5) {
      // Нашли строку данных, строим маппинг по умолчанию
      // Ищем сколько колонок в этой строке
      let maxCol = 0;
      row.eachCell({ includeEmpty: false }, (_cell, colNumber) => {
        if (colNumber > maxCol) maxCol = colNumber;
      });

      const mapping = createEmptyMapping(rowIdx - 1);
      mapping.posNumber = 1;
      mapping.code = 2;
      mapping.name = 3;
      mapping.unit = 4;
      mapping.quantity = 5;

      if (maxCol <= 12) {
        mapping.format = 'resource-index';
        mapping.quantityTotal = 7;
        mapping.unitCostTotal = 8;
        mapping.totalCostTotal = 12;
      } else {
        mapping.format = 'standard';
        mapping.unitCostTotal = 6;
        mapping.unitCostLabor = 7;
        mapping.unitCostMachine = 8;
        mapping.unitCostMachineLabor = 9;
        mapping.unitCostMaterial = 10;
        mapping.totalCostTotal = 11;
        mapping.totalCostLabor = 12;
        mapping.totalCostMachine = 13;
        mapping.totalCostMachineLabor = 14;
        mapping.totalCostMaterial = 15;
        mapping.laborHours = 16;
        mapping.machineLaborHours = 17;
      }

      return mapping;
    }
  }
  return null;
}

function createEmptyMapping(headerRow: number): ColumnMapping {
  return {
    posNumber: -1,
    code: -1,
    name: -1,
    unit: -1,
    quantity: -1,
    quantityTotal: -1,
    unitCostTotal: -1,
    unitCostLabor: -1,
    unitCostMachine: -1,
    unitCostMachineLabor: -1,
    unitCostMaterial: -1,
    totalCostTotal: -1,
    totalCostLabor: -1,
    totalCostMachine: -1,
    totalCostMachineLabor: -1,
    totalCostMaterial: -1,
    laborHours: -1,
    machineLaborHours: -1,
    headerRow,
    format: 'standard',
  };
}
