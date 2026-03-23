import { apiClient as api } from './client';
import type {
  BizDocument,
  CreateDocumentPayload,
  DocumentStatus,
  DocumentType,
} from '@/types';

function extractList<T>(data: T[] | { results: T[] }): T[] {
  return Array.isArray(data) ? data : (data as { results: T[] }).results ?? [];
}

export interface DocumentFilters {
  type?: DocumentType;
  status?: DocumentStatus;
  search?: string;
}

export async function getDocuments(filters?: DocumentFilters): Promise<BizDocument[]> {
  const params = new URLSearchParams();
  if (filters?.type) params.set('type', filters.type);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);
  const res = await api.get(`/api/documents/?${params.toString()}`);
  return extractList<BizDocument>(res.data);
}

export async function getDocument(id: string): Promise<BizDocument> {
  const res = await api.get(`/api/documents/${id}/`);
  return res.data as BizDocument;
}

export async function createDocument(payload: CreateDocumentPayload): Promise<BizDocument> {
  const res = await api.post('/api/documents/', payload);
  return res.data as BizDocument;
}

export async function updateDocument(
  id: string,
  patch: Partial<{ status: DocumentStatus; notes: string; due_date: string; valid_until: string; payment_terms: string; terms_conditions: string }>
): Promise<BizDocument> {
  const res = await api.patch(`/api/documents/${id}/`, patch);
  return res.data as BizDocument;
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/api/documents/${id}/`);
}

export async function downloadDocumentPDF(id: string): Promise<Blob> {
  const res = await api.get(`/api/documents/${id}/pdf/`, { responseType: 'blob' });
  return res.data as Blob;
}

export async function emailDocument(id: string, email?: string): Promise<{ message: string }> {
  const res = await api.post(`/api/documents/${id}/email/`, email ? { email } : {});
  return res.data as { message: string };
}
