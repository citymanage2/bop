/**
 * API маршруты для распознавания сканов смет
 */

import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { config } from '../../config';
import { parseScanFile } from '../../parsers/scan/scanParser';
import { exportScanToXlsx } from '../../exporters/scanExporter';
import { db } from '../../models/database';

const router = Router();

// Отдельный multer для сканов — принимает изображения и PDF
const scanStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `scan_${uuid()}${ext}`);
  },
});

const scanFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.tiff', '.tif', '.bmp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(
      `Неподдерживаемый формат файла: ${ext}. ` +
      'Для сканов допустимы: PDF, JPG, PNG, WEBP, GIF, TIFF, BMP.',
    ));
  }
};

const scanUpload = multer({
  storage: scanStorage,
  fileFilter: scanFileFilter,
  limits: {
    fileSize: config.maxFileSizeBytes,
    files: 20, // до 20 страниц
  },
});

/**
 * POST /api/scan/recognize
 * Загрузка и распознавание скана сметы
 *
 * Принимает multipart form с полем "file" (одиночный файл)
 * или "files" (несколько страниц)
 */
router.post('/recognize', scanUpload.array('files', 20), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    if (!config.anthropicApiKey) {
      return res.status(503).json({
        error: 'Для распознавания сканов необходим API-ключ Anthropic. ' +
               'Свяжитесь с администратором: citymanage@yandex.ru',
      });
    }

    const originalName = files[0].originalname;

    // Парсим скан через Claude Vision
    const scanResult = await parseScanFile(files[0].path, originalName);

    // Генерируем Excel
    const xlsxFileName = await exportScanToXlsx(scanResult);

    // Сохраняем для скачивания
    const downloadId = uuid();
    db.saveDownload(downloadId, xlsxFileName, `Смета_${scanResult.meta.estimateNumber || 'скан'}.xlsx`);

    const dataRows = scanResult.rows.filter(r => !r.isSection && !r.isTotal);
    const sectionCount = scanResult.rows.filter(r => r.isSection).length;

    return res.json({
      downloadId,
      downloadUrl: `/api/downloads/${downloadId}`,
      fileName: xlsxFileName,
      summary: {
        estimateName: scanResult.meta.estimateName,
        estimateNumber: scanResult.meta.estimateNumber,
        estimateType: scanResult.meta.estimateType,
        normBase: scanResult.meta.normBase,
        totalPositions: dataRows.length,
        totalSections: sectionCount,
        totalAmount: scanResult.totals.total || '',
        totalWithVat: scanResult.totals.totalWithVat || '',
        confidence: scanResult.quality.confidence,
        unreadableRows: scanResult.quality.unreadableRows,
      },
      warnings: scanResult.warnings,
    });
  } catch (err: any) {
    console.error('Scan recognition error:', err);
    return res.status(500).json({
      error: `Ошибка распознавания скана: ${err.message}`,
    });
  }
});

/**
 * POST /api/scan/recognize-single
 * Загрузка одного файла (для простого интерфейса)
 */
router.post('/recognize-single', scanUpload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    if (!config.anthropicApiKey) {
      return res.status(503).json({
        error: 'Для распознавания сканов необходим API-ключ Anthropic. ' +
               'Свяжитесь с администратором: citymanage@yandex.ru',
      });
    }

    const { path: filePath, originalname } = req.file;

    // Парсим скан через Claude Vision
    const scanResult = await parseScanFile(filePath, originalname);

    // Генерируем Excel
    const xlsxFileName = await exportScanToXlsx(scanResult);

    // Сохраняем для скачивания
    const downloadId = uuid();
    db.saveDownload(downloadId, xlsxFileName, `Смета_${scanResult.meta.estimateNumber || 'скан'}.xlsx`);

    const dataRows = scanResult.rows.filter(r => !r.isSection && !r.isTotal);
    const sectionCount = scanResult.rows.filter(r => r.isSection).length;

    return res.json({
      downloadId,
      downloadUrl: `/api/downloads/${downloadId}`,
      fileName: xlsxFileName,
      summary: {
        estimateName: scanResult.meta.estimateName,
        estimateNumber: scanResult.meta.estimateNumber,
        estimateType: scanResult.meta.estimateType,
        normBase: scanResult.meta.normBase,
        totalPositions: dataRows.length,
        totalSections: sectionCount,
        totalAmount: scanResult.totals.total || '',
        totalWithVat: scanResult.totals.totalWithVat || '',
        confidence: scanResult.quality.confidence,
        unreadableRows: scanResult.quality.unreadableRows,
      },
      warnings: scanResult.warnings,
    });
  } catch (err: any) {
    console.error('Scan recognition error:', err);
    return res.status(500).json({
      error: `Ошибка распознавания скана: ${err.message}`,
    });
  }
});

export default router;
