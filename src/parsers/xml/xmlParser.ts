/**
 * Парсер XML-файлов ГрандСмета
 *
 * Обрабатывает нативный XML-формат ГрандСмета, который содержит
 * наиболее полную и структурированную информацию о смете.
 */

import fs from 'fs';
import { XMLParser } from 'fast-xml-parser';
import { v4 as uuid } from 'uuid';
import type {
  Estimate,
  Section,
  SmetaItem,
  MaterialItem,
  MachineItem,
  WorkItem,
  ParseResult,
  EstimateTotals,
} from '../../models/estimate';
import { cleanText, parseNumber } from '../../utils/textClean';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
  parseTagValue: true,
  trimValues: true,
  isArray: (name) => {
    // Элементы, которые всегда должны быть массивами
    return ['Section', 'Item', 'Resource', 'Work', 'Material', 'Machine', 'Coefficient'].includes(name);
  },
});

export async function parseXML(filePath: string): Promise<ParseResult> {
  const warnings: string[] = [];
  const errors: string[] = [];

  let xmlContent: string;
  try {
    xmlContent = fs.readFileSync(filePath, 'utf-8');
  } catch (err: any) {
    errors.push(`Ошибка чтения файла: ${err.message}`);
    return { estimate: createEmptyEstimate(), warnings, errors };
  }

  let parsed: any;
  try {
    parsed = xmlParser.parse(xmlContent);
  } catch (err: any) {
    errors.push(`Ошибка парсинга XML: ${err.message}`);
    return { estimate: createEmptyEstimate(), warnings, errors };
  }

  // Пробуем найти корневой элемент сметы (разные версии ГрандСмета)
  const root = parsed.Estimate || parsed.estimate || parsed.SmEstimate ||
               parsed.Document?.Estimate || parsed;

  const header = root.Header || root.header || root.Properties || {};
  const sectionsNode = root.Sections || root.sections || root.Body?.Sections || root.Items;

  // Извлекаем метаданные
  const name = extractField(header, ['Name', 'name', 'Title', 'title', 'EstimateName']) || 'Локальный сметный расчёт (XML)';
  const number = extractField(header, ['Number', 'number', 'Code', 'code']) || '';
  const object = extractField(header, ['Object', 'object', 'ObjectName', 'Building']) || '';
  const customer = extractField(header, ['Customer', 'customer', 'Client']) || '';
  const contractor = extractField(header, ['Contractor', 'contractor', 'Builder']) || '';

  // Парсим разделы
  const sections = parseSections(sectionsNode, warnings);

  const totals = calculateTotals(sections);

  const estimate: Estimate = {
    id: uuid(),
    name,
    number,
    object,
    customer,
    contractor,
    baseDate: extractField(header, ['BaseDate', 'baseDate', 'BasePriceDate']) || '',
    currentDate: extractField(header, ['CurrentDate', 'currentDate', 'PriceDate']) || '',
    sections,
    totals,
    coefficients: [],
    overheadAndProfit: { overheadPercent: 0, overheadAmount: 0, profitPercent: 0, profitAmount: 0 },
    sourceFormat: 'xml',
  };

  return { estimate, warnings, errors };
}

/**
 * Парсер .gsn файлов (тоже XML-based)
 */
export async function parseGSN(filePath: string): Promise<ParseResult> {
  // GSN — это XML с другой структурой, но тот же подход
  const result = await parseXML(filePath);
  if (result.estimate) {
    result.estimate.sourceFormat = 'gsn';
  }
  return result;
}

function extractField(obj: any, keys: string[]): string {
  if (!obj) return '';
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) {
      return String(obj[key]).trim();
    }
    // Check with @_ prefix (XML attribute)
    const attrKey = `@_${key}`;
    if (obj[attrKey] !== undefined && obj[attrKey] !== null) {
      return String(obj[attrKey]).trim();
    }
  }
  return '';
}

