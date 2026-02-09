/**
 * Декомпозиция расценок из локального кэша (JSON-база)
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import type { WorkItem, SmetaItem } from '../models/estimate';

interface RascenkaEntry {
  name: string;
  unit: string;
  works: {
    name: string;
    unit: string;
    quantityRatio: number;
    description: string;
  }[];
}

type RascenkiDB = Record<string, RascenkaEntry>;

let cachedDB: RascenkiDB | null = null;

function loadDB(): RascenkiDB {
  if (cachedDB) return cachedDB;

  const dbPath = path.join(__dirname, 'data', 'rascenki-db.json');
  try {
    const content = fs.readFileSync(dbPath, 'utf-8');
    cachedDB = JSON.parse(content);
    return cachedDB!;
  } catch {
    cachedDB = {};
    return cachedDB;
  }
}

/**
 * Ищет состав расценки в локальной базе
 * Возвращает null, если расценка не найдена
 */
export function decomposeFromCache(item: SmetaItem): WorkItem[] | null {
  const db = loadDB();

  // Точное совпадение кода
  const entry = db[item.code];
  if (entry) {
    return entry.works.map(w => ({
      id: uuid(),
      parentItemId: item.id,
      code: item.code,
      name: w.name,
      unit: w.unit || item.unit,
      quantity: item.quantity * w.quantityRatio,
      quantityRatio: w.quantityRatio,
      description: w.description || '',
      source: 'cache' as const,
    }));
  }

  // Попробуем найти по коду без последних цифр (вариант расценки)
  const baseCode = item.code.replace(/-\d{2}$/, '');
  for (const [code, rascenka] of Object.entries(db)) {
    if (code.startsWith(baseCode)) {
      return rascenka.works.map(w => ({
        id: uuid(),
        parentItemId: item.id,
        code: item.code,
        name: w.name,
        unit: w.unit || item.unit,
        quantity: item.quantity * w.quantityRatio,
        quantityRatio: w.quantityRatio,
        description: w.description || '',
        source: 'cache' as const,
      }));
    }
  }

  return null;
}

/**
 * Добавляет новую запись в локальную базу
 */
export function saveToCache(code: string, name: string, unit: string, works: WorkItem[]): void {
  const db = loadDB();

  db[code] = {
    name,
    unit,
    works: works.map(w => ({
      name: w.name,
      unit: w.unit,
      quantityRatio: w.quantityRatio,
      description: w.description,
    })),
  };

  const dbPath = path.join(__dirname, 'data', 'rascenki-db.json');
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
  cachedDB = db;
}
