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

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Убеждаемся, что папка uploads существует
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

// API маршруты
app.use('/api/estimates', estimatesRouter);
app.use('/api/estimates', vorRouter);
app.use('/api/estimates', materialsRouter);
app.use('/api/downloads', downloadsRouter);

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
app.listen(config.port, HOST, () => {
  console.log(`Server started on ${HOST}:${config.port} [${config.nodeEnv}]`);
});

export default app;
