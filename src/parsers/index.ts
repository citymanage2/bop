/**
 * Фабрика парсеров — определяет формат файла и запускает соответствующий парсер
 */

import path from 'path';
import type { ParseResult } from '../models/estimate';
import { parseExcel } from './excel/excelParser';
import { parsePDF } from './pdf/pdfParser';
import { parseXML } from './xml/xmlParser';
import { parseGSN } from './xml/gsnParser';

export type SupportedFormat = 'pdf' | 'xlsx' | 'xls' | 'xml' | 'gsn';

/**
 * Определяет формат файла по расширению
 */
export function detectFormat(filename: string): SupportedFormat | null {
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  switch (ext) {
    case 'pdf': return 'pdf';
    case 'xlsx': return 'xlsx';
    case 'xls': return 'xls';
    case 'xml': return 'xml';
    case 'gsn': return 'gsn';
    default: return null;
  }
}

/**
 * Парсит файл сметы, автоматически определяя формат
 */
export async function parseEstimateFile(filePath: string, originalName: string): Promise<ParseResult> {
  const format = detectFormat(originalName);

  if (!format) {
    return {
      estimate: null as any,
      warnings: [],
      errors: [`Неподдерживаемый формат файла: ${path.extname(originalName)}. Поддерживаемые форматы: PDF, XLSX, XLS, XML, GSN.`],
    };
  }

  switch (format) {
    case 'xlsx':
    case 'xls':
      return parseExcel(filePath);

    case 'pdf':
      return parsePDF(filePath);

    case 'xml':
      return parseXML(filePath);

    case 'gsn':
      return parseGSN(filePath);
  }
}
