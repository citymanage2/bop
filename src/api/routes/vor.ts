/**
 * API маршруты для генерации ВОР
 */

import { Router, type Request, type Response } from 'express';
import { db } from '../../models/database';
import { buildVOR } from '../../builders/vorBuilder';
import { exportVORToXlsx } from '../../exporters/xlsxExporter';
import { exportVORToDocx } from '../../exporters/docxExporter';
import type { VOROptions } from '../../models/estimate';
import { v4 as uuid } from 'uuid';

const router = Router();

/**
 * POST /api/estimates/:id/vor
 * Генерация ВОР
 */
router.post('/:id/vor', async (req: Request, res: Response) => {
  const stored = db.getEstimate(req.params.id as string);
  if (!stored) {
    return res.status(404).json({ error: 'Смета не найдена' });
  }

  const options: Partial<VOROptions> = req.body?.options || {};

  try {
    const vorResult = buildVOR(stored.estimate, options);
    const format = options.exportFormat || 'xlsx';

    let fileName: string;
    if (format === 'docx') {
      fileName = await exportVORToDocx(stored.estimate, vorResult);
    } else {
      fileName = await exportVORToXlsx(stored.estimate, vorResult);
    }

    const downloadId = uuid();
    db.saveDownload(downloadId, fileName, `ВОР_${stored.estimate.name || 'export'}.${format}`);

    return res.json({
      vorId: downloadId,
      downloadUrl: `/api/downloads/${downloadId}`,
      fileName,
      summary: {
        totalWorks: vorResult.totalWorks,
        sections: vorResult.sections,
      },
    });
  } catch (err: any) {
    console.error('VOR generation error:', err);
    return res.status(500).json({ error: `Ошибка генерации ВОР: ${err.message}` });
  }
});

/**
 * GET /api/estimates/:id/vor/preview
 * Предпросмотр ВОР (JSON)
 */
router.get('/:id/vor/preview', (req: Request, res: Response) => {
  const stored = db.getEstimate(req.params.id as string);
  if (!stored) {
    return res.status(404).json({ error: 'Смета не найдена' });
  }

  const options: Partial<VOROptions> = {};
  if (req.query.groupBySection) options.groupBySection = req.query.groupBySection === 'true';
  if (req.query.includeSourceCode) options.includeSourceCode = req.query.includeSourceCode === 'true';
  if (req.query.mergeIdenticalWorks) options.mergeIdenticalWorks = req.query.mergeIdenticalWorks === 'true';

  const vorResult = buildVOR(stored.estimate, options);
  return res.json(vorResult);
});

export default router;
