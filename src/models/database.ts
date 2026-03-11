/**
 * In-memory хранилище для MVP (без PostgreSQL)
 *
 * Хранит загруженные сметы и результаты в памяти.
 * Для production — заменить на PostgreSQL + Prisma/Drizzle.
 */

import type { StoredEstimate, Estimate } from './estimate';

class InMemoryDB {
  private estimates = new Map<string, StoredEstimate>();
  private downloads = new Map<string, { filePath: string; fileName: string; createdAt: Date }>();

  // Estimates
  saveEstimate(data: StoredEstimate): void {
    this.estimates.set(data.id, data);
  }

  getEstimate(id: string): StoredEstimate | undefined {
    return this.estimates.get(id);
  }

  getAllEstimates(): StoredEstimate[] {
    return Array.from(this.estimates.values())
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }

  deleteEstimate(id: string): boolean {
    return this.estimates.delete(id);
  }

  updateEstimate(id: string, estimate: Estimate): boolean {
    const stored = this.estimates.get(id);
    if (!stored) return false;
    stored.estimate = estimate;
    return true;
  }

  // Downloads
  saveDownload(id: string, filePath: string, fileName: string): void {
    this.downloads.set(id, { filePath, fileName, createdAt: new Date() });
  }

  getDownload(id: string): { filePath: string; fileName: string } | undefined {
    return this.downloads.get(id);
  }
}

export const db = new InMemoryDB();
