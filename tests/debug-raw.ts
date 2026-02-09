/**
 * Raw dump of first 50 rows of a real XLSX to understand structure
 */
import ExcelJS from 'exceljs';

const FILE = process.argv[2] || './НОВЫЕ_Раздел_ПД№12_подраздел_1_ЛСР.xlsx';

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE);

  for (const ws of wb.worksheets) {
    console.log(`\n=== Worksheet: "${ws.name}" rows=${ws.rowCount} cols=${ws.columnCount} ===`);

    // Dump merged cells info
    const merges = (ws as any)._merges || {};
    const mergeKeys = Object.keys(merges);
    if (mergeKeys.length > 0) {
      console.log(`Merged ranges (first 20 of ${mergeKeys.length}):`);
      for (const key of mergeKeys.slice(0, 20)) {
        console.log(`  ${key}`);
      }
    }

    // Dump first 50 rows, only columns 1-15
    for (let r = 1; r <= Math.min(50, ws.rowCount); r++) {
      const row = ws.getRow(r);
      const cells: string[] = [];
      for (let c = 1; c <= 15; c++) {
        const cell = row.getCell(c);
        const val = cell.value;
        if (val === null || val === undefined) {
          cells.push('');
          continue;
        }
        let text: string;
        if (typeof val === 'object' && 'richText' in val) {
          text = (val as any).richText.map((rt: any) => rt.text).join('');
        } else if (typeof val === 'object' && 'hyperlink' in val) {
          text = `[LINK:${(val as any).text || (val as any).hyperlink}]`;
        } else {
          text = String(val);
        }
        // Truncate
        if (text.length > 35) text = text.substring(0, 35) + '...';
        cells.push(text.replace(/\n/g, '\\n'));
      }
      const nonEmpty = cells.filter(c => c !== '');
      if (nonEmpty.length > 0) {
        console.log(`R${r}: ${cells.map((c, i) => c ? `[${i+1}]${c}` : '').filter(Boolean).join(' | ')}`);
      }
    }

    // Also dump rows 30-45 more carefully to see header area
    console.log(`\n--- Rows 30-45 detailed ---`);
    for (let r = 30; r <= Math.min(45, ws.rowCount); r++) {
      const row = ws.getRow(r);
      const cells: string[] = [];
      for (let c = 1; c <= 15; c++) {
        const cell = row.getCell(c);
        const val = cell.value;
        let text = '';
        if (val !== null && val !== undefined) {
          if (typeof val === 'object' && 'richText' in val) {
            text = (val as any).richText.map((rt: any) => rt.text).join('');
          } else {
            text = String(val);
          }
        }
        cells.push(text.replace(/\n/g, '\\n').substring(0, 45));
      }
      console.log(`R${r}: |${cells.join('|')}|`);
    }

    // Only process first worksheet
    break;
  }
}

main().catch(console.error);
