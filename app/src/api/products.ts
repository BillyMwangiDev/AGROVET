import { apiClient } from "./client";
import type { Product, AdminProduct, Category, ProductSearchSuggestion, ProductFilters } from "../types";

// ── Pagination wrapper ────────────────────────────────────────────────────

function extractList<T>(data: T[] | { results: T[] }): T[] {
  return Array.isArray(data) ? data : (data as { results: T[] }).results ?? [];
}

// ── Public endpoints ──────────────────────────────────────────────────────

export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  const params: Record<string, string> = {};
  if (filters?.q) params["q"] = filters.q;
  if (filters?.category) params["category"] = filters.category;
  if (filters?.price_min) params["price_min"] = filters.price_min;
  if (filters?.price_max) params["price_max"] = filters.price_max;
  if (filters?.stock) params["stock"] = filters.stock;
  if (filters?.sort) params["sort"] = filters.sort;
  if (filters?.is_ai !== undefined) params["is_ai"] = String(filters.is_ai);
  if (filters?.featured) params["featured"] = "true";
  if (filters?.limit) params["limit"] = filters.limit;

  const { data } = await apiClient.get<Product[] | { results: Product[] }>("/api/products/", { params });
  return extractList(data);
}

export async function getProduct(id: string): Promise<Product> {
  const { data } = await apiClient.get<Product>(`/api/products/${id}/`);
  return data;
}

export async function getProductBySlug(slug: string): Promise<Product> {
  const { data } = await apiClient.get<Product>(`/api/products/slug/${slug}/`);
  return data;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const { data } = await apiClient.get<Product[] | { results: Product[] }>("/api/products/featured/");
  return extractList(data);
}

export async function searchProductSuggestions(q: string): Promise<ProductSearchSuggestion[]> {
  if (q.length < 2) return [];
  const { data } = await apiClient.get<{ suggestions: ProductSearchSuggestion[] }>(
    "/api/products/search/",
    { params: { q } }
  );
  return data.suggestions ?? [];
}

export async function getCategories(topOnly = false): Promise<Category[]> {
  const { data } = await apiClient.get<Category[] | { results: Category[] }>("/api/categories/", {
    params: topOnly ? { top_only: "true" } : {},
  });
  return extractList(data);
}

export async function getCategoryDetail(slug: string): Promise<{ category: Category; products: Product[]; product_count: number }> {
  const { data } = await apiClient.get(`/api/categories/${slug}/`);
  return data;
}

// ── Admin endpoints ────────────────────────────────────────────────────────

export async function getInventory(params?: { category?: string; search?: string }): Promise<AdminProduct[]> {
  const queryParams: Record<string, string> = {};
  if (params?.category) queryParams["category__slug"] = params.category;
  if (params?.search) queryParams["search"] = params.search;

  const { data } = await apiClient.get<AdminProduct[] | { results: AdminProduct[] }>(
    "/api/admin/inventory/",
    { params: queryParams }
  );
  return extractList(data);
}

export async function adjustStock(
  productId: string,
  adjustment: number,
  reason?: string
): Promise<{ id: string; name: string; stock_level: number; stock_status: string }> {
  const { data } = await apiClient.patch(`/api/admin/inventory/${productId}/adjust-stock/`, {
    adjustment,
    reason,
  });
  return data;
}

export async function updateProduct(productId: string, payload: FormData): Promise<AdminProduct> {
  const { data } = await apiClient.patch<AdminProduct>(
    `/api/admin/inventory/${productId}/`,
    payload,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}

export interface CreateProductPayload {
  name: string;
  category: number;
  price: number | string;
  unit: string;
  description?: string;
  package_size?: string;
  stock_level?: number;
  reorder_point?: number;
  max_stock?: number;
  supplier?: string;
  expiry_date?: string | null;
  is_ai_product?: boolean;
  is_featured?: boolean;
  sku?: string;
}

export async function createProduct(payload: CreateProductPayload | FormData): Promise<AdminProduct> {
  const isFormData = payload instanceof FormData;
  const { data } = await apiClient.post<AdminProduct>("/api/admin/inventory/", payload, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
  return data;
}

export async function deactivateProduct(productId: string): Promise<void> {
  await apiClient.delete(`/api/admin/inventory/${productId}/`);
}

export interface ApiStockLog {
  id: number;
  change: number;
  reason: string;
  reason_display: string;
  note: string;
  user: string | null;
  user_name: string;
  created_at: string;
}

export async function getStockLog(productId: string): Promise<ApiStockLog[]> {
  const { data } = await apiClient.get<ApiStockLog[] | { results: ApiStockLog[] }>(
    `/api/admin/inventory/${productId}/stock-log/`
  );
  return extractList(data);
}
