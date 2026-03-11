/**
 * Парсер PDF-файлов ГрандСмета
 *
 * Извлекает текст из PDF и восстанавливает структуру сметы.
 */

import fs from 'fs';
import { v4 as uuid } from 'uuid';
import type {
  Estimate,
  Section,
  SmetaItem,
  MaterialItem,
  ParseResult,
  EstimateTotals,
} from '../../models/estimate';
import { extractTableRows, type PDFTableRow } from './tableExtractor';
import * as patterns from './patterns';
import { cleanText, parseNumber, isRascenkaCode, isResourceCode, isMachineCode } from '../../utils/textClean';

export async function parsePDF(filePath: string): Promise<ParseResult> {
  const warnings: string[] = [];
  const errors: string[] = [];

  let pdfText: string;
  try {
    // Dynamic import for pdf-parse (CommonJS module)
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    pdfText = data.text;
  } catch (err: any) {
    errors.push(`Ошибка чтения PDF: ${err.message}`);
    return { estimate: createEmptyEstimate(), warnings, errors };
  }

  if (!pdfText || pdfText.trim().length === 0) {
    errors.push('PDF не содержит извлекаемого текста. Возможно, файл содержит только изображения (сканированный документ).');
    return { estimate: createEmptyEstimate(), warnings, errors };
  }

  // Извлекаем строки таблицы
  const tableRows = extractTableRows(pdfText);

  if (tableRows.length === 0) {
    errors.push('Не удалось извлечь табличные данные из PDF.');
    return { estimate: createEmptyEstimate(), warnings, errors };
  }

  // Собираем структуру
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let currentItem: SmetaItem | null = null;
  let posCounter = 0;

  // Извлекаем метаданные из первых строк
  const metadata = extractPDFMetadata(pdfText);

  for (const row of tableRows) {
    // Заголовок раздела
    const sectionMatch = row.name.match(patterns.SECTION_HEADER);
    if (sectionMatch) {
      if (currentItem && currentSection) {
        currentSection.items.push(currentItem);
        currentItem = null;
      }
      const sectionNum = parseInt(sectionMatch[1], 10);
      currentSection = {
        id: uuid(),
        number: sectionNum,
        name: cleanText(row.name),
        items: [],
        sectionTotal: { directCost: 0, laborCost: 0, machineCost: 0, materialCost: 0, total: 0 },
      };
      sections.push(currentSection);
      continue;
    }

    // Позиция сметы
    if (row.posNumber !== null && row.code && isRascenkaCode(row.code)) {
      if (currentItem && currentSection) {
        currentSection.items.push(currentItem);
      }

      if (!currentSection) {
        currentSection = {
          id: uuid(),
          number: 1,
          name: 'Основные работы',
          items: [],
          sectionTotal: { directCost: 0, laborCost: 0, machineCost: 0, materialCost: 0, total: 0 },
        };
        sections.push(currentSection);
      }

      posCounter++;
      currentItem = {
        id: uuid(),
        positionNumber: row.posNumber || posCounter,
        code: row.code,
        name: cleanText(row.name),
        unit: row.unit,
        quantity: row.quantity,
        directCostUnit: row.values[0] || 0,
        laborCostUnit: row.values[1] || 0,
        machineCostUnit: row.values[2] || 0,
        materialCostUnit: row.values[3] || 0,
        directCostTotal: row.values[4] || 0,
        laborCostTotal: row.values[5] || 0,
        machineCostTotal: row.values[6] || 0,
        materialCostTotal: row.values[7] || 0,
        laborHoursUnit: row.values[8] || 0,
        laborHoursTotal: row.values[9] || 0,
        machineLaborHoursUnit: row.values[10] || 0,
        machineLaborHoursTotal: row.values[11] || 0,
        works: [],
        materials: [],
        machines: [],
        coefficients: [],
        type: 'work',
      };
      continue;
    }

    // Ресурс (материал/механизм)
    if (row.code && isResourceCode(row.code) && currentItem) {
      if (isMachineCode(row.code)) {
        currentItem.machines.push({
          id: uuid(),
          parentItemId: currentItem.id,
          code: row.code,
          name: cleanText(row.name),
          unit: row.unit,
          quantityPerUnit: row.quantity,
          quantityTotal: 0,
          priceBase: row.values[0] || 0,
          priceTotal: row.values[1] || 0,
        });
      } else {
        currentItem.materials.push({
          id: uuid(),
          parentItemId: currentItem.id,
          code: row.code,
          name: cleanText(row.name),
          unit: row.unit,
          quantityPerUnit: row.quantity,
          quantityTotal: 0,
          priceBase: row.values[0] || 0,
          priceTotal: row.values[1] || 0,
          type: 'basic',
        });
      }
      continue;
    }

    // Продолжение наименования
    if (!row.code && row.name && currentItem && !patterns.SECTION_TOTAL.test(row.name)) {
      currentItem.name += ' ' + cleanText(row.name);
    }
  }

  // Добавляем последний item
  if (currentItem && currentSection) {
    currentSection.items.push(currentItem);
  }

  // Рассчитываем итоги
  for (const section of sections) {
    let dc = 0, lc = 0, mc = 0, matc = 0;
    for (const item of section.items) {
      dc += item.directCostTotal;
      lc += item.laborCostTotal;
      mc += item.machineCostTotal;
      matc += item.materialCostTotal;
    }
    section.sectionTotal = { directCost: dc, laborCost: lc, machineCost: mc, materialCost: matc, total: dc };
  }

  const totals = calculateTotals(sections);

  const estimate: Estimate = {
    id: uuid(),
    name: metadata.name || 'Локальный сметный расчёт (PDF)',
    number: metadata.number || '',
    object: metadata.object || '',
    customer: '',
    contractor: '',
    baseDate: '',
    currentDate: '',
    sections,
    totals,
    coefficients: [],
    overheadAndProfit: { overheadPercent: 0, overheadAmount: 0, profitPercent: 0, profitAmount: 0 },
    sourceFormat: 'pdf',
  };

  if (sections.length === 0 || sections.every(s => s.items.length === 0)) {
    warnings.push('Не удалось распознать позиции сметы. Проверьте формат PDF-файла.');
  }

  return { estimate, warnings, errors };
}

