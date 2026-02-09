// ============================================================
// Модели данных сметы (Normalized Schema)
// ============================================================

export interface Estimate {
  id: string;
  name: string;
  number: string;
  object: string;
  customer: string;
  contractor: string;
  baseDate: string;
  currentDate: string;
  sections: Section[];
  totals: EstimateTotals;
  coefficients: Coefficient[];
  overheadAndProfit: OverheadInfo;
  sourceFormat: 'pdf' | 'excel' | 'xml' | 'gsn';
  rawData?: any;
}

export interface Section {
  id: string;
  number: number;
  name: string;
  items: SmetaItem[];
  sectionTotal: SectionTotals;
}

export interface SmetaItem {
  id: string;
  positionNumber: number;
  code: string;
  name: string;
  unit: string;
  quantity: number;

  // Стоимостные показатели (на единицу)
  directCostUnit: number;
  laborCostUnit: number;
  machineCostUnit: number;
  materialCostUnit: number;

  // Стоимостные показатели (всего)
  directCostTotal: number;
  laborCostTotal: number;
  machineCostTotal: number;
  materialCostTotal: number;

  // Трудозатраты
  laborHoursUnit: number;
  laborHoursTotal: number;
  machineLaborHoursUnit: number;
  machineLaborHoursTotal: number;

  // Вложенные работы и ресурсы
  works: WorkItem[];
  materials: MaterialItem[];
  machines: MachineItem[];

  // Коэффициенты к позиции
  coefficients: PositionCoefficient[];

  type: 'work' | 'material' | 'machine' | 'transport' | 'overhead';
}

export interface WorkItem {
  id: string;
  parentItemId: string;
  code: string;
  name: string;
  unit: string;
  quantity: number;
  quantityRatio: number;
  description: string;
  source: 'parsed' | 'ai_decomposed' | 'cache' | 'manual';
}

export interface MaterialItem {
  id: string;
  parentItemId: string;
  code: string;
  name: string;
  unit: string;
  quantityPerUnit: number;
  quantityTotal: number;
  priceBase: number;
  priceTotal: number;
  type: 'basic' | 'unaccounted';
}

export interface MachineItem {
  id: string;
  parentItemId: string;
  code: string;
  name: string;
  unit: string;
  quantityPerUnit: number;
  quantityTotal: number;
  priceBase: number;
  priceTotal: number;
}

export interface EstimateTotals {
  directCost: number;
  laborCost: number;
  machineCost: number;
  materialCost: number;
  overhead: number;
  profit: number;
  total: number;
  totalWithVAT?: number;
}

export interface SectionTotals {
  directCost: number;
  laborCost: number;
  machineCost: number;
  materialCost: number;
  total: number;
}

export interface Coefficient {
  name: string;
  value: number;
  type: 'multiplier' | 'percentage';
}

export interface PositionCoefficient {
  name: string;
  value: number;
  type: 'K' | 'PK';
}

export interface OverheadInfo {
  overheadPercent: number;
  overheadAmount: number;
  profitPercent: number;
  profitAmount: number;
}

// ============================================================
// Опции генерации ВОР
// ============================================================

export interface VOROptions {
  groupBySection: boolean;
  includeSourceCode: boolean;
  mergeIdenticalWorks: boolean;
  includeQuantityFormula: boolean;
  decompositionLevel: 'full' | 'basic';
  exportFormat: 'xlsx' | 'docx';
}

export const DEFAULT_VOR_OPTIONS: VOROptions = {
  groupBySection: true,
  includeSourceCode: true,
  mergeIdenticalWorks: false,
  includeQuantityFormula: false,
  decompositionLevel: 'full',
  exportFormat: 'xlsx',
};

// ============================================================
// Опции генерации списка материалов
// ============================================================

export interface MaterialListOptions {
  groupBy: 'section' | 'type' | 'flat';
  mergeIdentical: boolean;
  showSourcePositions: boolean;
  separateUnaccounted: boolean;
  includeBasePrices: boolean;
  includeCurrentPrices: boolean;
  exportFormat: 'xlsx' | 'docx';
}

export const DEFAULT_MATERIAL_OPTIONS: MaterialListOptions = {
  groupBy: 'flat',
  mergeIdentical: true,
  showSourcePositions: true,
  separateUnaccounted: true,
  includeBasePrices: true,
  includeCurrentPrices: false,
  exportFormat: 'xlsx',
};

// ============================================================
// Строка ВОР
// ============================================================

export interface VORRow {
  number: number;
  name: string;
  unit: string;
  quantity: number;
  sourceCode: string;
  sourcePositionNumber: number;
  sectionName?: string;
  isSection?: boolean;
}

// ============================================================
// Строка списка материалов
// ============================================================

export interface MaterialListRow {
  number: number;
  name: string;
  code: string;
  unit: string;
  quantity: number;
  priceBase: number;
  totalBase: number;
  sourcePositions: number[];
  type: 'basic' | 'unaccounted';
  sectionName?: string;
  isSection?: boolean;
}

// ============================================================
// Типы строк при парсинге
// ============================================================

export type RowType =
  | 'work_item'
  | 'material'
  | 'machine'
  | 'section_header'
  | 'total'
  | 'subtotal'
  | 'coefficient'
  | 'continuation'
  | 'overhead'
  | 'profit'
  | 'empty'
  | 'header'
  | 'unknown';

// ============================================================
// Результат парсинга (промежуточный)
// ============================================================

export interface ParseResult {
  estimate: Estimate;
  warnings: string[];
  errors: string[];
}

// ============================================================
// Результат декомпозиции
// ============================================================

export interface DecompositionResult {
  totalItems: number;
  decomposed: number;
  fromCache: number;
  fromAI: number;
  fromParsed: number;
  warnings: string[];
}

// ============================================================
// In-memory хранилище (для MVP без БД)
// ============================================================

export interface StoredEstimate {
  id: string;
  estimate: Estimate;
  uploadedAt: Date;
  fileName: string;
  fileSize: number;
}
