import { describe, it, expect } from 'vitest';
import path from 'path';
import { parseXML } from '../../src/parsers/xml/xmlParser';

const FIXTURE_PATH = path.join(__dirname, '..', 'fixtures', 'sample-estimate.xml');

describe('XML Parser', () => {
  it('should parse sample XML without errors', async () => {
    const result = await parseXML(FIXTURE_PATH);

    expect(result.errors).toHaveLength(0);
    expect(result.estimate).toBeDefined();
    expect(result.estimate.sourceFormat).toBe('xml');
  });

  it('should extract metadata', async () => {
    const result = await parseXML(FIXTURE_PATH);
    const est = result.estimate;

    expect(est.name).toContain('Локальный сметный расчёт');
    expect(est.object).toContain('Капитальный ремонт');
    expect(est.customer).toBe('ООО "Альфа"');
  });

  it('should parse sections', async () => {
    const result = await parseXML(FIXTURE_PATH);

    expect(result.estimate.sections.length).toBe(2);
    expect(result.estimate.sections[0].name).toContain('Демонтажные');
    expect(result.estimate.sections[1].name).toContain('Отделочные');
  });

  it('should parse items with costs', async () => {
    const result = await parseXML(FIXTURE_PATH);
    const allItems = result.estimate.sections.flatMap(s => s.items);

    expect(allItems.length).toBe(4);

    const item1 = allItems[0];
    expect(item1.code).toBe('ТЕР46-03-001-01');
    expect(item1.quantity).toBe(4.5);
    expect(item1.directCostTotal).toBe(14400);
  });

  it('should parse materials from resources', async () => {
    const result = await parseXML(FIXTURE_PATH);
    const item3 = result.estimate.sections[1].items[0]; // Штукатурка

    expect(item3.materials.length).toBeGreaterThanOrEqual(1);
    expect(item3.materials[0].name).toContain('Раствор');
  });

  it('should parse works from XML', async () => {
    const result = await parseXML(FIXTURE_PATH);
    const item3 = result.estimate.sections[1].items[0]; // Штукатурка

    expect(item3.works.length).toBe(3);
    expect(item3.works[0].name).toContain('Подготовка');
    expect(item3.works[1].name).toContain('Нанесение');
    expect(item3.works[2].name).toContain('Затирка');
  });
});
