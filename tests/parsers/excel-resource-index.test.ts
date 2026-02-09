import { describe, it, expect } from 'vitest';
import path from 'path';
import { parseExcel } from '../../src/parsers/excel/excelParser';

const FIXTURE_PATH = path.join(__dirname, '..', 'fixtures', 'sample-resource-index.xlsx');

describe('Excel Parser — Resource-Index Format (12 columns)', () => {
  it('should parse resource-index XLSX without errors', async () => {
    const result = await parseExcel(FIXTURE_PATH);

    expect(result.errors).toHaveLength(0);
    expect(result.estimate).toBeDefined();
    expect(result.estimate.sourceFormat).toBe('excel');
  });

  it('should extract estimate metadata', async () => {
    const result = await parseExcel(FIXTURE_PATH);
    const est = result.estimate;

    expect(est.name).toContain('ЛОКАЛЬНЫЙ СМЕТНЫЙ РАСЧЕТ');
  });

  it('should parse sections', async () => {
    const result = await parseExcel(FIXTURE_PATH);
    const sections = result.estimate.sections;

    expect(sections.length).toBeGreaterThanOrEqual(1);
    expect(sections[0].name).toContain('Демонтажные работы');
  });

  it('should find work items with ГЭСНр codes', async () => {
    const result = await parseExcel(FIXTURE_PATH);
    const allItems = result.estimate.sections.flatMap(s => s.items);

    expect(allItems.length).toBeGreaterThanOrEqual(2);

    const item1 = allItems.find(i => i.code === 'ГЭСНр57-01-003-02');
    expect(item1).toBeDefined();
    expect(item1!.name).toContain('Разборка плинтусов');
    expect(item1!.unit).toBe('100 м');
    expect(item1!.quantity).toBeCloseTo(7.3963, 3);

    const item2 = allItems.find(i => i.code === 'ГЭСНр57-01-003-01');
    expect(item2).toBeDefined();
    expect(item2!.quantity).toBeCloseTo(0.5387, 3);
  });

  it('should parse materials under work items', async () => {
    const result = await parseExcel(FIXTURE_PATH);
    const allItems = result.estimate.sections.flatMap(s => s.items);

    const item1 = allItems.find(i => i.code === 'ГЭСНр57-01-003-02');
    expect(item1).toBeDefined();

    // Should have material 999-9900 (Строительный мусор)
    const material = item1!.materials.find(m => m.code === '999-9900');
    expect(material).toBeDefined();
    expect(material!.name).toContain('Строительный мусор');
  });

  it('should not count overhead/profit/total rows as items', async () => {
    const result = await parseExcel(FIXTURE_PATH);
    const allItems = result.estimate.sections.flatMap(s => s.items);

    // No items should have codes like "Пр/..." or names like "Итого" / "ФОТ"
    for (const item of allItems) {
      expect(item.code).not.toMatch(/^Пр\//);
      expect(item.name).not.toMatch(/^Итого/i);
      expect(item.name).not.toMatch(/^ФОТ$/i);
      expect(item.name).not.toMatch(/^Всего по позиции/i);
    }
  });
});
