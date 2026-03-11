/**
 * Regex-паттерны для распознавания элементов сметы ГрандСмета в PDF
 */

// Шифры расценок
export const RASCENKA_CODE = /^(ТЕР|ФЕР|ТСН|ГЭСН|ОЕР|ТЕРр|ФЕРр|ТЕРм|ФЕРм|ТЕРп|ФЕРп|ССЦ|ФССЦ|ТСЦ)\d{2}-\d{2}-\d{3}-\d{2}/;

// Код ресурса (материала)
export const RESOURCE_CODE = /^\d{3}-\d{4}/;

// Код механизма
export const MACHINE_CODE = /^0[23]\d-\d{4}/;

// Заголовок раздела
export const SECTION_HEADER = /^Раздел\s+(\d+)\.\s*(.+)/i;

// Итого по разделу
export const SECTION_TOTAL = /^Итого\s+по\s+разделу\s*(\d*)/i;

// Итого прямые затраты
export const DIRECT_TOTAL = /^Итого\s+прямые\s+затраты/i;

// Накладные расходы
export const OVERHEAD = /^Накладные\s+расходы/i;

// Сметная прибыль
export const PROFIT = /^Сметная\s+прибыль/i;

// Всего по смете
export const ESTIMATE_TOTAL = /^(Всего\s+по\s+смете|Итого\s+по\s+смете)/i;

// НДС
export const VAT = /^НДС\s+(\d+)%/i;

// Коэффициент
export const COEFFICIENT = /^(К|ПК)\s*=\s*([\d.,]+)/;

// Номер позиции (число в начале строки)
export const POSITION_NUMBER = /^\s*(\d{1,4})\s+/;

// Единицы измерения
export const UNIT_PATTERN = /^(м2|м3|м\.п\.|шт\.?|т|кг|л|компл\.?|100\s*м2|100\s*м3|1000\s*м3|тыс\.\s*шт|чел\.-ч|маш\.-ч|уп\.?|рулон|п\.м\.?)$/i;

// Число (в т.ч. с запятой как разделителем)
export const NUMBER_PATTERN = /^-?\d+[,.]?\d*$/;

// Повторяющийся заголовок таблицы (на новой странице)
export const TABLE_HEADER_REPEAT = /^№\s*п\/п|^Обоснование|^Наименование/i;

/**
 * Определяет, является ли строка строкой позиции сметы
 */
export function isPositionLine(text: string): boolean {
  return POSITION_NUMBER.test(text) && RASCENKA_CODE.test(text.replace(POSITION_NUMBER, '').trim());
}

/**
 * Извлекает данные из строки позиции
 */
export function parsePositionLine(text: string): {
  posNumber: number;
  code: string;
  rest: string;
} | null {
  const posMatch = text.match(POSITION_NUMBER);
  if (!posMatch) return null;

  const posNumber = parseInt(posMatch[1], 10);
  const afterPos = text.substring(posMatch[0].length).trim();
  const codeMatch = afterPos.match(RASCENKA_CODE);
  if (!codeMatch) return null;

  return {
    posNumber,
    code: codeMatch[0],
    rest: afterPos.substring(codeMatch[0].length).trim(),
  };
}
