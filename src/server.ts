/**
 * Точка входа — Express-сервер
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { errorHandler } from './api/middleware/errorHandler';
import estimatesRouter from './api/routes/estimates';
import vorRouter from './api/routes/vor';
import materialsRouter from './api/routes/materials';
import downloadsRouter from './api/routes/downloads';
import scanRouter from './api/routes/scan';

console.log('Starting server...');
console.log(`  PORT=${config.port}`);
console.log(`  NODE_ENV=${config.nodeEnv}`);
console.log(`  UPLOAD_DIR=${config.uploadDir}`);
console.log(`  __dirname=${__dirname}`);

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Убеждаемся, что папка uploads существует
// Используем fallback на локальную папку при ошибке
try {
  if (!fs.existsSync(config.uploadDir)) {
    fs.mkdirSync(config.uploadDir, { recursive: true });
  }
  console.log(`Upload directory ready: ${config.uploadDir}`);
} catch (err) {
  console.warn(`Failed to create upload dir at ${config.uploadDir}:`, err);
  // Fallback: используем ./uploads относительно рабочей директории
  const fallbackDir = path.resolve('./uploads');
  try {
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true });
    }
    (config as any).uploadDir = fallbackDir;
    console.log(`Using fallback upload directory: ${fallbackDir}`);
  } catch (err2) {
    console.warn(`Failed to create fallback upload dir:`, err2);
    // Используем /tmp как крайний вариант
    (config as any).uploadDir = '/tmp/uploads';
    try {
      fs.mkdirSync('/tmp/uploads', { recursive: true });
    } catch { /* /tmp обычно доступен */ }
    console.log(`Using /tmp/uploads as last resort`);
  }
}

// API маршруты
app.use('/api/estimates', estimatesRouter);
app.use('/api/estimates', vorRouter);
app.use('/api/estimates', materialsRouter);
app.use('/api/downloads', downloadsRouter);
app.use('/api/scan', scanRouter);

// Здоровье сервера
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    uptime: process.uptime(),
  });
});

// Раздача статики фронтенда (production)
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
console.log(`Client dist path: ${clientDistPath} (exists: ${fs.existsSync(clientDistPath)})`);

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Обработчик ошибок
app.use(errorHandler);

// Запуск сервера — bind на 0.0.0.0 обязателен для Render
const HOST = '0.0.0.0';
const server = app.listen(config.port, HOST, () => {
  console.log(`Server started on ${HOST}:${config.port} [${config.nodeEnv}]`);
});

server.on('error', (err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

export default app;
