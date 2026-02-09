/**
 * API маршруты для работы со сметами
 */

import { Router, type Request, type Response } from 'express';
import { upload } from '../middleware/upload';
import { parseEstimateFile } from '../../parsers';
import { normalizeEstimate } from '../../normalizer';
import { validateEstimate } from '../../normalizer/validators';
import { decomposeEstimate, updateItemWorks } from '../../decomposer';
import { db } from '../../models/database';
import type { WorkItem } from '../../models/estimate';
import { v4 as uuid } from 'uuid';

const router = Router();

/**
 * POST /api/estimates/upload
 * Загрузка и парсинг файла сметы
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const { path: filePath, originalname, size } = req.file;

    // Парсим файл
    const parseResult = await parseEstimateFile(filePath, originalname);

    if (parseResult.errors.length > 0 && !parseResult.estimate) {
      return res.status(422).json({
        error: 'Ошибка парсинга файла',
        errors: parseResult.errors,
      });
    }

    // Нормализуем
    const estimate = normalizeEstimate(parseResult.estimate);

    // Валидируем
    const validation = validateEstimate(estimate);

    // Сохраняем
    const stored = {
      id: estimate.id,
      estimate,
      uploadedAt: new Date(),
      fileName: originalname,
      fileSize: size,
    };
    db.saveEstimate(stored);

    const itemsCount = estimate.sections.reduce((sum, s) => sum + s.items.length, 0);

    return res.json({
      estimateId: estimate.id,
      name: estimate.name,
      format: estimate.sourceFormat,
      sectionsCount: estimate.sections.length,
      itemsCount,
      status: 'parsed',
      parseWarnings: [...parseResult.warnings, ...validation.warnings],
      parseErrors: parseResult.errors,
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: `Ошибка обработки файла: ${err.message}` });
  }
});

/**
 * GET /api/estimates
 * Список всех загруженных смет
 */
router.get('/', (_req: Request, res: Response) => {
  const estimates = db.getAllEstimates().map(s => ({
    id: s.id,
    name: s.estimate.name,
    number: s.estimate.number,
    object: s.estimate.object,
    format: s.estimate.sourceFormat,
    sectionsCount: s.estimate.sections.length,
    itemsCount: s.estimate.sections.reduce((sum, sec) => sum + sec.items.length, 0),
    uploadedAt: s.uploadedAt,
    fileName: s.fileName,
    fileSize: s.fileSize,
  }));

  return res.json({ estimates });
});

/**
 * GET /api/estimates/:id
 * Полные данные сметы
 */
router.get('/:id', (req: Request, res: Response) => {
  const stored = db.getEstimate(req.params.id as string);
  if (!stored) {
    return res.status(404).json({ error: 'Смета не найдена' });
  }

  return res.json({ estimate: stored.estimate });
});

/**
 * DELETE /api/estimates/:id
 */
router.delete('/:id', (req: Request, res: Response) => {
  const deleted = db.deleteEstimate(req.params.id as string);
  if (!deleted) {
    return res.status(404).json({ error: 'Смета не найдена' });
  }
  return res.json({ success: true });
});

/**
 * POST /api/estimates/:id/decompose
 * Декомпозиция расценок
 */
router.post('/:id/decompose', async (req: Request, res: Response) => {
  const stored = db.getEstimate(req.params.id as string);
  if (!stored) {
    return res.status(404).json({ error: 'Смета не найдена' });
  }

  const { items, forceAI } = req.body || {};
  const itemIds = items === 'all' || !items ? undefined : items;

  try {
    const result = await decomposeEstimate(stored.estimate, {
      itemIds,
      forceAI: forceAI || false,
    });

    // Обновляем в хранилище
    db.updateEstimate(stored.id, stored.estimate);

    return res.json(result);
  } catch (err: any) {
    console.error('Decomposition error:', err);
    return res.status(500).json({ error: `Ошибка декомпозиции: ${err.message}` });
  }
});

/**
 * PUT /api/estimates/:id/items/:itemId/works
 * Ручная корректировка состава работ
 */
router.put('/:id/items/:itemId/works', (req: Request, res: Response) => {
  const stored = db.getEstimate(req.params.id as string);
  if (!stored) {
    return res.status(404).json({ error: 'Смета не найдена' });
  }

  const { works } = req.body;
  if (!works || !Array.isArray(works)) {
    return res.status(400).json({ error: 'Некорректный формат данных. Ожидается массив works.' });
  }

  const workItems: WorkItem[] = works.map((w: any) => ({
    id: uuid(),
    parentItemId: req.params.itemId as string,
    code: w.code || '',
    name: w.name,
    unit: w.unit,
    quantity: w.quantity || 0,
    quantityRatio: w.quantityRatio || 1.0,
    description: w.description || '',
    source: 'manual' as const,
  }));

  const updated = updateItemWorks(stored.estimate, req.params.itemId as string, workItems);
  if (!updated) {
    return res.status(404).json({ error: 'Позиция не найдена' });
  }

  return res.json({ success: true, works: workItems });
});

export default router;
