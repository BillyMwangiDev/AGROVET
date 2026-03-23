import { apiClient } from "./client";
import type { PurchaseOrder, POStatus } from "../types";

export interface POItemPayload {
  product: string; // UUID
  quantity_ordered: number;
  unit_cost: string;
  notes?: string;
}

export interface POCreatePayload {
  supplier: string; // UUID
  status?: POStatus;
  expected_delivery?: string;
  subtotal?: string;
  tax?: string;
  shipping?: string;
  notes?: string;
  items: POItemPayload[];
}

export interface ReceiveItemPayload {
  item_id: number;
  quantity_received: number;
}

export interface POListParams {
  status?: POStatus;
  search?: string;
  ordering?: string;
}

export async function getPurchaseOrders(params?: POListParams): Promise<PurchaseOrder[]> {
  const res = await apiClient.get<PurchaseOrder[]>("/api/purchase-orders/", { params });
  return res.data;
}

export async function getPurchaseOrder(id: string): Promise<PurchaseOrder> {
  const res = await apiClient.get<PurchaseOrder>(`/api/purchase-orders/${id}/`);
  return res.data;
}

export async function createPurchaseOrder(data: POCreatePayload): Promise<PurchaseOrder> {
  const res = await apiClient.post<PurchaseOrder>("/api/purchase-orders/", data);
  return res.data;
}

export async function updatePurchaseOrder(id: string, data: Partial<POCreatePayload>): Promise<PurchaseOrder> {
  const res = await apiClient.patch<PurchaseOrder>(`/api/purchase-orders/${id}/`, data);
  return res.data;
}

export async function receivePurchaseOrder(
  id: string,
  items: ReceiveItemPayload[]
): Promise<PurchaseOrder> {
  const res = await apiClient.post<PurchaseOrder>(`/api/purchase-orders/${id}/receive/`, { items });
  return res.data;
}

export async function downloadPOPDF(id: string): Promise<Blob> {
  const res = await apiClient.get(`/api/purchase-orders/${id}/pdf/`, { responseType: 'blob' });
  return res.data as Blob;
}