function extractPDFMetadata(text: string): { name: string; number: string; object: string } {
  const lines = text.split('\n').slice(0, 30);
  let name = '';
  let number = '';
  let object = '';

  for (const line of lines) {
    const lower = line.toLowerCase().trim();
    if (lower.includes('локальный сметный расчёт') || lower.includes('локальный сметный расчет')) {
      name = cleanText(line);
      const numMatch = line.match(/[№#]\s*(\S+)/);
      if (numMatch) number = numMatch[1];
    }
    if (lower.includes('объект') && !object) {
      const parts = line.split(/:\s*/);
      if (parts.length > 1) object = cleanText(parts.slice(1).join(': '));
    }
  }

  return { name, number, object };
}

function calculateTotals(sections: Section[]): EstimateTotals {
  let dc = 0, lc = 0, mc = 0, matc = 0;
  for (const s of sections) {
    dc += s.sectionTotal.directCost;
    lc += s.sectionTotal.laborCost;
    mc += s.sectionTotal.machineCost;
    matc += s.sectionTotal.materialCost;
  }
  return { directCost: dc, laborCost: lc, machineCost: mc, materialCost: matc, overhead: 0, profit: 0, total: dc };
}

function createEmptyEstimate(): Estimate {
  return {
    id: uuid(),
    name: '',
    number: '',
    object: '',
    customer: '',
    contractor: '',
    baseDate: '',
    currentDate: '',
    sections: [],
    totals: { directCost: 0, laborCost: 0, machineCost: 0, materialCost: 0, overhead: 0, profit: 0, total: 0 },
    coefficients: [],
    overheadAndProfit: { overheadPercent: 0, overheadAmount: 0, profitPercent: 0, profitAmount: 0 },
    sourceFormat: 'pdf',
  };
}
