/**
 * Парсер Excel-файлов ГрандСмета
 *
 * Поддерживает .xlsx и .xls форматы.
 * Извлекает структуру сметы: разделы, расценки, материалы, механизмы, итоги.
 */

import ExcelJS from 'exceljs';
import { v4 as uuid } from 'uuid';
import type {
  Estimate,
  Section,
  SmetaItem,
  MaterialItem,
  MachineItem,
  ParseResult,
  SectionTotals,
  EstimateTotals,
} from '../../models/estimate';
import { detectColumnMapping, type ColumnMapping } from './columnMapper';
import { classifyRow, type ClassifiedRow } from './rowClassifier';
import { cleanText, parseNumber } from '../../utils/textClean';

export async function parseExcel(filePath: string): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('Файл не содержит листов');
  }

  const warnings: string[] = [];
  const errors: string[] = [];

  // 1. Определяем маппинг колонок
  const mapping = detectColumnMapping(worksheet);
  if (!mapping) {
    errors.push('Не удалось определить структуру колонок. Убедитесь, что файл экспортирован из ГрандСмета.');
    return {
      estimate: createEmptyEstimate('excel'),
      warnings,
      errors,
    };
  }

  // 2. Извлекаем метаданные из заголовка (строки до таблицы)
  const metadata = extractMetadata(worksheet, mapping.headerRow);

  // 3. Классифицируем все строки
  const classifiedRows: ClassifiedRow[] = [];
  for (let rowIdx = mapping.headerRow + 1; rowIdx <= worksheet.rowCount; rowIdx++) {
    const row = worksheet.getRow(rowIdx);
    const classified = classifyRow(row, mapping, rowIdx);
    if (classified.rowType !== 'empty') {
      classifiedRows.push(classified);
    }
  }

  // 4. Собираем структуру сметы
  const sections = buildSections(classifiedRows, warnings);

  // 5. Считаем итоги
  const totals = calculateTotals(sections);

  const estimate: Estimate = {
    id: uuid(),
    name: metadata.name || 'Локальный сметный расчёт',
    number: metadata.number || '',
    object: metadata.object || '',
    customer: metadata.customer || '',
    contractor: metadata.contractor || '',
    baseDate: metadata.baseDate || '',
    currentDate: metadata.currentDate || '',
    sections,
    totals,
    coefficients: [],
    overheadAndProfit: {
      overheadPercent: 0,
      overheadAmount: 0,
      profitPercent: 0,
      profitAmount: 0,
    },
    sourceFormat: 'excel',
  };

  return { estimate, warnings, errors };
}

interface EstimateMetadata {
  name: string;
  number: string;
  object: string;
  customer: string;
  contractor: string;
  baseDate: string;
  currentDate: string;
}

