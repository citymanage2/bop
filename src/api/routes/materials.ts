/**
 * API маршруты для генерации списка материалов
 */

import { Router, type Request, type Response } from 'express';
import { db } from '../../models/database';
import { buildMaterialList } from '../../builders/materialListBuilder';
import { exportMaterialsToXlsx } from '../../exporters/xlsxExporter';
import { exportMaterialsToDocx } from '../../exporters/docxExporter';
import type { MaterialListOptions } from '../../models/estimate';
import { v4 as uuid } from 'uuid';

const router = Router();

/**
 * POST /api/estimates/:id/materials
 * Генерация списка материалов
 */
router.post('/:id/materials', async (req: Request, res: Response) => {
  const stored = db.getEstimate(req.params.id as string);
  if (!stored) {
    return res.status(404).json({ error: 'Смета не найдена' });
  }

  const options: Partial<MaterialListOptions> = req.body?.options || {};

  try {
    const materialsResult = buildMaterialList(stored.estimate, options);
    const format = options.exportFormat || 'xlsx';

    let fileName: string;
    if (format === 'docx') {
      fileName = await exportMaterialsToDocx(stored.estimate, materialsResult);
    } else {
      fileName = await exportMaterialsToXlsx(stored.estimate, materialsResult);
    }

    const downloadId = uuid();
    db.saveDownload(downloadId, fileName, `Материалы_${stored.estimate.name || 'export'}.${format}`);

    return res.json({
      materialsId: downloadId,
      downloadUrl: `/api/downloads/${downloadId}`,
      fileName,
      summary: {
        totalMaterials: materialsResult.totalMaterials,
        uniqueMaterials: materialsResult.uniqueMaterials,
        unaccountedMaterials: materialsResult.unaccountedMaterials,
        totalCost: materialsResult.totalCost,
      },
    });
  } catch (err: any) {
    console.error('Materials generation error:', err);
    return res.status(500).json({ error: `Ошибка генерации списка материалов: ${err.message}` });
  }
});

/**
 * GET /api/estimates/:id/materials/preview
 * Предпросмотр списка материалов (JSON)
 */
router.get('/:id/materials/preview', (req: Request, res: Response) => {
  const stored = db.getEstimate(req.params.id as string);
  if (!stored) {
    return res.status(404).json({ error: 'Смета не найдена' });
  }

  const options: Partial<MaterialListOptions> = {};
  if (req.query.groupBy) options.groupBy = req.query.groupBy as any;
  if (req.query.mergeIdentical) options.mergeIdentical = req.query.mergeIdentical === 'true';

  const materialsResult = buildMaterialList(stored.estimate, options);
  return res.json(materialsResult);
});

export default router;