function ensureArray(val: any): any[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

function parseSections(sectionsNode: any, warnings: string[]): Section[] {
  if (!sectionsNode) return [];

  const sectionsList = ensureArray(
    sectionsNode.Section || sectionsNode.section || sectionsNode
  );

  const sections: Section[] = [];
  let sectionCounter = 0;

  for (const sNode of sectionsList) {
    sectionCounter++;
    const sectionName = extractField(sNode, ['name', 'Name', 'Title', '@_name', '@_Name']) ||
                         `Раздел ${sectionCounter}`;
    const sectionNum = parseNumber(extractField(sNode, ['number', 'Number', '@_number', '@_Number'])) || sectionCounter;

    const items = parseItems(sNode, warnings);

    let dc = 0, lc = 0, mc = 0, matc = 0;
    for (const item of items) {
      dc += item.directCostTotal;
      lc += item.laborCostTotal;
      mc += item.machineCostTotal;
      matc += item.materialCostTotal;
    }

    sections.push({
      id: uuid(),
      number: sectionNum,
      name: cleanText(sectionName),
      items,
      sectionTotal: { directCost: dc, laborCost: lc, machineCost: mc, materialCost: matc, total: dc },
    });
  }

  return sections;
}

function parseItems(sectionNode: any, warnings: string[]): SmetaItem[] {
  if (!sectionNode) return [];

  const itemsList = ensureArray(
    sectionNode.Items?.Item || sectionNode.items?.Item ||
    sectionNode.Item || sectionNode.item || []
  );

  const items: SmetaItem[] = [];
  let posCounter = 0;

  for (const iNode of itemsList) {
    posCounter++;
    const code = extractField(iNode, ['Code', 'code', '@_code', 'Basis', 'basis']) || '';
    const name = extractField(iNode, ['Name', 'name', 'Title', 'title', '#text']) || '';
    const unit = extractField(iNode, ['Unit', 'unit', 'Measure', 'measure']) || '';
    const quantity = parseNumber(extractField(iNode, ['Quantity', 'quantity', 'Volume', 'volume']));

    const materials = parseMaterials(iNode);
    const machines = parseMachines(iNode);
    const works = parseWorks(iNode);

    const item: SmetaItem = {
      id: uuid(),
      positionNumber: parseNumber(extractField(iNode, ['position', 'Position', '@_position', 'Number', 'number'])) || posCounter,
      code,
      name: cleanText(name),
      unit,
      quantity,
      directCostUnit: parseNumber(extractField(iNode, ['DirectCostUnit', 'CostUnit', 'UnitCost'])),
      laborCostUnit: parseNumber(extractField(iNode, ['LaborCostUnit', 'LaborUnit'])),
      machineCostUnit: parseNumber(extractField(iNode, ['MachineCostUnit', 'MachineUnit'])),
      materialCostUnit: parseNumber(extractField(iNode, ['MaterialCostUnit', 'MaterialUnit'])),
      directCostTotal: parseNumber(extractField(iNode, ['DirectCostTotal', 'CostTotal', 'TotalCost'])),
      laborCostTotal: parseNumber(extractField(iNode, ['LaborCostTotal', 'LaborTotal'])),
      machineCostTotal: parseNumber(extractField(iNode, ['MachineCostTotal', 'MachineTotal'])),
      materialCostTotal: parseNumber(extractField(iNode, ['MaterialCostTotal', 'MaterialTotal'])),
      laborHoursUnit: parseNumber(extractField(iNode, ['LaborHoursUnit', 'LaborHours'])),
      laborHoursTotal: parseNumber(extractField(iNode, ['LaborHoursTotal'])),
      machineLaborHoursUnit: parseNumber(extractField(iNode, ['MachineLaborHoursUnit', 'MachineHours'])),
      machineLaborHoursTotal: parseNumber(extractField(iNode, ['MachineLaborHoursTotal'])),
      works,
      materials,
      machines,
      coefficients: [],
      type: 'work',
    };

    items.push(item);
  }

  return items;
}

function parseMaterials(itemNode: any): MaterialItem[] {
  const resources = ensureArray(
    itemNode.Resources?.Resource || itemNode.resources?.Resource ||
    itemNode.Materials?.Material || itemNode.materials?.Material || []
  );

  return resources
    .filter((r: any) => {
      const type = extractField(r, ['type', 'Type', '@_type', '@_Type']);
      return type === 'material' || type === '' || !type;
    })
    .map((r: any) => ({
      id: uuid(),
      parentItemId: '',
      code: extractField(r, ['Code', 'code', '@_code']),
      name: cleanText(extractField(r, ['Name', 'name', 'Title', 'title', '#text'])),
      unit: extractField(r, ['Unit', 'unit', 'Measure']),
      quantityPerUnit: parseNumber(extractField(r, ['QuantityPerUnit', 'Consumption', 'Rate'])),
      quantityTotal: parseNumber(extractField(r, ['QuantityTotal', 'Total', 'Volume'])),
      priceBase: parseNumber(extractField(r, ['Price', 'price', 'BasePrice'])),
      priceTotal: parseNumber(extractField(r, ['PriceTotal', 'TotalPrice', 'Cost'])),
      type: 'basic' as const,
    }));
}

function parseMachines(itemNode: any): MachineItem[] {
  const resources = ensureArray(
    itemNode.Resources?.Resource || itemNode.resources?.Resource ||
    itemNode.Machines?.Machine || itemNode.machines?.Machine || []
  );

  return resources
    .filter((r: any) => {
      const type = extractField(r, ['type', 'Type', '@_type', '@_Type']);
      return type === 'machine' || type === 'mechanism';
    })
    .map((r: any) => ({
      id: uuid(),
      parentItemId: '',
      code: extractField(r, ['Code', 'code', '@_code']),
      name: cleanText(extractField(r, ['Name', 'name', 'Title', 'title', '#text'])),
      unit: extractField(r, ['Unit', 'unit', 'Measure']),
      quantityPerUnit: parseNumber(extractField(r, ['QuantityPerUnit', 'Consumption'])),
      quantityTotal: parseNumber(extractField(r, ['QuantityTotal', 'Total'])),
      priceBase: parseNumber(extractField(r, ['Price', 'price', 'BasePrice'])),
      priceTotal: parseNumber(extractField(r, ['PriceTotal', 'TotalPrice'])),
    }));
}

function parseWorks(itemNode: any): WorkItem[] {
  const works = ensureArray(
    itemNode.Works?.Work || itemNode.works?.Work || []
  );

  return works.map((w: any) => ({
    id: uuid(),
    parentItemId: '',
    code: extractField(w, ['Code', 'code', '@_code']),
    name: cleanText(typeof w === 'string' ? w : extractField(w, ['Name', 'name', 'Title', '#text'])),
    unit: extractField(w, ['Unit', 'unit']),
    quantity: parseNumber(extractField(w, ['Quantity', 'quantity'])),
    quantityRatio: parseNumber(extractField(w, ['QuantityRatio', 'Ratio'])) || 1.0,
    description: extractField(w, ['Description', 'description']),
    source: 'parsed' as const,
  }));
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
    name: '', number: '', object: '', customer: '', contractor: '',
    baseDate: '', currentDate: '',
    sections: [],
    totals: { directCost: 0, laborCost: 0, machineCost: 0, materialCost: 0, overhead: 0, profit: 0, total: 0 },
    coefficients: [],
    overheadAndProfit: { overheadPercent: 0, overheadAmount: 0, profitPercent: 0, profitAmount: 0 },
    sourceFormat: 'xml',
  };
}
