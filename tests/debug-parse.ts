/**
 * Debug script: parse a real XLSX file and dump results
 * Run: npx tsx tests/debug-parse.ts
 */
import { parseExcel } from '../src/parsers/excel/excelParser';
import { detectColumnMapping } from '../src/parsers/excel/columnMapper';
import { buildVOR } from '../src/builders/vorBuilder';
import { buildMaterialList } from '../src/builders/materialListBuilder';
import { exportVORToXlsx, exportMaterialsToXlsx } from '../src/exporters/xlsxExporter';
import ExcelJS from 'exceljs';

const FILE = process.argv[2] || './НОВЫЕ_Раздел_ПД№12_подраздел_1_ЛСР.xlsx';

async function debugParse() {
  console.log(`\n=== Parsing: ${FILE} ===\n`);

  // Step 1: Raw column detection
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(FILE);
  const ws = workbook.worksheets[0];
  console.log(`Worksheet: "${ws.name}", rows: ${ws.rowCount}, cols: ${ws.columnCount}`);

  const mapping = detectColumnMapping(ws);
  if (!mapping) {
    console.error('ERROR: Column mapping not detected!');

    // Dump first 50 rows to understand structure
    console.log('\n--- First 50 rows dump ---');
    for (let r = 1; r <= Math.min(50, ws.rowCount); r++) {
      const row = ws.getRow(r);
      const cells: string[] = [];
      row.eachCell({ includeEmpty: false }, (cell, col) => {
        const val = cell.value;
        const text = typeof val === 'object' && val !== null && 'richText' in val
          ? (val as any).richText.map((rt: any) => rt.text).join('')
          : String(val ?? '');
        if (text.trim()) cells.push(`[${col}]="${text.trim().substring(0, 40)}"`);
      });
      if (cells.length > 0) console.log(`  Row ${r}: ${cells.join(' | ')}`);
    }
    return;
  }

  console.log(`Column mapping detected:`);
  console.log(`  Format: ${mapping.format}`);
  console.log(`  Header row: ${mapping.headerRow}`);
  console.log(`  posNumber=${mapping.posNumber}, code=${mapping.code}, name=${mapping.name}`);
  console.log(`  unit=${mapping.unit}, quantity=${mapping.quantity}, quantityTotal=${mapping.quantityTotal}`);
  console.log(`  unitCostTotal=${mapping.unitCostTotal}, totalCostTotal=${mapping.totalCostTotal}`);

  // Step 2: Parse
  const result = await parseExcel(FILE);
  console.log(`\n--- Parse result ---`);
  console.log(`  Errors: ${result.errors.length}`);
  result.errors.forEach(e => console.log(`    - ${e}`));
  console.log(`  Warnings: ${result.warnings.length}`);
  result.warnings.forEach(w => console.log(`    - ${w}`));

  const est = result.estimate;
  console.log(`\n  Estimate: "${est.name}"`);
  console.log(`  Number: "${est.number}"`);
  console.log(`  Object: "${est.object}"`);
  console.log(`  Sections: ${est.sections.length}`);

  let totalItems = 0;
  let totalMaterials = 0;
  let totalMachines = 0;

  for (const section of est.sections) {
    console.log(`\n  Section ${section.number}: "${section.name}" (${section.items.length} items)`);
    for (const item of section.items) {
      totalItems++;
      totalMaterials += item.materials.length;
      totalMachines += item.machines.length;
      console.log(`    #${item.positionNumber} [${item.code}] "${item.name.substring(0, 60)}" | ${item.unit} | qty=${item.quantity} | total=${item.directCostTotal}`);
      for (const mat of item.materials) {
        console.log(`      MAT [${mat.code}] "${mat.name.substring(0, 50)}" | ${mat.unit} | qty=${mat.quantityPerUnit}`);
      }
      for (const mac of item.machines) {
        console.log(`      MACH [${mac.code}] "${mac.name.substring(0, 50)}" | ${mac.unit} | qty=${mac.quantityPerUnit}`);
      }
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`  Total items: ${totalItems}`);
  console.log(`  Total materials: ${totalMaterials}`);
  console.log(`  Total machines: ${totalMachines}`);

  // Step 3: Build VOR
  console.log(`\n--- VOR ---`);
  try {
    const vor = buildVOR(est, {});
    console.log(`  VOR sections: ${vor.sections}`);
    console.log(`  VOR total works: ${vor.totalWorks}`);
    console.log(`  VOR rows: ${vor.rows.length}`);
    for (const r of vor.rows.slice(0, 10)) {
      if (r.isSection) {
        console.log(`  --- Section: "${r.name}" ---`);
      } else {
        console.log(`    #${r.number} "${r.name.substring(0, 50)}" | ${r.unit} | ${r.quantity} | src=${r.sourceCode}`);
      }
    }
    if (vor.rows.length > 10) console.log(`    ... and ${vor.rows.length - 10} more rows`);
  } catch (e: any) {
    console.error(`  VOR build error: ${e.message}`);
  }

  // Step 4: Build Materials
  console.log(`\n--- Materials ---`);
  try {
    const materials = buildMaterialList(est, {});
    console.log(`  Total materials: ${materials.totalMaterials}`);
    console.log(`  Unique materials: ${materials.uniqueMaterials}`);
    console.log(`  Total cost: ${materials.totalCost}`);
    for (const mat of materials.rows.slice(0, 5)) {
      if (mat.isSection) {
        console.log(`    --- ${mat.name} ---`);
      } else {
        console.log(`    [${mat.code}] "${mat.name.substring(0, 50)}" | ${mat.unit} | qty=${mat.quantity} | price=${mat.totalBase}`);
      }
    }
    if (materials.rows.length > 5) console.log(`    ... and ${materials.rows.length - 5} more`);
  } catch (e: any) {
    console.error(`  Materials build error: ${e.message}`);
  }

  // Step 5: Export test
  console.log(`\n--- Export ---`);
  try {
    const vorResult = buildVOR(est, {});
    const vorFile = await exportVORToXlsx(est, vorResult);
    console.log(`  VOR XLSX exported: ${vorFile}`);
  } catch (e: any) {
    console.error(`  VOR export error: ${e.message}`);
  }

  try {
    const matResult = buildMaterialList(est, {});
    const matFile = await exportMaterialsToXlsx(est, matResult);
    console.log(`  Materials XLSX exported: ${matFile}`);
  } catch (e: any) {
    console.error(`  Materials export error: ${e.message}`);
  }
}

debugParse().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
