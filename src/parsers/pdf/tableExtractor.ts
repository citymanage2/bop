/**
 * Извлечение табличных данных из текста PDF
 *
 * PDF-файлы ГрандСмета содержат текст, организованный в табличную структуру.
 * Этот модуль пытается восстановить структуру таблицы из потока текста.
 */

import * as patterns from './patterns';

export interface PDFTableRow {
  text: string;
  posNumber: number | null;
  code: string;
  name: string;
  unit: string;
  quantity: number;
  values: number[];
  lineNumber: number;
}

/**
 * Разбирает текст PDF на строки таблицы
 */
export function extractTableRows(pdfText: string): PDFTableRow[] {
  const lines = pdfText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const rows: PDFTableRow[] = [];
  let lineNumber = 0;

  for (const line of lines) {
    lineNumber++;

    // Пропускаем повторяющиеся заголовки таблицы
    if (patterns.TABLE_HEADER_REPEAT.test(line)) continue;

    // Пробуем разобрать как позицию сметы
    const posData = patterns.parsePositionLine(line);
    if (posData) {
      const parsed = parseValuesFromLine(posData.rest);
      rows.push({
        text: line,
        posNumber: posData.posNumber,
        code: posData.code,
        name: parsed.name,
        unit: parsed.unit,
        quantity: parsed.quantity,
        values: parsed.values,
        lineNumber,
      });
      continue;
    }

    // Проверяем, является ли строка заголовком раздела
    const sectionMatch = line.match(patterns.SECTION_HEADER);
    if (sectionMatch) {
      rows.push({
        text: line,
        posNumber: null,
        code: '',
        name: line,
        unit: '',
        quantity: 0,
        values: [],
        lineNumber,
      });
      continue;
    }

    // Проверяем итоговые строки
    if (patterns.SECTION_TOTAL.test(line) ||
        patterns.DIRECT_TOTAL.test(line) ||
        patterns.ESTIMATE_TOTAL.test(line) ||
        patterns.OVERHEAD.test(line) ||
        patterns.PROFIT.test(line)) {
      const nums = extractNumbers(line);
      rows.push({
        text: line,
        posNumber: null,
        code: '',
        name: line.replace(/[\d\s.,]+$/, '').trim(),
        unit: '',
        quantity: 0,
        values: nums,
        lineNumber,
      });
      continue;
    }

    // Проверяем код ресурса (материал/механизм)
    const resourceMatch = line.match(patterns.RESOURCE_CODE);
    if (resourceMatch) {
      const afterCode = line.substring(resourceMatch[0].length).trim();
      const parsed = parseValuesFromLine(afterCode);
      rows.push({
        text: line,
        posNumber: null,
        code: resourceMatch[0],
        name: parsed.name,
        unit: parsed.unit,
        quantity: parsed.quantity,
        values: parsed.values,
        lineNumber,
      });
      continue;
    }

    // Обычная строка — продолжение наименования или другой текст
    if (line.length > 2 && !patterns.NUMBER_PATTERN.test(line)) {
      rows.push({
        text: line,
        posNumber: null,
        code: '',
        name: line,
        unit: '',
        quantity: 0,
        values: [],
        lineNumber,
      });
    }
  }

  return rows;
}

/**
 * Разбирает оставшуюся часть строки после кода расценки
 * Пытается выделить наименование, единицу, количество и числовые значения
 */
function parseValuesFromLine(text: string): {
  name: string;
  unit: string;
  quantity: number;
  values: number[];
} {
  // Ищем числа в конце строки
  const numbers = extractNumbers(text);
  const name = text.replace(/[\d\s.,]+$/, '').trim();

  // Пробуем найти единицу измерения
  const words = name.split(/\s+/);
  let unit = '';
  let cleanName = name;

  for (let i = words.length - 1; i >= 0; i--) {
    if (patterns.UNIT_PATTERN.test(words[i])) {
      unit = words[i];
      cleanName = words.slice(0, i).join(' ');
      break;
    }
  }

  const quantity = numbers.length > 0 ? numbers[0] : 0;
  const values = numbers.slice(1);

  return { name: cleanName || name, unit, quantity, values };
}

/**
 * Извлекает числа из строки
 */
function extractNumbers(text: string): number[] {
  const numPattern = /-?\d+[,.]?\d*/g;
  const matches = text.match(numPattern);
  if (!matches) return [];

  return matches.map(m => {
    const normalized = m.replace(',', '.');
    return parseFloat(normalized);
  }).filter(n => !isNaN(n));
}
