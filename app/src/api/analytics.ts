import { apiClient } from "./client";

export interface DashboardStats {
  today_sales_total: string;
  today_orders_count: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_customers: number;
  expiring_soon_count: number;
  expired_count: number;
  recent_sales: RecentSale[];
}

export interface RecentSale {
  id: string;
  receipt_number: string;
  customer_name: string;
  total: string;
  payment_method: string;
  created_at: string;
}

export interface SalesTrendEntry {
  date: string;
  full_date: string;
  sales: number;
  orders: number;
}

export interface CategorySplitEntry {
  name: string;
  value: number;
  revenue: number;
  color: string;
}

export interface HourlySalesEntry {
  hour: number;
  label: string;
  orders: number;
  sales: number;
}

export interface SlowMoverEntry {
  id: string;
  name: string;
  stock_level: number;
  price: string;
  qty_sold: number;
  category: string | null;
}

export interface CashierAuditEntry {
  cashier_id: string;
  name: string;
  total_sales: number;
  order_count: number;
  avg_sale: number;
}

export interface DateRangeReport {
  start: string;
  end: string;
  total_sales: number;
  total_orders: number;
  avg_order_value: number;
  by_payment_method: { method: string; total: number; count: number }[];
  top_products: { name: string; qty: number; revenue: number }[];
  daily: { date: string; sales: number; orders: number }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>("/api/analytics/dashboard/");
  return data;
}

export async function getSalesTrend(days = 7): Promise<SalesTrendEntry[]> {
  const { data } = await apiClient.get<SalesTrendEntry[]>("/api/analytics/sales-trend/", {
    params: { days },
  });
  return data;
}

export async function getCategorySplit(): Promise<CategorySplitEntry[]> {
  const { data } = await apiClient.get<CategorySplitEntry[]>("/api/analytics/category-split/");
  return data;
}

export async function getHourlySales(days = 30): Promise<HourlySalesEntry[]> {
  const { data } = await apiClient.get<HourlySalesEntry[]>("/api/analytics/hourly/", {
    params: { days },
  });
  return data;
}

export async function getSlowMovers(days = 30, limit = 20): Promise<SlowMoverEntry[]> {
  const { data } = await apiClient.get<SlowMoverEntry[]>("/api/analytics/slow-movers/", {
    params: { days, limit },
  });
  return data;
}

export async function getCashierAudit(days = 30): Promise<CashierAuditEntry[]> {
  const { data } = await apiClient.get<CashierAuditEntry[]>("/api/analytics/cashier-audit/", {
    params: { days },
  });
  return data;
}

export async function getDateRangeReport(start: string, end: string): Promise<DateRangeReport> {
  const { data } = await apiClient.get<DateRangeReport>("/api/analytics/date-range/", {
    params: { start, end },
  });
  return data;
}

export function buildExportUrl(format: "csv" | "excel", start: string, end: string): string {
  const base = format === "csv" ? "/api/analytics/export/csv/" : "/api/analytics/export/excel/";
  return `${base}?start=${start}&end=${end}`;
}