function extractMetadata(worksheet: ExcelJS.Worksheet, headerRow: number): EstimateMetadata {
  const meta: EstimateMetadata = {
    name: '',
    number: '',
    object: '',
    customer: '',
    contractor: '',
    baseDate: '',
    currentDate: '',
  };

  // Сканируем строки выше таблицы
  for (let rowIdx = 1; rowIdx < headerRow; rowIdx++) {
    const row = worksheet.getRow(rowIdx);
    // Дедуплицируем текст из merged cells (одно и то же значение повторяется)
    const seenTexts = new Set<string>();
    const uniqueParts: string[] = [];
    row.eachCell((cell) => {
      if (cell.value) {
        const text = String(cell.value).trim();
        if (text && !seenTexts.has(text)) {
          seenTexts.add(text);
          uniqueParts.push(text);
        }
      }
    });
    const rowText = uniqueParts.join(' ').trim();

    if (!rowText) continue;

    const lower = rowText.toLowerCase();

    if (lower.includes('локальный сметный расчёт') || lower.includes('локальный сметный расчет') || lower.includes('лср')) {
      meta.name = cleanText(rowText);
      const numMatch = rowText.match(/[№#]\s*(\S+)/);
      if (numMatch) meta.number = numMatch[1];
    } else if (lower.includes('объект') || lower.includes('наименование стройки')) {
      const parts = rowText.split(/:\s*/);
      if (parts.length > 1) meta.object = cleanText(parts.slice(1).join(': '));
    } else if (lower.includes('заказчик')) {
      const parts = rowText.split(/:\s*/);
      if (parts.length > 1) meta.customer = cleanText(parts.slice(1).join(': '));
    } else if (lower.includes('подрядчик')) {
      const parts = rowText.split(/:\s*/);
      if (parts.length > 1) meta.contractor = cleanText(parts.slice(1).join(': '));
    } else if (lower.includes('базис') && lower.includes('цен')) {
      const dateMatch = rowText.match(/(\d{2}[./]\d{2}[./]\d{4}|\d{4}\s*г)/);
      if (dateMatch) meta.baseDate = dateMatch[1];
    }
  }

  return meta;
}

function buildSections(rows: ClassifiedRow[], warnings: string[]): Section[] {
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let currentItem: SmetaItem | null = null;
  let globalPositionCounter = 0;

  // Если нет явных разделов, создаём раздел "по умолчанию"
  const hasExplicitSections = rows.some(r => r.rowType === 'section_header');
  if (!hasExplicitSections) {
    currentSection = createSection(1, 'Основные работы');
    sections.push(currentSection);
  }

  for (const row of rows) {
    switch (row.rowType) {
      case 'section_header': {
        // Сохраняем текущий item
        if (currentItem && currentSection) {
          currentSection.items.push(currentItem);
          currentItem = null;
        }
        // Создаём новый раздел
        const sectionNum = extractSectionNum(row.name);
        currentSection = createSection(sectionNum, row.name);
        sections.push(currentSection);
        break;
      }

      case 'work_item': {
        // Сохраняем предыдущий item
        if (currentItem && currentSection) {
          currentSection.items.push(currentItem);
        }

        if (!currentSection) {
          currentSection = createSection(1, 'Основные работы');
          sections.push(currentSection);
        }

        globalPositionCounter++;
        currentItem = createSmetaItem(row, globalPositionCounter);
        break;
      }

      case 'material': {
        if (currentItem) {
          currentItem.materials.push(createMaterial(row, currentItem.id));
        }
        break;
      }

      case 'machine': {
        if (currentItem) {
          currentItem.machines.push(createMachine(row, currentItem.id));
        }
        break;
      }

      case 'continuation': {
        // Дописываем текст к текущему элементу
        if (currentItem && row.name) {
          currentItem.name += ' ' + cleanText(row.name);
        }
        break;
      }

      case 'coefficient': {
        if (currentItem) {
          const coefMatch = row.name.match(/(К|ПК)\s*=\s*([\d.,]+)/);
          if (coefMatch) {
            currentItem.coefficients.push({
              name: row.name,
              value: parseNumber(coefMatch[2]),
              type: coefMatch[1] as 'K' | 'PK',
            });
          }
        }
        break;
      }

      case 'subtotal': {
        // "Всего по позиции" — assign full total (incl. overhead+profit) to current item
        if (currentItem && row.values.totalCostTotal > 0) {
          // If directCostTotal wasn't set by "Итого прямые затраты", use this
          if (currentItem.directCostTotal === 0) {
            currentItem.directCostTotal = row.values.totalCostTotal;
          }
        }
        // Push item after its subtotal
        if (currentItem && currentSection) {
          currentSection.items.push(currentItem);
          currentItem = null;
        }
        break;
      }

      case 'total': {
        if (currentItem) {
          // Position-level total (e.g. "Итого прямые затраты" within a position)
          // Capture direct cost but don't push the item — wait for "Всего по позиции"
          if (row.values.totalCostTotal > 0 && currentItem.directCostTotal === 0) {
            currentItem.directCostTotal = row.values.totalCostTotal;
          }
        } else if (currentSection) {
          // Section-level total (no current item)
          currentSection.sectionTotal = {
            directCost: row.values.totalCostTotal,
            laborCost: row.values.totalCostLabor,
            machineCost: row.values.totalCostMachine,
            materialCost: row.values.totalCostMaterial,
            total: row.values.totalCostTotal,
          };
        }
        break;
      }

      case 'overhead':
      case 'profit': {
        // If currentItem exists, these are position-level — don't push item
        if (!currentItem && currentSection) {
          // Section-level overhead/profit — push pending item if any
          // (shouldn't normally happen since item is pushed by subtotal)
        }
        break;
      }

      default:
        break;
    }
  }

  // Добавляем последний item
  if (currentItem && currentSection) {
    currentSection.items.push(currentItem);
  }

  // Пересчитываем итоги по разделам
  for (const section of sections) {
    if (section.sectionTotal.total === 0) {
      section.sectionTotal = calculateSectionTotals(section);
    }
  }

  return sections;
}

function createSection(number: number, name: string): Section {
  return {
    id: uuid(),
    number,
    name: cleanText(name),
    items: [],
    sectionTotal: { directCost: 0, laborCost: 0, machineCost: 0, materialCost: 0, total: 0 },
  };
}

function createSmetaItem(row: ClassifiedRow, posNumber: number): SmetaItem {
  return {
    id: uuid(),
    positionNumber: row.posNumber || posNumber,
    code: row.code,
    name: cleanText(row.name),
    unit: row.unit,
    quantity: row.quantity,

    directCostUnit: row.values.unitCostTotal,
    laborCostUnit: row.values.unitCostLabor,
    machineCostUnit: row.values.unitCostMachine,
    materialCostUnit: row.values.unitCostMaterial,

    directCostTotal: row.values.totalCostTotal,
    laborCostTotal: row.values.totalCostLabor,
    machineCostTotal: row.values.totalCostMachine,
    materialCostTotal: row.values.totalCostMaterial,

    laborHoursUnit: row.values.laborHours,
    laborHoursTotal: row.quantity > 0 ? row.values.laborHours * row.quantity : row.values.laborHours,
    machineLaborHoursUnit: row.values.machineLaborHours,
    machineLaborHoursTotal: row.quantity > 0 ? row.values.machineLaborHours * row.quantity : row.values.machineLaborHours,

    works: [],
    materials: [],
    machines: [],
    coefficients: [],

    type: 'work',
  };
}

function createMaterial(row: ClassifiedRow, parentId: string): MaterialItem {
  return {
    id: uuid(),
    parentItemId: parentId,
    code: row.code,
    name: cleanText(row.name),
    unit: row.unit,
    quantityPerUnit: row.quantity,
    quantityTotal: row.values.totalCostTotal > 0 ? row.quantity : 0, // will be calculated
    priceBase: row.values.unitCostTotal,
    priceTotal: row.values.totalCostTotal,
    type: row.code ? 'basic' : 'unaccounted',
  };
}

function createMachine(row: ClassifiedRow, parentId: string): MachineItem {
  return {
    id: uuid(),
    parentItemId: parentId,
    code: row.code,
    name: cleanText(row.name),
    unit: row.unit,
    quantityPerUnit: row.quantity,
    quantityTotal: row.values.totalCostTotal > 0 ? row.quantity : 0,
    priceBase: row.values.unitCostTotal,
    priceTotal: row.values.totalCostTotal,
  };
}

function extractSectionNum(name: string): number {
  const match = name.match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

function calculateSectionTotals(section: Section): SectionTotals {
  let directCost = 0;
  let laborCost = 0;
  let machineCost = 0;
  let materialCost = 0;

  for (const item of section.items) {
    directCost += item.directCostTotal;
    laborCost += item.laborCostTotal;
    machineCost += item.machineCostTotal;
    materialCost += item.materialCostTotal;
  }

  return {
    directCost,
    laborCost,
    machineCost,
    materialCost,
    total: directCost,
  };
}

function calculateTotals(sections: Section[]): EstimateTotals {
  let directCost = 0;
  let laborCost = 0;
  let machineCost = 0;
  let materialCost = 0;

  for (const section of sections) {
    directCost += section.sectionTotal.directCost;
    laborCost += section.sectionTotal.laborCost;
    machineCost += section.sectionTotal.machineCost;
    materialCost += section.sectionTotal.materialCost;
  }

  return {
    directCost,
    laborCost,
    machineCost,
    materialCost,
    overhead: 0,
    profit: 0,
    total: directCost,
  };
}

function createEmptyEstimate(format: 'pdf' | 'excel' | 'xml' | 'gsn'): Estimate {
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
    sourceFormat: format,
  };
}
