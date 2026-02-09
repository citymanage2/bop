/**
 * Экспорт ВОР и списка материалов в формат Excel (XLSX)
 */

import ExcelJS from 'exceljs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import type { VORRow, MaterialListRow, Estimate } from '../models/estimate';
import type { VORResult } from '../builders/vorBuilder';
import type { MaterialListResult } from '../builders/materialListBuilder';
import { config } from '../config';

/**
 * Экспортирует ВОР в Excel
 */
export async function exportVORToXlsx(
  estimate: Estimate,
  vorResult: VORResult
): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Сметный парсер';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('ВОР', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
    },
  });

  // Заголовок документа
  sheet.mergeCells('A1:E1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'ВЕДОМОСТЬ ОБЪЁМОВ РАБОТ';
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'center' };

  // Информация о смете
  sheet.mergeCells('A2:E2');
  sheet.getCell('A2').value = estimate.name || 'Локальный сметный расчёт';
  sheet.getCell('A2').font = { size: 11 };
  sheet.getCell('A2').alignment = { horizontal: 'center' };

  if (estimate.object) {
    sheet.mergeCells('A3:E3');
    sheet.getCell('A3').value = `Объект: ${estimate.object}`;
    sheet.getCell('A3').font = { size: 10, italic: true };
  }

  // Заголовки таблицы
  const headerRow = 5;
  const headers = ['№ п/п', 'Наименование работ', 'Ед. изм.', 'Объём', 'Примечание'];
  const widths = [8, 60, 12, 15, 25];

  headers.forEach((header, idx) => {
    const cell = sheet.getCell(headerRow, idx + 1);
    cell.value = header;
    cell.font = { bold: true, size: 10 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' },
    };
    sheet.getColumn(idx + 1).width = widths[idx];
  });

  // Данные
  let currentRow = headerRow + 1;

  for (const row of vorResult.rows) {
    if (row.isSection) {
      // Заголовок раздела
      sheet.mergeCells(`A${currentRow}:E${currentRow}`);
      const cell = sheet.getCell(`A${currentRow}`);
      cell.value = row.name;
      cell.font = { bold: true, size: 10 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2EFDA' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    } else {
      const cells = [row.number, row.name, row.unit, row.quantity, row.sourceCode];
      cells.forEach((val, idx) => {
        const cell = sheet.getCell(currentRow, idx + 1);
        cell.value = val;
        cell.font = { size: 10 };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };

        if (idx === 0) {
          cell.alignment = { horizontal: 'center' };
        } else if (idx === 1) {
          cell.alignment = { wrapText: true };
        } else if (idx === 3) {
          cell.alignment = { horizontal: 'right' };
          cell.numFmt = '#,##0.00';
        }
      });
    }
    currentRow++;
  }

  // Итого
  currentRow++;
  sheet.mergeCells(`A${currentRow}:C${currentRow}`);
  sheet.getCell(`A${currentRow}`).value = `Итого видов работ: ${vorResult.totalWorks}`;
  sheet.getCell(`A${currentRow}`).font = { bold: true, size: 10 };

  // Сохраняем
  const fileName = `vor_${uuid().substring(0, 8)}.xlsx`;
  const filePath = path.join(config.uploadDir, fileName);
  await workbook.xlsx.writeFile(filePath);

  return fileName;
}

/**
 * Экспортирует список материалов в Excel
 */
export async function exportMaterialsToXlsx(
  estimate: Estimate,
  materialsResult: MaterialListResult
): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Сметный парсер';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Материалы', {
    pageSetup: {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
    },
  });

  // Заголовок
  sheet.mergeCells('A1:G1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'СПИСОК МАТЕРИАЛОВ';
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'center' };

  sheet.mergeCells('A2:G2');
  sheet.getCell('A2').value = estimate.name || 'Локальный сметный расчёт';
  sheet.getCell('A2').font = { size: 11 };
  sheet.getCell('A2').alignment = { horizontal: 'center' };

  // Заголовки таблицы
  const headerRow = 4;
  const headers = ['№ п/п', 'Наименование материала', 'Код ресурса', 'Ед. изм.', 'Кол-во', 'Цена (базис)', 'Стоимость (базис)'];
  const widths = [8, 50, 15, 10, 12, 15, 18];

  headers.forEach((header, idx) => {
    const cell = sheet.getCell(headerRow, idx + 1);
    cell.value = header;
    cell.font = { bold: true, size: 10 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' },
    };
    sheet.getColumn(idx + 1).width = widths[idx];
  });

  // Данные
  let currentRow = headerRow + 1;

  for (const row of materialsResult.rows) {
    if (row.isSection) {
      sheet.mergeCells(`A${currentRow}:G${currentRow}`);
      const cell = sheet.getCell(`A${currentRow}`);
      cell.value = row.name;
      cell.font = { bold: true, size: 10 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2EFDA' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    } else {
      const cells = [
        row.number,
        row.name,
        row.code,
        row.unit,
        row.quantity,
        row.priceBase,
        row.totalBase,
      ];

      cells.forEach((val, idx) => {
        const cell = sheet.getCell(currentRow, idx + 1);
        cell.value = val;
        cell.font = { size: 10 };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };

        if (idx === 0) {
          cell.alignment = { horizontal: 'center' };
        } else if (idx === 1) {
          cell.alignment = { wrapText: true };
        } else if (idx >= 4) {
          cell.alignment = { horizontal: 'right' };
          cell.numFmt = '#,##0.00';
        }
      });

      // Подсветка неучтённых материалов
      if (row.type === 'unaccounted') {
        for (let col = 1; col <= 7; col++) {
          sheet.getCell(currentRow, col).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFF2CC' },
          };
        }
      }
    }
    currentRow++;
  }

  // Итого
  currentRow++;
  sheet.mergeCells(`A${currentRow}:F${currentRow}`);
  sheet.getCell(`A${currentRow}`).value = 'ИТОГО:';
  sheet.getCell(`A${currentRow}`).font = { bold: true, size: 10 };
  sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'right' };
  sheet.getCell(currentRow, 7).value = materialsResult.totalCost;
  sheet.getCell(currentRow, 7).font = { bold: true, size: 10 };
  sheet.getCell(currentRow, 7).numFmt = '#,##0.00';

  currentRow += 2;
  sheet.getCell(`A${currentRow}`).value = `Всего материалов: ${materialsResult.uniqueMaterials}`;
  sheet.getCell(`A${currentRow}`).font = { size: 9, italic: true };
  if (materialsResult.unaccountedMaterials > 0) {
    currentRow++;
    sheet.getCell(`A${currentRow}`).value = `В т.ч. неучтённых: ${materialsResult.unaccountedMaterials}`;
    sheet.getCell(`A${currentRow}`).font = { size: 9, italic: true };
  }

  // Сохраняем
  const fileName = `materials_${uuid().substring(0, 8)}.xlsx`;
  const filePath = path.join(config.uploadDir, fileName);
  await workbook.xlsx.writeFile(filePath);

  return fileName;
}
