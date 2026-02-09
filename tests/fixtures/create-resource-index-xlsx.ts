/**
 * Creates a sample GrandSmeta resource-index (ресурсно-индексный) XLSX file for testing.
 * This matches the 12-column format used for ГЭСН estimates.
 * Run: npx tsx tests/fixtures/create-resource-index-xlsx.ts
 */

import ExcelJS from 'exceljs';
import path from 'path';

async function createSample() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Смета');

  // Rows 1-17: empty/logos (skip)
  for (let i = 0; i < 17; i++) sheet.addRow([]);

  // Row 18: Title
  sheet.addRow(['', '', '', '', '', 'ЛОКАЛЬНЫЙ СМЕТНЫЙ РАСЧЕТ (СМЕТА) № ЛСР-02-01-01.изм']);

  // Rows 19-35: metadata
  sheet.addRow([]); // 19
  sheet.addRow(['', '', '', '', '', 'Архитектурные решения']); // 20
  sheet.addRow(['', '', '', '', '', '(наименование работ и затрат)']); // 21
  sheet.addRow(['Составлен', '', 'ресурсно-индексным', '', 'методом']); // 22
  sheet.addRow(['Основание', '', '32414355550/8-АР']); // 23
  sheet.addRow([]); // 24
  sheet.addRow([]); // 25
  sheet.addRow(['Составлен(а) в текущем уровне цен', '', '', 'III квартал 2025 года']); // 26
  sheet.addRow([]); // 27
  sheet.addRow(['Сметная стоимость', '', '', '', '29 512,85 тыс.руб.']); // 28
  sheet.addRow(['', 'в том числе:']); // 29
  sheet.addRow(['', '', 'строительных работ', '', '25 359,25 тыс.руб.']); // 30
  sheet.addRow(['', '', 'монтажных работ', '', '4 153,60 тыс.руб.']); // 31
  sheet.addRow(['', '', 'оборудования', '', '0,00 тыс.руб.']); // 32
  sheet.addRow(['', '', 'прочих затрат', '', '0,00 тыс.руб.']); // 33
  sheet.addRow([]); // 34
  sheet.addRow([]); // 35

  // Row 36: Top header (merged cells)
  sheet.addRow([
    '№ п/п', 'Обоснование', 'Наименование работ и затрат', 'Единица измерения',
    'Количество', '', '', 'Сметная стоимость, руб.', '', '', '', '',
  ]);

  // Row 37: Sub-headers
  sheet.addRow([
    '', '', '', '',
    'на единицу измерения', 'коэффициенты', 'всего с учетом коэффициентов',
    'на единицу измерения в базисном уровне цен', 'индекс',
    'на единицу измерения в текущем уровне цен', 'коэффициенты',
    'всего в текущем уровне цен',
  ]);

  // Row 38: Numbered columns
  sheet.addRow([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

  // Row 39: Section 1
  sheet.addRow(['', '', 'Раздел 1. Демонтажные работы']);

  // Row 40: Sub-section description
  sheet.addRow(['', '', '1 Этаж Полы 32414355550/8-АР л.3']);

  // Row 41: Position 1 - ГЭСНр57-01-003-02
  sheet.addRow([
    1, 'ГЭСНр57-01-003-02',
    'Разборка плинтусов: цементных и из керамической плитки',
    '100 м', 7.3963, 1, 7.3963,
    '', '', '', '', '',
  ]);

  // Row 42: Volume formula
  sheet.addRow(['', '', 'Объем=739,63 / 100']);

  // Row 43: OT(ZT) resource line
  sheet.addRow(['', '', '1 ОТ(ЗТ)', 'чел.-ч', '', '', 105.619164, '', '', '', '', 51392.17]);

  // Row 44: Worker rate resource
  sheet.addRow(['', '1-100-20', 'Средний разряд работы 2,0', 'чел.-ч', 14.28, '', 105.619164, '', '', 486.58, '', 51392.17]);

  // Row 45: Material - construction waste
  sheet.addRow(['', '999-9900', 'Строительный мусор', 'м', 0.62, '', 4.585706, '', '', '', '', '']);

  // Row 46: Direct costs subtotal
  sheet.addRow(['', '', 'Итого прямые затраты', '', '', '', '', '', '', '', '', 51392.17]);

  // Row 47: FOT
  sheet.addRow(['', '', 'ФОТ', '', '', '', '', '', '', '', '', 51392.17]);

  // Row 48: Overhead
  sheet.addRow(['', 'Пр/812-091.0-1', 'НР Полы (ремонтно-строительные)', '%', 89, '', 89, '', '', '', '', 45739.03]);

  // Row 49: Profit
  sheet.addRow(['', 'Пр/774-091.0', 'СП Полы (ремонтно-строительные)', '%', 49, '', 49, '', '', '', '', 25182.16]);

  // Row 50: Position total
  sheet.addRow(['', '', 'Всего по позиции', '', '', '', '', '', '', 16537.10, '', 122313.36]);

  // Row 51: Position 2 - ГЭСНр57-01-003-01
  sheet.addRow([
    2, 'ГЭСНр57-01-003-01',
    'Разборка плинтусов: деревянных и из пластмассовых материалов',
    '100 м', 0.5387, 1, 0.5387,
    '', '', '', '', '',
  ]);

  // Row 52: Volume formula
  sheet.addRow(['', '', 'Объем=53,87 / 100']);

  // Row 53: OT(ZT)
  sheet.addRow(['', '', '1 ОТ(ЗТ)', 'чел.-ч', '', '', 2.030899, '', '', '', '', 988.19]);

  // Row 54: Worker rate
  sheet.addRow(['', '1-100-20', 'Средний разряд работы 2,0', 'чел.-ч', 3.77, '', 2.030899, '', '', 486.58, '', 988.19]);

  // Row 55: Material - construction waste
  sheet.addRow(['', '999-9900', 'Строительный мусор', 'м', 0.11, '', 0.059257, '', '', '', '', '']);

  // Row 56: Direct costs subtotal
  sheet.addRow(['', '', 'Итого прямые затраты', '', '', '', '', '', '', '', '', 988.19]);

  const filePath = path.join(__dirname, 'sample-resource-index.xlsx');
  await workbook.xlsx.writeFile(filePath);
  console.log(`Sample resource-index XLSX created: ${filePath}`);
}

createSample().catch(console.error);
