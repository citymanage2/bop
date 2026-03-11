import { describe, it, expect } from 'vitest';
import path from 'path';
import { parseExcel } from '../../src/parsers/excel/excelParser';

const FIXTURE_PATH = path.join(__dirname, '..', 'fixtures', 'sample-estimate.xlsx');

describe('Excel Parser', () => {
  it('should parse sample XLSX without errors', async () => {
    const result = await parseExcel(FIXTURE_PATH);

    expect(result.errors).toHaveLength(0);
    expect(result.estimate).toBeDefined();
    expect(result.estimate.sourceFormat).toBe('excel');
  });

  it('should extract estimate metadata', async () => {
    const result = await parseExcel(FIXTURE_PATH);
    const est = result.estimate;

    expect(est.name).toContain('ЛОКАЛЬНЫЙ СМЕТНЫЙ РАСЧЁТ');
  });

  it('should parse sections', async () => {
    const result = await parseExcel(FIXTURE_PATH);
    const sections = result.estimate.sections;

    expect(sections.length).toBeGreaterThanOrEqual(1);
    // At least one section should have items
    const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);
    expect(totalItems).toBeGreaterThanOrEqual(1);
  });

  it('should parse work items with codes', async () => {
    const result = await parseExcel(FIXTURE_PATH);
    const allItems = result.estimate.sections.flatMap(s => s.items);

    // Should find items with ТЕР codes
    const terItems = allItems.filter(i => i.code.startsWith('ТЕР'));
    expect(terItems.length).toBeGreaterThanOrEqual(1);
  });

  it('should parse quantities and costs', async () => {
    const result = await parseExcel(FIXTURE_PATH);
    const allItems = result.estimate.sections.flatMap(s => s.items);

    for (const item of allItems) {
      if (item.type === 'work') {
        expect(item.quantity).toBeGreaterThan(0);
      }
    }
  });

  it('should parse materials under items', async () => {
    const result = await parseExcel(FIXTURE_PATH);
    const allItems = result.estimate.sections.flatMap(s => s.items);

    // Find items that have materials
    const itemsWithMaterials = allItems.filter(i => i.materials.length > 0);
    expect(itemsWithMaterials.length).toBeGreaterThanOrEqual(1);
  });
});
