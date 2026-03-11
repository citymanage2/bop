/**
 * Check actual column count and numbered row structure
 */
import ExcelJS from 'exceljs';

const FILE = './НОВЫЕ_Раздел_ПД№12_подраздел_1_ЛСР.xlsx';

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE);
  const ws = wb.worksheets[0];

  // Row 38 - the numbered row - dump ALL columns
  const row38 = ws.getRow(38);
  const vals38: string[] = [];
  row38.eachCell({ includeEmpty: false }, (cell, col) => {
    vals38.push(`[${col}]=${cell.value}`);
  });
  console.log(`Row 38 (${vals38.length} cells): ${vals38.join(' ')}`);

  // Row 41 - first data row - dump ALL columns
  const row41 = ws.getRow(41);
  const vals41: string[] = [];
  row41.eachCell({ includeEmpty: false }, (cell, col) => {
    const v = cell.value;
    const text = typeof v === 'object' && v !== null && 'richText' in v
      ? (v as any).richText.map((rt: any) => rt.text).join('')
      : String(v ?? '');
    vals41.push(`[${col}]=${text.substring(0, 40)}`);
  });
  console.log(`Row 41 (${vals41.length} cells): ${vals41.join(' ')}`);

  // Row 50 - "Всего по позиции" row
  const row50 = ws.getRow(50);
  const vals50: string[] = [];
  row50.eachCell({ includeEmpty: false }, (cell, col) => {
    vals50.push(`[${col}]=${cell.value}`);
  });
  console.log(`Row 50 (${vals50.length} cells): ${vals50.join(' ')}`);

  // Check what column 16 has (should be col 12 in the logical layout)
  const row37 = ws.getRow(37);
  for (let c = 1; c <= 20; c++) {
    const v = row37.getCell(c).value;
    if (v) console.log(`Row37[${c}] = ${String(v).substring(0, 60)}`);
  }

  // Row 46 - "Итого прямые затраты"
  const row46 = ws.getRow(46);
  const vals46: string[] = [];
  row46.eachCell({ includeEmpty: false }, (cell, col) => {
    vals46.push(`[${col}]=${cell.value}`);
  });
  console.log(`Row 46: ${vals46.join(' ')}`);

  // Look for the last cost column - check row 50 "Всего по позиции" for the total
  console.log('\nRow 50 all:');
  for (let c = 1; c <= 20; c++) {
    const v = row50.getCell(c).value;
    if (v !== null && v !== undefined) console.log(`  [${c}] = ${v}`);
  }

  // Row 43 - OT(ZT) row to see where total cost is
  const row43 = ws.getRow(43);
  console.log('\nRow 43 (OT) all:');
  for (let c = 1; c <= 20; c++) {
    const v = row43.getCell(c).value;
    if (v !== null && v !== undefined) console.log(`  [${c}] = ${v}`);
  }
}

main().catch(console.error);
