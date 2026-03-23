import { apiClient } from "./client";
import type { Supplier } from "../types";

export interface SupplierPayload {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  payment_terms?: string;
  credit_limit?: string;
  rating?: number;
  notes?: string;
  is_active?: boolean;
}

export async function getSuppliers(active?: boolean): Promise<Supplier[]> {
  const params: Record<string, string> = {};
  if (active !== undefined) params.active = String(active);
  const res = await apiClient.get<Supplier[]>("/api/suppliers/", { params });
  return res.data;
}

export async function getSupplier(id: string): Promise<Supplier> {
  const res = await apiClient.get<Supplier>(`/api/suppliers/${id}/`);
  return res.data;
}

export async function createSupplier(data: SupplierPayload): Promise<Supplier> {
  const res = await apiClient.post<Supplier>("/api/suppliers/", data);
  return res.data;
}

export async function updateSupplier(id: string, data: Partial<SupplierPayload>): Promise<Supplier> {
  const res = await apiClient.patch<Supplier>(`/api/suppliers/${id}/`, data);
  return res.data;
}

export async function deleteSupplier(id: string): Promise<void> {
  await apiClient.delete(`/api/suppliers/${id}/`);
}
