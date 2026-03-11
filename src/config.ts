import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  claudeModel: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',

  uploadDir: path.resolve(process.env.UPLOAD_DIR || './uploads'),
  maxFileSize: process.env.MAX_FILE_SIZE || '50mb',

  maxFileSizeBytes: parseFileSize(process.env.MAX_FILE_SIZE || '50mb'),
};

function parseFileSize(size: string): number {
  const match = size.match(/^(\d+)(kb|mb|gb)?$/i);
  if (!match) return 50 * 1024 * 1024;
  const num = parseInt(match[1], 10);
  const unit = (match[2] || 'mb').toLowerCase();
  switch (unit) {
    case 'kb': return num * 1024;
    case 'mb': return num * 1024 * 1024;
    case 'gb': return num * 1024 * 1024 * 1024;
    default: return num;
  }
}
