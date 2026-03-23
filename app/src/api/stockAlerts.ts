import { apiClient } from "./client";
import type { StockAlert, AlertType, AlertStatus } from "../types";

export interface StockAlertParams {
  type?: AlertType;
  status?: AlertStatus;
  priority?: "low" | "medium" | "high" | "critical";
  search?: string;
}

export async function getStockAlerts(params?: StockAlertParams): Promise<StockAlert[]> {
  const res = await apiClient.get<{ results: StockAlert[] } | StockAlert[]>("/api/stock-alerts/", { params });
  return Array.isArray(res.data) ? res.data : (res.data as { results: StockAlert[] }).results;
}

export async function acknowledgeAlert(id: string): Promise<StockAlert> {
  const res = await apiClient.patch<StockAlert>(`/api/stock-alerts/${id}/acknowledge/`);
  return res.data;
}

export async function resolveAlert(id: string): Promise<StockAlert> {
  const res = await apiClient.patch<StockAlert>(`/api/stock-alerts/${id}/resolve/`);
  return res.data;
}

export async function generateAlerts(): Promise<{ alerts_created: number; products_scanned: number }> {
  const res = await apiClient.post<{ alerts_created: number; products_scanned: number }>(
    "/api/stock-alerts/generate/"
  );
  return res.data;
}
