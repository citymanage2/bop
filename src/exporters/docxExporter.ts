/**
 * Экспорт ВОР и списка материалов в формат Word (DOCX)
 */

import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  ShadingType,
} from 'docx';
import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import type { Estimate, VORRow, MaterialListRow } from '../models/estimate';
import type { VORResult } from '../builders/vorBuilder';
import type { MaterialListResult } from '../builders/materialListBuilder';
import { config } from '../config';

const BORDER = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
} as const;

/**
 * Экспортирует ВОР в Word
 */
export async function exportVORToDocx(
  estimate: Estimate,
  vorResult: VORResult
): Promise<string> {
  const tableRows: TableRow[] = [];

  // Заголовок таблицы
  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: [
        createHeaderCell('№ п/п', 800),
        createHeaderCell('Наименование работ', 5000),
        createHeaderCell('Ед. изм.', 1200),
        createHeaderCell('Объём', 1500),
        createHeaderCell('Примечание', 2000),
      ],
    })
  );

  // Данные
  for (const row of vorResult.rows) {
    if (row.isSection) {
      tableRows.push(
        new TableRow({
          children: [
            createSectionCell(row.name, 5),
          ],
        })
      );
    } else {
      tableRows.push(
        new TableRow({
          children: [
            createDataCell(String(row.number), AlignmentType.CENTER),
            createDataCell(row.name, AlignmentType.LEFT),
            createDataCell(row.unit, AlignmentType.CENTER),
            createDataCell(formatNum(row.quantity), AlignmentType.RIGHT),
            createDataCell(row.sourceCode, AlignmentType.LEFT),
          ],
        })
      );
    }
  }

  const table = new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 16838, height: 11906, orientation: 'landscape' as any },
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({ text: 'ВЕДОМОСТЬ ОБЪЁМОВ РАБОТ', bold: true, size: 28 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({ text: estimate.name || 'Локальный сметный расчёт', size: 22 }),
            ],
          }),
          ...(estimate.object ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
              children: [
                new TextRun({ text: `Объект: ${estimate.object}`, size: 20, italics: true }),
              ],
            }),
          ] : []),
          table,
          new Paragraph({
            spacing: { before: 200 },
            children: [
              new TextRun({ text: `Итого видов работ: ${vorResult.totalWorks}`, bold: true, size: 20 }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const fileName = `vor_${uuid().substring(0, 8)}.docx`;
  const filePath = path.join(config.uploadDir, fileName);
  fs.writeFileSync(filePath, buffer);

  return fileName;
}

/**
 * Экспортирует список материалов в Word
 */
export async function exportMaterialsToDocx(
  estimate: Estimate,
  materialsResult: MaterialListResult
): Promise<string> {
  const tableRows: TableRow[] = [];

  // Заголовок
  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: [
        createHeaderCell('№', 600),
        createHeaderCell('Наименование', 4000),
        createHeaderCell('Код', 1200),
        createHeaderCell('Ед.', 800),
        createHeaderCell('Кол-во', 1200),
        createHeaderCell('Цена', 1200),
        createHeaderCell('Стоимость', 1500),
      ],
    })
  );

  for (const row of materialsResult.rows) {
    if (row.isSection) {
      tableRows.push(
        new TableRow({
          children: [createSectionCell(row.name, 7)],
        })
      );
    } else {
      tableRows.push(
        new TableRow({
          children: [
            createDataCell(String(row.number), AlignmentType.CENTER),
            createDataCell(row.name, AlignmentType.LEFT),
            createDataCell(row.code, AlignmentType.LEFT),
            createDataCell(row.unit, AlignmentType.CENTER),
            createDataCell(formatNum(row.quantity), AlignmentType.RIGHT),
            createDataCell(formatNum(row.priceBase), AlignmentType.RIGHT),
            createDataCell(formatNum(row.totalBase), AlignmentType.RIGHT),
          ],
        })
      );
    }
  }

  const table = new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 16838, height: 11906, orientation: 'landscape' as any },
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({ text: 'СПИСОК МАТЕРИАЛОВ', bold: true, size: 28 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({ text: estimate.name || 'Локальный сметный расчёт', size: 22 }),
            ],
          }),
          table,
          new Paragraph({
            spacing: { before: 200 },
            children: [
              new TextRun({ text: `Всего материалов: ${materialsResult.uniqueMaterials}`, bold: true, size: 20 }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const fileName = `materials_${uuid().substring(0, 8)}.docx`;
  const filePath = path.join(config.uploadDir, fileName);
  fs.writeFileSync(filePath, buffer);

  return fileName;
}

function createHeaderCell(text: string, width: number): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: BORDER,
    shading: { type: ShadingType.SOLID, fill: 'D9E1F2', color: 'D9E1F2' },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, size: 18 })],
      }),
    ],
  });
}

function createDataCell(text: string, alignment: (typeof AlignmentType)[keyof typeof AlignmentType]): TableCell {
  return new TableCell({
    borders: BORDER,
    children: [
      new Paragraph({
        alignment,
        children: [new TextRun({ text, size: 18 })],
      }),
    ],
  });
}

function createSectionCell(text: string, colspan: number): TableCell {
  return new TableCell({
    columnSpan: colspan,
    borders: BORDER,
    shading: { type: ShadingType.SOLID, fill: 'E2EFDA', color: 'E2EFDA' },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 18 })],
      }),
    ],
  });
}

function formatNum(n: number): string {
  if (n === 0) return '';
  return n.toFixed(2).replace(/\.?0+$/, '');
}
