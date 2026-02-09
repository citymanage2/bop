/**
 * Утилиты для очистки и нормализации текста из смет
 */

/** Удаляет лишние пробелы и переносы строк */
export function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Склеивает многострочное наименование */
export function joinMultiline(lines: string[]): string {
  return lines
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .join(' ');
}

/** Извлекает число из строки (поддержка запятой как разделителя) */
export function parseNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;

  const cleaned = value
    .toString()
    .replace(/\s/g, '')
    .replace(',', '.');

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/** Проверяет, является ли строка шифром расценки */
export function isRascenkaCode(code: string): boolean {
  if (!code) return false;
  return /^(ТЕР|ФЕР|ТСН|ГЭСН|ОЕР|ТЕРр|ФЕРр|ТЕРм|ФЕРм|ТЕРп|ФЕРп|ССЦ|ФССЦ|ТСЦ)\d{2}-\d{2}-\d{3}/.test(code.trim());
}

/** Проверяет, является ли строка кодом ресурса (материала/механизма) */
export function isResourceCode(code: string): boolean {
  if (!code) return false;
  return /^\d{3}-\d{4}/.test(code.trim());
}

/** Проверяет, является ли строка кодом механизма */
export function isMachineCode(code: string): boolean {
  if (!code) return false;
  // Коды механизмов обычно начинаются с 020-, 021-, 030- и т.д.
  return /^0[23]\d-\d{4}/.test(code.trim());
}

/** Определяет начало нового раздела */
export function isSectionHeader(text: string): boolean {
  if (!text) return false;
  return /^Раздел\s+\d+/i.test(text.trim());
}

/** Извлекает номер раздела из заголовка */
export function extractSectionNumber(text: string): number {
  const match = text.match(/Раздел\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
}

/** Проверяет строку итогов */
export function isTotalRow(text: string): boolean {
  if (!text) return false;
  return /^Итого\s+(по\s+разделу|прямые|по\s+смете)/i.test(text.trim());
}

/** Проверяет строку коэффициента */
export function isCoefficientRow(text: string): boolean {
  if (!text) return false;
  return /^(К|ПК)\s*=\s*\d/.test(text.trim());
}

/** Проверяет строку накладных расходов */
export function isOverheadRow(text: string): boolean {
  if (!text) return false;
  return /^Накладные\s+расходы/i.test(text.trim());
}

/** Проверяет строку сметной прибыли */
export function isProfitRow(text: string): boolean {
  if (!text) return false;
  return /^Сметная\s+прибыль/i.test(text.trim());
}

/** Форматирует число для отображения */
export function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals).replace(/\.?0+$/, '');
}
