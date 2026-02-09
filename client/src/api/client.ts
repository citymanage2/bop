/**
 * API-клиент для взаимодействия с бэкендом
 */

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// Types
export interface EstimateSummary {
  id: string;
  name: string;
  number: string;
  object: string;
  format: string;
  sectionsCount: number;
  itemsCount: number;
  uploadedAt: string;
  fileName: string;
  fileSize: number;
}

export interface UploadResult {
  estimateId: string;
  name: string;
  format: string;
  sectionsCount: number;
  itemsCount: number;
  status: string;
  parseWarnings: string[];
  parseErrors: string[];
}

export interface DecomposeResult {
  totalItems: number;
  decomposed: number;
  fromCache: number;
  fromAI: number;
  fromParsed: number;
  warnings: string[];
}

export interface VORGenerateResult {
  vorId: string;
  downloadUrl: string;
  fileName: string;
  summary: { totalWorks: number; sections: number };
}

export interface MaterialsGenerateResult {
  materialsId: string;
  downloadUrl: string;
  fileName: string;
  summary: {
    totalMaterials: number;
    uniqueMaterials: number;
    unaccountedMaterials: number;
    totalCost: number;
  };
}

// API calls
export async function uploadEstimate(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/estimates/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function getEstimates(): Promise<{ estimates: EstimateSummary[] }> {
  return request('/estimates');
}

export async function getEstimate(id: string): Promise<{ estimate: any }> {
  return request(`/estimates/${id}`);
}

export async function deleteEstimate(id: string): Promise<void> {
  await request(`/estimates/${id}`, { method: 'DELETE' });
}

export async function decomposeEstimate(id: string, options?: { items?: string[]; forceAI?: boolean }): Promise<DecomposeResult> {
  return request(`/estimates/${id}/decompose`, {
    method: 'POST',
    body: JSON.stringify(options || { items: 'all' }),
  });
}

export async function generateVOR(id: string, options?: any): Promise<VORGenerateResult> {
  return request(`/estimates/${id}/vor`, {
    method: 'POST',
    body: JSON.stringify({ options }),
  });
}

export async function getVORPreview(id: string, params?: Record<string, string>): Promise<any> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return request(`/estimates/${id}/vor/preview${qs}`);
}

export async function generateMaterials(id: string, options?: any): Promise<MaterialsGenerateResult> {
  return request(`/estimates/${id}/materials`, {
    method: 'POST',
    body: JSON.stringify({ options }),
  });
}

export async function getMaterialsPreview(id: string, params?: Record<string, string>): Promise<any> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return request(`/estimates/${id}/materials/preview${qs}`);
}

export async function updateItemWorks(estimateId: string, itemId: string, works: any[]): Promise<any> {
  return request(`/estimates/${estimateId}/items/${itemId}/works`, {
    method: 'PUT',
    body: JSON.stringify({ works }),
  });
}
