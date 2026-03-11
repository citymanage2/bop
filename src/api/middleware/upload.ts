/**
 * Middleware для загрузки файлов (Multer)
 */

import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { config } from '../../config';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['.pdf', '.xlsx', '.xls', '.xml', '.gsn'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Неподдерживаемый формат файла: ${ext}. Допустимые форматы: PDF, XLSX, XLS, XML, GSN.`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSizeBytes,
  },
});
