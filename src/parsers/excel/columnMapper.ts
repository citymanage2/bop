/**
 * Маппинг колонок Excel-файла ГрандСмета
 *
 * ГрандСмета экспортирует сметы с типичными заголовками колонок:
 * № п/п | Обоснование | Наименование | Ед.изм. | Кол. |
 * Стоимость единицы (руб.) [...] | Общая стоимость (руб.) [...] |
 * Трудозатраты [...]
 */

import type { Worksheet, Row } from 'exceljs';

export interface ColumnMapping {
  posNumber: number;         // № п/п
  code: number;              // Обоснование (шифр расценки)
  name: number;              // Наименование
  unit: number;              // Ед. изм.
  quantity: number;          // Кол-во
  unitCostTotal: number;     // Стоимость ед. — Всего
  unitCostLabor: number;     // Стоимость ед. — ОЗП
  unitCostMachine: number;   // Стоимость ед. — ЭМ
  unitCostMachineLabor: number; // Стоимость ед. — в т.ч. ЗПМ
  unitCostMaterial: number;  // Стоимость ед. — Мат.
  totalCostTotal: number;    // Общая стоимость — Всего
  totalCostLabor: number;    // Общая стоимость — ОЗП
  totalCostMachine: number;  // Общая стоимость — ЭМ
  totalCostMachineLabor: number; // Общая стоимость — в т.ч. ЗПМ
  totalCostMaterial: number; // Общая стоимость — Мат.
  laborHours: number;        // Трудозатраты — чел.-ч
  machineLaborHours: number; // Трудозатраты — маш.-ч
  headerRow: number;         // Номер строки заголовка
}

/**
 * Автоматически определяет маппинг колонок по заголовкам
 */
export function detectColumnMapping(worksheet: Worksheet): ColumnMapping | null {
  // Ищем строку заголовка в первых 20 строках
  for (let rowIdx = 1; rowIdx <= Math.min(20, worksheet.rowCount); rowIdx++) {
    const row = worksheet.getRow(rowIdx);
    const mapping = tryMapRow(row, rowIdx);
    if (mapping) return mapping;
  }

  // Попробуем поиск по характерным словам в любой строке
  for (let rowIdx = 1; rowIdx <= Math.min(30, worksheet.rowCount); rowIdx++) {
    const row = worksheet.getRow(rowIdx);
    if (rowContainsHeaders(row)) {
      return buildMappingFromHeaders(worksheet, rowIdx);
    }
  }

  return null;
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
  const mapping: ColumnMapping = {
    posNumber: -1,
    code: -1,
    name: -1,
    unit: -1,
    quantity: -1,
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
  };

  for (const [col, text] of cellTexts.entries()) {
    if (text.includes('п/п') || text === '№') {
      mapping.posNumber = col;
    } else if (text.includes('обоснование') || text.includes('шифр')) {
      mapping.code = col;
    } else if (text.includes('наименование') || text.includes('наимен')) {
      mapping.name = col;
    } else if (text.includes('ед') && (text.includes('изм') || text.includes('.') )) {
      mapping.unit = col;
    } else if (text.includes('кол') && !text.includes('стоим')) {
      mapping.quantity = col;
    }
  }

  // Если не удалось точно определить стоимостные колонки,
  // предполагаем стандартный порядок ГрандСмета:
  // после "Кол." идут: всего | ОЗП | ЭМ | ЗПМ | Мат. (на ед.) | всего | ОЗП | ЭМ | ЗПМ | Мат. (общая)
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
