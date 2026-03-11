/**
 * Глобальный обработчик ошибок Express
 */

import type { Request, Response, NextFunction } from 'express';

export interface AppError {
  status: number;
  message: string;
  details?: any;
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err.message || err);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({
      error: 'Файл слишком большой',
      message: 'Максимальный размер файла: 50 МБ',
    });
    return;
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    res.status(400).json({
      error: 'Некорректный файл',
      message: 'Ожидается один файл в поле "file"',
    });
    return;
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Внутренняя ошибка сервера';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
