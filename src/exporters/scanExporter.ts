/**
 * Экспорт распознанного скана сметы в Excel (XLSX)
 *
 * Создаёт отформатированный файл с:
 * - шапкой (наименование, номер, объект, даты)
 * - таблицей позиций с разделами
 * - итоговыми строками
 * - формулами автосуммы
 */

import ExcelJS from 'exceljs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { config } from '../config';
import type { ScanParseResult } from '../parsers/scan/scanParser';

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};

const SECTION_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE2EFDA' },
};

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFD9E1F2' },
};

const TOTAL_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFFF2CC' },
};

const UNREADABLE_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFFC7CE' },
};

/**
 * Экспортирует результат распознавания скана в Excel
 */
export async function exportScanToXlsx(result: ScanParseResult): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Сметный парсер — Сити Менедж';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Смета', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
    },
  });

  // ============================================================
  // Шапка документа
  // ============================================================
  let currentRow = 1;

  // Заголовок
  sheet.mergeCells(`A${currentRow}:G${currentRow}`);
  const titleCell = sheet.getCell(`A${currentRow}`);
  titleCell.value = result.meta.estimateName || 'ЛОКАЛЬНЫЙ СМЕТНЫЙ РАСЧЁТ';
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'center' };
  currentRow++;

  // Номер сметы и тип
  if (result.meta.estimateNumber || result.meta.estimateType) {
    sheet.mergeCells(`A${currentRow}:G${currentRow}`);
    const parts = [
      result.meta.estimateNumber ? `№ ${result.meta.estimateNumber}` : '',
      result.meta.estimateType ? `(${result.meta.estimateType})` : '',
    ].filter(Boolean);
    sheet.getCell(`A${currentRow}`).value = parts.join(' ');
    sheet.getCell(`A${currentRow}`).font = { size: 11 };
    sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
    currentRow++;
  }

  // Объект
  if (result.meta.objectName) {
    sheet.mergeCells(`A${currentRow}:G${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = `Объект: ${result.meta.objectName}`;
    sheet.getCell(`A${currentRow}`).font = { size: 10, italic: true };
    currentRow++;
  }

  // Заказчик / подрядчик
  if (result.meta.customer) {
    sheet.mergeCells(`A${currentRow}:G${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = `Заказчик: ${result.meta.customer}`;
    sheet.getCell(`A${currentRow}`).font = { size: 10 };
    currentRow++;
  }
  if (result.meta.contractor) {
    sheet.mergeCells(`A${currentRow}:G${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = `Подрядчик: ${result.meta.contractor}`;
    sheet.getCell(`A${currentRow}`).font = { size: 10 };
    currentRow++;
  }

  // Даты и нормативная база
  const dateParts = [
    result.meta.baseDate ? `Базисная дата: ${result.meta.baseDate}` : '',
    result.meta.currentDate ? `Текущая дата: ${result.meta.currentDate}` : '',
    result.meta.normBase ? `Нормативная база: ${result.meta.normBase}` : '',
  ].filter(Boolean);
  if (dateParts.length > 0) {
    sheet.mergeCells(`A${currentRow}:G${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = dateParts.join('  |  ');
    sheet.getCell(`A${currentRow}`).font = { size: 9, color: { argb: 'FF666666' } };
    currentRow++;
  }

  currentRow++; // Пустая строка

  // ============================================================
  // Заголовки таблицы
  // ============================================================
  const headerRow = currentRow;
  const headers = ['№ п/п', 'Шифр / код', 'Наименование работ и затрат', 'Ед. изм.', 'Кол-во', 'Цена за ед.', 'Сумма'];
  const widths = [8, 18, 55, 10, 12, 15, 18];

  headers.forEach((header, idx) => {
    const cell = sheet.getCell(headerRow, idx + 1);
    cell.value = header;
    cell.font = { bold: true, size: 10 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = THIN_BORDER;
    cell.fill = HEADER_FILL;
    sheet.getColumn(idx + 1).width = widths[idx];
  });
  currentRow++;

  // ============================================================
  // Данные (позиции)
  // ============================================================
  const dataCells: { row: number; col: number }[] = []; // для формулы автосуммы

  for (const row of result.rows) {
    if (row.isSection) {
      // Заголовок раздела
      sheet.mergeCells(`A${currentRow}:G${currentRow}`);
      const cell = sheet.getCell(`A${currentRow}`);
      cell.value = row.name || row.section;
      cell.font = { bold: true, size: 10 };
      cell.fill = SECTION_FILL;
      cell.border = THIN_BORDER;
    } else if (row.isTotal) {
      // Итоговая строка
      sheet.mergeCells(`A${currentRow}:F${currentRow}`);
      const nameCell = sheet.getCell(`A${currentRow}`);
      nameCell.value = row.name;
      nameCell.font = { bold: true, size: 10 };
      nameCell.alignment = { horizontal: 'right' };
      nameCell.border = THIN_BORDER;
      nameCell.fill = TOTAL_FILL;

      const totalCell = sheet.getCell(currentRow, 7);
      totalCell.value = parseNumericValue(row.total);
      totalCell.font = { bold: true, size: 10 };
      totalCell.numFmt = '#,##0.00';
      totalCell.alignment = { horizontal: 'right' };
      totalCell.border = THIN_BORDER;
      totalCell.fill = TOTAL_FILL;
    } else {
      // Обычная позиция
      const cells = [
        row.posNumber,
        row.code,
        row.name,
        row.unit,
        parseNumericValue(row.quantity),
        parseNumericValue(row.unitPrice),
        parseNumericValue(row.total),
      ];

      cells.forEach((val, idx) => {
        const cell = sheet.getCell(currentRow, idx + 1);
        cell.value = val;
        cell.font = { size: 10 };
        cell.border = THIN_BORDER;

        if (idx === 0) {
          cell.alignment = { horizontal: 'center' };
        } else if (idx === 2) {
          cell.alignment = { wrapText: true };
        } else if (idx >= 4) {
          cell.alignment = { horizontal: 'right' };
          if (typeof val === 'number') {
            cell.numFmt = '#,##0.00';
          }
        }

        // Подсветка нечитаемых строк
        if (row.isUnreadable) {
          cell.fill = UNREADABLE_FILL;
        }
      });

      // Запоминаем ячейку "Сумма" для автосуммы
      if (!row.isTotal && !row.isSection) {
        dataCells.push({ row: currentRow, col: 7 });
      }
    }
    currentRow++;
  }

  // ============================================================
  // Итоги сметы
  // ============================================================
  currentRow++; // пустая строка

  // Промежуточные итоги
  for (const sub of result.totals.subtotals) {
    sheet.mergeCells(`A${currentRow}:F${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = sub.name;
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 10 };
    sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'right' };
    sheet.getCell(currentRow, 7).value = parseNumericValue(sub.value);
    sheet.getCell(currentRow, 7).font = { bold: true, size: 10 };
    sheet.getCell(currentRow, 7).numFmt = '#,##0.00';
    currentRow++;
  }

  // Накладные расходы
  if (result.totals.overhead) {
    sheet.mergeCells(`A${currentRow}:F${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = 'Накладные расходы';
    sheet.getCell(`A${currentRow}`).font = { size: 10 };
    sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'right' };
    sheet.getCell(currentRow, 7).value = parseNumericValue(result.totals.overhead);
    sheet.getCell(currentRow, 7).numFmt = '#,##0.00';
    currentRow++;
  }

  // Сметная прибыль
  if (result.totals.profit) {
    sheet.mergeCells(`A${currentRow}:F${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = 'Сметная прибыль';
    sheet.getCell(`A${currentRow}`).font = { size: 10 };
    sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'right' };
    sheet.getCell(currentRow, 7).value = parseNumericValue(result.totals.profit);
    sheet.getCell(currentRow, 7).numFmt = '#,##0.00';
    currentRow++;
  }

  // Общий итог
  if (result.totals.total) {
    currentRow++;
    sheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const labelCell = sheet.getCell(`A${currentRow}`);
    labelCell.value = 'ИТОГО ПО СМЕТЕ:';
    labelCell.font = { bold: true, size: 11 };
    labelCell.alignment = { horizontal: 'right' };

    const totalCell = sheet.getCell(currentRow, 7);
    totalCell.value = parseNumericValue(result.totals.total);
    totalCell.font = { bold: true, size: 11 };
    totalCell.numFmt = '#,##0.00';
    currentRow++;
  }

  // НДС
  if (result.totals.vat) {
    sheet.mergeCells(`A${currentRow}:F${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = 'НДС';
    sheet.getCell(`A${currentRow}`).font = { size: 10 };
    sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'right' };
    sheet.getCell(currentRow, 7).value = parseNumericValue(result.totals.vat);
    sheet.getCell(currentRow, 7).numFmt = '#,##0.00';
    currentRow++;
  }

  // Всего с НДС
  if (result.totals.totalWithVat) {
    sheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const labelCell = sheet.getCell(`A${currentRow}`);
    labelCell.value = 'ВСЕГО С НДС:';
    labelCell.font = { bold: true, size: 11 };
    labelCell.alignment = { horizontal: 'right' };

    const totalCell = sheet.getCell(currentRow, 7);
    totalCell.value = parseNumericValue(result.totals.totalWithVat);
    totalCell.font = { bold: true, size: 11 };
    totalCell.numFmt = '#,##0.00';
    currentRow++;
  }

  // ============================================================
  // Примечания
  // ============================================================
  if (result.warnings.length > 0) {
    currentRow += 2;
    sheet.getCell(`A${currentRow}`).value = 'Примечания:';
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 9, color: { argb: 'FFCC0000' } };
    currentRow++;
    for (const w of result.warnings) {
      sheet.mergeCells(`A${currentRow}:G${currentRow}`);
      sheet.getCell(`A${currentRow}`).value = `• ${w}`;
      sheet.getCell(`A${currentRow}`).font = { size: 9, color: { argb: 'FFCC0000' } };
      currentRow++;
    }
  }

  // Штамп
  currentRow += 2;
  sheet.mergeCells(`A${currentRow}:G${currentRow}`);
  sheet.getCell(`A${currentRow}`).value =
    `Распознано из скана сервисом «Сметный парсер» (Сити Менедж) ${new Date().toLocaleString('ru-RU')}`;
  sheet.getCell(`A${currentRow}`).font = { size: 8, italic: true, color: { argb: 'FF999999' } };

  // ============================================================
  // Сохранение
  // ============================================================
  const fileName = `scan_${uuid().substring(0, 8)}.xlsx`;
  const filePath = path.join(config.uploadDir, fileName);
  await workbook.xlsx.writeFile(filePath);

  return fileName;
}

// ============================================================
// Утилиты
// ============================================================

/**
 * Парсит строковое числовое значение из скана
 * Поддерживает пробелы как разделители тысяч и запятую как десятичный
 */
function parseNumericValue(value: string): number | string {
  if (!value || value === '[нечитаемо]') return '';

  // Удаляем пробелы (разделители тысяч) и заменяем запятую на точку
  const cleaned = value
    .replace(/\s/g, '')
    .replace(',', '.');

  const num = parseFloat(cleaned);
  if (!isNaN(num)) return num;

  // Если не удалось — возвращаем как строку
  return value;
}
