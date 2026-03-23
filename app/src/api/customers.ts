import { apiClient } from "./client";

export interface ApiCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  notes: string;
  total_purchases: string;
  last_purchase: string | null;
  loyalty_points: number;
  created_at: string;
}

export interface CreateCustomerPayload {
  name: string;
  phone: string;
  email?: string;
  location?: string;
  notes?: string;
}

export async function getCustomers(search?: string): Promise<ApiCustomer[]> {
  const params = search ? { search } : undefined;
  const { data } = await apiClient.get<{ results?: ApiCustomer[] } | ApiCustomer[]>(
    "/api/customers/",
    { params }
  );
  return Array.isArray(data) ? data : (data as { results: ApiCustomer[] }).results ?? [];
}

export async function createCustomer(payload: CreateCustomerPayload): Promise<ApiCustomer> {
  const { data } = await apiClient.post<ApiCustomer>("/api/customers/", payload);
  return data;
}

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>;

export async function updateCustomer(id: string, payload: UpdateCustomerPayload): Promise<ApiCustomer> {
  const { data } = await apiClient.patch<ApiCustomer>(`/api/customers/${id}/`, payload);
  return data;
}

export interface ApiSaleItem {
  id: string;
  product: string;
  product_name: string;
  unit_price: string;
  quantity: number;
  line_total: string;
}

export interface ApiSale {
  id: string;
  receipt_number: string;
  customer: string | null;
  customer_display: string;
  customer_name: string;
  customer_phone: string;
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
  payment_method: "cash" | "mpesa" | "card";
  status: "completed" | "pending" | "cancelled";
  is_return: boolean;
  parent_sale: string | null;
  parent_receipt_number: string | null;
  served_by: string | null;
  served_by_name: string | null;
  items: ApiSaleItem[];
  created_at: string;
}

export interface ApiSaleListItem {
  id: string;
  receipt_number: string;
  customer_display: string;
  customer_name: string;
  customer_phone: string;
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
  payment_method: "cash" | "mpesa" | "card";
  status: "completed" | "pending" | "cancelled";
  is_return: boolean;
  parent_sale: string | null;
  served_by_name: string | null;
  created_at: string;
}

export interface ApiSaleListResponse {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: ApiSaleListItem[];
}

export interface ApiCustomerSalesResponse {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: ApiSale[];
}

export interface SaleListParams {
  start_date?: string;
  end_date?: string;
  search?: string;
  payment_method?: "cash" | "mpesa" | "card" | "";
  is_return?: boolean;
  page?: number;
  page_size?: number;
}

export async function getAllSales(params: SaleListParams = {}): Promise<ApiSaleListResponse> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  );
  const { data } = await apiClient.get<ApiSaleListResponse>("/api/pos/sales/", { params: cleaned });
  return data;
}

export async function getSaleDetail(saleId: string): Promise<ApiSale> {
  const { data } = await apiClient.get<ApiSale>(`/api/pos/sales/${saleId}/`);
  return data;
}

export async function getCustomerSales(
  customerId: string,
  params: { page?: number; page_size?: number; start_date?: string; end_date?: string } = {}
): Promise<ApiCustomerSalesResponse> {
  const { data } = await apiClient.get<ApiCustomerSalesResponse>(
    `/api/customers/${customerId}/sales/`,
    { params }
  );
  return data;
}
