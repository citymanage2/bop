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
  const trimmed = code.trim();
  // Основные форматы: ТЕР, ФЕР, ГЭСН + суффиксы р/м/п/мр и т.д.
  // Примеры: ГЭСНр57-01-003-02, ТЕР01-001-001, ФЕРм11-01-010-01, ГЭСН08-02-001-01
  return /^(ТЕР|ФЕР|ТСН|ГЭСН|ОЕР|ССЦ|ФССЦ|ТСЦ|ЕР|ОЕРр|ОЕРм|ОЕРп)[а-яА-Яa-zA-Z]*\d{2}-\d{2}-\d{3}/.test(trimmed);
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
  return /^Раздел\s+\d+/i.test(text.trim()) || /^Раздел\s*\d+\./i.test(text.trim());
}

/** Извлекает номер раздела из заголовка */
export function extractSectionNumber(text: string): number {
  const match = text.match(/Раздел\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
}

/** Проверяет строку итогов */
export function isTotalRow(text: string): boolean {
  if (!text) return false;
  const t = text.trim();
  return /^Итого\s+(по\s+разделу|прямые|по\s+смете|direct)/i.test(t)
    || /^Всего\s+по\s+(позиции|разделу|смете)/i.test(t)
    || /^ФОТ$/i.test(t);
}

/** Проверяет строку коэффициента */
export function isCoefficientRow(text: string): boolean {
  if (!text) return false;
  return /^(К|ПК)\s*=\s*\d/.test(text.trim());
}

/** Проверяет строку накладных расходов */
export function isOverheadRow(text: string): boolean {
  if (!text) return false;
  const t = text.trim();
  return /^Накладные\s+расходы/i.test(t) || /^НР\s/i.test(t);
}

/** Проверяет строку сметной прибыли */
export function isProfitRow(text: string): boolean {
  if (!text) return false;
  const t = text.trim();
  return /^Сметная\s+прибыль/i.test(t) || /^СП\s/i.test(t);
}

/** Форматирует число для отображения */
export function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals).replace(/\.?0+$/, '');
}
