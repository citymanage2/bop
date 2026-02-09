import { describe, it, expect } from 'vitest';
import { decomposeFromCache } from '../../src/decomposer/cacheDecomposer';
import type { SmetaItem } from '../../src/models/estimate';

function createMockItem(code: string, name: string, quantity: number = 100): SmetaItem {
  return {
    id: 'test-id',
    positionNumber: 1,
    code,
    name,
    unit: 'м3',
    quantity,
    directCostUnit: 0,
    laborCostUnit: 0,
    machineCostUnit: 0,
    materialCostUnit: 0,
    directCostTotal: 0,
    laborCostTotal: 0,
    machineCostTotal: 0,
    materialCostTotal: 0,
    laborHoursUnit: 0,
    laborHoursTotal: 0,
    machineLaborHoursUnit: 0,
    machineLaborHoursTotal: 0,
    works: [],
    materials: [],
    machines: [],
    coefficients: [],
    type: 'work',
  };
}

describe('Cache Decomposer', () => {
  it('should find decomposition for known code ТЕР11-01-011-04', () => {
    const item = createMockItem('ТЕР11-01-011-04', 'Кладка стен', 125.5);
    const result = decomposeFromCache(item);

    expect(result).not.toBeNull();
    expect(result!.length).toBe(3);
    expect(result![0].name).toContain('Кладка');
    expect(result![1].name).toContain('подмост');
    expect(result![2].name).toContain('Подача');
  });

  it('should calculate correct quantities based on ratios', () => {
    const item = createMockItem('ТЕР11-01-011-04', 'Кладка стен', 125.5);
    const result = decomposeFromCache(item)!;

    // All works have quantityRatio of 1.0
    for (const work of result) {
      expect(work.quantity).toBe(125.5);
    }
  });

  it('should find decomposition for ТЕР15-02-016-01 (tiles)', () => {
    const item = createMockItem('ТЕР15-02-016-01', 'Устройство покрытий из плиток', 3.4);
    const result = decomposeFromCache(item);

    expect(result).not.toBeNull();
    expect(result!.length).toBe(4);
  });

  it('should return null for unknown code', () => {
    const item = createMockItem('ТЕР99-99-999-99', 'Неизвестная расценка');
    const result = decomposeFromCache(item);

    expect(result).toBeNull();
  });

  it('should set correct source for cached results', () => {
    const item = createMockItem('ТЕР11-01-011-04', 'Кладка стен', 100);
    const result = decomposeFromCache(item)!;

    for (const work of result) {
      expect(work.source).toBe('cache');
      expect(work.parentItemId).toBe('test-id');
    }
  });
});
