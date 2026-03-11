/**
 * API маршруты для скачивания файлов
 */

import { Router, type Request, type Response } from 'express';
import path from 'path';
import fs from 'fs';
import { db } from '../../models/database';
import { config } from '../../config';

const router = Router();

/**
 * GET /api/downloads/:id
 * Скачивание сгенерированного файла
 */
router.get('/:id', (req: Request, res: Response) => {
  const download = db.getDownload(req.params.id as string);
  if (!download) {
    return res.status(404).json({ error: 'Файл не найден' });
  }

  const filePath = path.join(config.uploadDir, download.filePath);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Файл не найден на диске' });
  }

  const ext = path.extname(download.fileName).toLowerCase();
  const contentType = ext === '.xlsx'
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : ext === '.docx'
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/octet-stream';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(download.fileName)}"`);
  res.sendFile(filePath);
});

export default router;
