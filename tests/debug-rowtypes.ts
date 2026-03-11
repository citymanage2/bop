import ExcelJS from 'exceljs';
import { detectColumnMapping } from '../src/parsers/excel/columnMapper';
import { classifyRow } from '../src/parsers/excel/rowClassifier';

const FILE = './НОВЫЕ_Раздел_ПД№12_подраздел_1_ЛСР.xlsx';

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE);
  const ws = wb.worksheets[0];
  const mapping = detectColumnMapping(ws);
  if (!mapping) { console.error('No mapping'); return; }

  // Rows 39-65 (first data rows after header)
  for (let r = 39; r <= 65; r++) {
    const row = ws.getRow(r);
    const classified = classifyRow(row, mapping, r);
    if (classified.rowType !== 'empty') {
      console.log(`Row ${r}: type=${classified.rowType} | pos=${classified.posNumber} | code="${classified.code.substring(0,30)}" | name="${classified.name.substring(0,50)}" | totalCost=${classified.values.totalCostTotal}`);
    }
  }
}

main().catch(console.error);
