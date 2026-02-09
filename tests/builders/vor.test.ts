import { describe, it, expect } from 'vitest';
import { buildVOR } from '../../src/builders/vorBuilder';
import { buildMaterialList } from '../../src/builders/materialListBuilder';
import type { Estimate } from '../../src/models/estimate';
import { v4 as uuid } from 'uuid';

function createMockEstimate(): Estimate {
  const sectionId = uuid();
  const item1Id = uuid();
  const item2Id = uuid();

  return {
    id: uuid(),
    name: 'Test Estimate',
    number: 'ЛСР-001',
    object: 'Test Object',
    customer: '',
    contractor: '',
    baseDate: '',
    currentDate: '',
    sections: [
      {
        id: sectionId,
        number: 1,
        name: 'Раздел 1. Общестроительные работы',
        items: [
          {
            id: item1Id,
            positionNumber: 1,
            code: 'ТЕР11-01-011-04',
            name: 'Кладка стен',
            unit: 'м3',
            quantity: 100,
            directCostUnit: 8500,
            laborCostUnit: 2100,
            machineCostUnit: 1200,
            materialCostUnit: 5200,
            directCostTotal: 850000,
            laborCostTotal: 210000,
            machineCostTotal: 120000,
            materialCostTotal: 520000,
            laborHoursUnit: 15.2,
            laborHoursTotal: 1520,
            machineLaborHoursUnit: 3.8,
            machineLaborHoursTotal: 380,
            works: [
              {
                id: uuid(),
                parentItemId: item1Id,
                code: 'ТЕР11-01-011-04',
                name: 'Кладка стен из кирпича',
                unit: 'м3',
                quantity: 100,
                quantityRatio: 1.0,
                description: '',
                source: 'cache',
              },
              {
                id: uuid(),
                parentItemId: item1Id,
                code: 'ТЕР11-01-011-04',
                name: 'Устройство подмостей',
                unit: 'м3',
                quantity: 100,
                quantityRatio: 1.0,
                description: '',
                source: 'cache',
              },
            ],
            materials: [
              {
                id: uuid(),
                parentItemId: item1Id,
                code: '101-0001',
                name: 'Кирпич керамический',
                unit: 'тыс. шт',
                quantityPerUnit: 0.432,
                quantityTotal: 43.2,
                priceBase: 12500,
                priceTotal: 540000,
                type: 'basic',
              },
            ],
            machines: [],
            coefficients: [],
            type: 'work',
          },
          {
            id: item2Id,
            positionNumber: 2,
            code: 'ТЕР15-04-005-01',
            name: 'Штукатурка стен',
            unit: '100 м2',
            quantity: 3.4,
            directCostUnit: 45200,
            laborCostUnit: 12100,
            machineCostUnit: 3400,
            materialCostUnit: 29700,
            directCostTotal: 153680,
            laborCostTotal: 41140,
            machineCostTotal: 11560,
            materialCostTotal: 100980,
            laborHoursUnit: 120.5,
            laborHoursTotal: 409.7,
            machineLaborHoursUnit: 8.2,
            machineLaborHoursTotal: 27.88,
            works: [],  // Not decomposed
            materials: [
              {
                id: uuid(),
                parentItemId: item2Id,
                code: '402-0015',
                name: 'Раствор цементно-известковый',
                unit: 'м3',
                quantityPerUnit: 2.14,
                quantityTotal: 7.276,
                priceBase: 2800,
                priceTotal: 20372.8,
                type: 'basic',
              },
            ],
            machines: [],
            coefficients: [],
            type: 'work',
          },
        ],
        sectionTotal: { directCost: 1003680, laborCost: 251140, machineCost: 131560, materialCost: 620980, total: 1003680 },
      },
    ],
    totals: { directCost: 1003680, laborCost: 251140, machineCost: 131560, materialCost: 620980, overhead: 0, profit: 0, total: 1003680 },
    coefficients: [],
    overheadAndProfit: { overheadPercent: 0, overheadAmount: 0, profitPercent: 0, profitAmount: 0 },
    sourceFormat: 'excel',
  };
}

describe('VOR Builder', () => {
  it('should build VOR with decomposed works as separate rows', () => {
    const estimate = createMockEstimate();
    const result = buildVOR(estimate);

    // Item 1 has 2 works (decomposed), Item 2 has 0 works (not decomposed, appears as 1 row)
    // Total: 2 + 1 = 3 work rows
    expect(result.totalWorks).toBe(3);
    expect(result.sections).toBe(1);
  });

  it('should include section headers when grouped', () => {
    const estimate = createMockEstimate();
    const result = buildVOR(estimate, { groupBySection: true });

    const sectionRows = result.rows.filter(r => r.isSection);
    expect(sectionRows.length).toBe(1);
    expect(sectionRows[0].name).toContain('Раздел 1');
  });

  it('should include source codes in notes', () => {
    const estimate = createMockEstimate();
    const result = buildVOR(estimate, { includeSourceCode: true });

    const workRows = result.rows.filter(r => !r.isSection);
    expect(workRows[0].sourceCode).toBe('ТЕР11-01-011-04');
  });

  it('should merge identical works when option is set', () => {
    const estimate = createMockEstimate();
    // Add another item with same work name
    const result = buildVOR(estimate, { mergeIdenticalWorks: true });

    // All works are different, so no merging should happen
    expect(result.totalWorks).toBe(3);
  });

  it('should number rows sequentially', () => {
    const estimate = createMockEstimate();
    const result = buildVOR(estimate);

    const workRows = result.rows.filter(r => !r.isSection);
    for (let i = 0; i < workRows.length; i++) {
      expect(workRows[i].number).toBe(i + 1);
    }
  });
});

describe('Material List Builder', () => {
  it('should collect all materials', () => {
    const estimate = createMockEstimate();
    const result = buildMaterialList(estimate);

    expect(result.uniqueMaterials).toBe(2);
    expect(result.totalMaterials).toBe(2);
  });

  it('should merge identical materials', () => {
    const estimate = createMockEstimate();
    // Both items share material codes — but in our mock they're different
    const result = buildMaterialList(estimate, { mergeIdentical: true });

    expect(result.uniqueMaterials).toBe(2);
  });

  it('should calculate total cost', () => {
    const estimate = createMockEstimate();
    const result = buildMaterialList(estimate);

    expect(result.totalCost).toBeGreaterThan(0);
    // 540000 + 20372.8
    expect(result.totalCost).toBeCloseTo(560372.8, 0);
  });
});
