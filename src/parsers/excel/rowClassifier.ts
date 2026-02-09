/**
 * Классификатор строк Excel-сметы ГрандСмета
 *
 * Определяет тип каждой строки: расценка, материал, механизм,
 * заголовок раздела, итого, коэффициент и т.д.
 */

import type { Row } from 'exceljs';
import type { ColumnMapping } from './columnMapper';
import type { RowType } from '../../models/estimate';
import {
  isRascenkaCode,
  isResourceCode,
  isMachineCode,
  isSectionHeader,
  isTotalRow,
  isPositionTotal,
  isCoefficientRow,
  isOverheadRow,
  isProfitRow,
} from '../../utils/textClean';

export interface ClassifiedRow {
  rowType: RowType;
  rowNumber: number;
  posNumber: number | null;
  code: string;
  name: string;
  unit: string;
  quantity: number;
  values: RowValues;
}

export interface RowValues {
  unitCostTotal: number;
  unitCostLabor: number;
  unitCostMachine: number;
  unitCostMachineLabor: number;
  unitCostMaterial: number;
  totalCostTotal: number;
  totalCostLabor: number;
  totalCostMachine: number;
  totalCostMachineLabor: number;
  totalCostMaterial: number;
  laborHours: number;
  machineLaborHours: number;
}

function getCellValue(row: Row, col: number): any {
  if (col < 0) return null;
  const cell = row.getCell(col);
  return cell?.value ?? null;
}

function getCellText(row: Row, col: number): string {
  const val = getCellValue(row, col);
  if (val === null || val === undefined) return '';
  // Handle ExcelJS rich text objects
  if (typeof val === 'object' && 'richText' in val) {
    return (val as any).richText.map((r: any) => r.text).join('').trim();
  }
  return String(val).trim();
}

function getCellNumber(row: Row, col: number): number {
  const val = getCellValue(row, col);
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  const str = String(val).replace(/\s/g, '').replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Классифицирует строку Excel-таблицы
 */
export function classifyRow(row: Row, mapping: ColumnMapping, rowNumber: number): ClassifiedRow {
  const posText = getCellText(row, mapping.posNumber);
  // Code field may contain embedded filenames from linked cells (multi-line values)
  // Strip everything after the first newline
  const rawCode = getCellText(row, mapping.code);
  const code = rawCode.includes('\n') ? rawCode.split('\n')[0].trim() : rawCode;
  const name = getCellText(row, mapping.name);
  const unit = getCellText(row, mapping.unit);

  // Для ресурсно-индексного формата: используем quantityTotal если есть,
  // иначе основное поле quantity
  let quantity = getCellNumber(row, mapping.quantity);
  if (mapping.quantityTotal > 0) {
    const qTotal = getCellNumber(row, mapping.quantityTotal);
    if (qTotal !== 0) quantity = qTotal;
  }

  // Detect merged sub-header rows: when a row is a single merged cell spanning all columns,
  // every column returns the same text. This happens with floor markers like "1 Этаж Полы..."
  // Also check code === name (posText may differ if column 1 is not in the same merge range)
  const isMergedRow = !!(
    (posText && code && name && posText === code && code === name) ||
    (code && name && unit && code === name && name === unit && code.length > 10)
  );

  const posNumber = posText ? parseInt(posText, 10) : null;

  const values: RowValues = {
    unitCostTotal: getCellNumber(row, mapping.unitCostTotal),
    unitCostLabor: getCellNumber(row, mapping.unitCostLabor),
    unitCostMachine: getCellNumber(row, mapping.unitCostMachine),
    unitCostMachineLabor: getCellNumber(row, mapping.unitCostMachineLabor),
    unitCostMaterial: getCellNumber(row, mapping.unitCostMaterial),
    totalCostTotal: getCellNumber(row, mapping.totalCostTotal),
    totalCostLabor: getCellNumber(row, mapping.totalCostLabor),
    totalCostMachine: getCellNumber(row, mapping.totalCostMachine),
    totalCostMachineLabor: getCellNumber(row, mapping.totalCostMachineLabor),
    totalCostMaterial: getCellNumber(row, mapping.totalCostMaterial),
    laborHours: getCellNumber(row, mapping.laborHours),
    machineLaborHours: getCellNumber(row, mapping.machineLaborHours),
  };

  const rowType = isMergedRow
    ? detectMergedRowType(name)
    : detectRowType(posNumber, code, name, unit, quantity);

  return {
    rowType,
    rowNumber,
    posNumber: (posNumber && !isNaN(posNumber)) ? posNumber : null,
    code,
    name,
    unit,
    quantity,
    values,
  };
}

/**
 * Определяет тип для merged row (одна ячейка, растянутая на все колонки)
 * Такие строки обычно являются подзаголовками разделов/этажей/помещений
 */
function detectMergedRowType(text: string): RowType {
  if (!text) return 'empty';
  if (isSectionHeader(text)) return 'section_header';
  if (isTotalRow(text)) return 'total';
  if (isOverheadRow(text)) return 'overhead';
  if (isProfitRow(text)) return 'profit';
  // Floor markers, sub-headers like "1 Этаж Полы..." — treat as continuation (skip)
  return 'continuation';
}

/**
 * Определяет тип строки по её содержимому
 */
function detectRowType(
  posNumber: number | null,
  code: string,
  name: string,
  unit: string,
  quantity: number,
): RowType {
  // Пустая строка
  if (!code && !name && !unit) {
    return 'empty';
  }

  // Заголовок раздела
  if (isSectionHeader(name) || isSectionHeader(code)) {
    return 'section_header';
  }

  // Итог по позиции ("Всего по позиции") — позиционный подитог
  if (isPositionTotal(name)) {
    return 'subtotal';
  }

  // Строка итогов (по разделу / по смете)
  if (isTotalRow(name)) {
    return 'total';
  }

  // Накладные расходы (название или код типа "Пр/...НР")
  if (isOverheadRow(name) || (code && /^Пр\//i.test(code) && /НР/i.test(name))) {
    return 'overhead';
  }

  // Сметная прибыль (название или код типа "Пр/...СП")
  if (isProfitRow(name) || (code && /^Пр\//i.test(code) && /СП/i.test(name))) {
    return 'profit';
  }

  // Коэффициент
  if (isCoefficientRow(name) || isCoefficientRow(code)) {
    return 'coefficient';
  }

  // Строка расценки: есть порядковый номер и код расценки
  if (posNumber && !isNaN(posNumber) && isRascenkaCode(code)) {
    return 'work_item';
  }

  // Материал: есть код ресурса (но не код расценки)
  if (isResourceCode(code) && !isMachineCode(code)) {
    return 'material';
  }

  // Механизм
  if (isMachineCode(code)) {
    return 'machine';
  }

  // Если есть номер позиции, но код не распознан — возможно, нестандартная расценка
  if (posNumber && !isNaN(posNumber) && code && unit) {
    return 'work_item';
  }

  // Строка с текстом без кода — продолжение наименования или подитог
  if (name && !unit) {
    const lower = name.toLowerCase();
    if (lower.includes('итого') || lower.includes('всего по')) {
      return 'subtotal';
    }
    // Строка ОТ(ЗТ), Объем=, информационная строка — пропускаем
    if (/^Объем\s*=/i.test(name) || /^\d+\s*ОТ\s*\(/i.test(name) || /^\d+\s*Этаж/i.test(name)) {
      return 'continuation';
    }
    if (!code) {
      return 'continuation';
    }
  }

  return 'unknown';
}
