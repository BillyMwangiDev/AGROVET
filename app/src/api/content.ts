import { apiClient } from "./client";

// ── Types matching actual backend serializer output ────────────────────────

export interface ApiArticleCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ApiArticleListItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  category_name: string;
  tags: string;
  author_name: string | null;
  is_published: boolean;
  published_at: string | null;
  image: string | null;
  created_at: string;
}

export interface ApiArticle extends ApiArticleListItem {
  body: string;
  author: string | null;
  tag_list: string[];
  updated_at: string;
}

export interface CreateArticlePayload {
  title: string;
  category: string;
  tags?: string;
  body: string;
  is_published?: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function extractList<T>(data: T[] | { results: T[] }): T[] {
  return Array.isArray(data) ? data : (data as { results: T[] }).results ?? [];
}

// ── API Functions ──────────────────────────────────────────────────────────

export async function getArticleCategories(): Promise<ApiArticleCategory[]> {
  const { data } = await apiClient.get<ApiArticleCategory[] | { results: ApiArticleCategory[] }>("/api/content/categories/");
  return extractList(data);
}

export async function getArticles(category?: string): Promise<ApiArticleListItem[]> {
  const params = category ? `?category=${encodeURIComponent(category)}` : "";
  const { data } = await apiClient.get<ApiArticleListItem[] | { results: ApiArticleListItem[] }>(`/api/content/articles/${params}`);
  return extractList(data);
}

export async function getArticle(slug: string): Promise<ApiArticle> {
  const { data } = await apiClient.get<ApiArticle>(`/api/content/articles/${slug}/`);
  return data;
}

export async function createArticle(payload: CreateArticlePayload): Promise<ApiArticle> {
  const { data } = await apiClient.post<ApiArticle>("/api/content/articles/", payload);
  return data;
}

export async function updateArticle(
  slug: string,
  patch: Partial<CreateArticlePayload>
): Promise<ApiArticle> {
  const { data } = await apiClient.patch<ApiArticle>(`/api/content/articles/${slug}/`, patch);
  return data;
}

export async function deleteArticle(slug: string): Promise<void> {
  await apiClient.delete(`/api/content/articles/${slug}/`);
}

export async function togglePublishArticle(slug: string): Promise<{ is_published: boolean }> {
  const { data } = await apiClient.post<{ is_published: boolean }>(
    `/api/content/articles/${slug}/publish/`
  );
  return data;
}

export async function getAdminArticles(): Promise<ApiArticleListItem[]> {
  const { data } = await apiClient.get<ApiArticleListItem[] | { results: ApiArticleListItem[] }>("/api/content/admin/articles/");
  return extractList(data);
}
