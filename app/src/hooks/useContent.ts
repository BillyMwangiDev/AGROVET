import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getArticleCategories,
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  togglePublishArticle,
  getAdminArticles,
  type CreateArticlePayload,
} from "@/api/content";

export function useArticleCategories() {
  return useQuery({
    queryKey: ["article-categories"],
    queryFn: getArticleCategories,
    staleTime: 10 * 60 * 1000,
  });
}

export function useArticles(category?: string) {
  return useQuery({
    queryKey: ["articles", category ?? "all"],
    queryFn: () => getArticles(category),
    staleTime: 5 * 60 * 1000,
  });
}

export function useArticle(slug: string) {
  return useQuery({
    queryKey: ["article", slug],
    queryFn: () => getArticle(slug),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(slug),
  });
}

export function useAdminArticles() {
  return useQuery({
    queryKey: ["admin-articles"],
    queryFn: getAdminArticles,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createArticle,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["articles"] });
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
    },
  });
}

export function useUpdateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, patch }: { slug: string; patch: Partial<CreateArticlePayload> }) =>
      updateArticle(slug, patch),
    onSuccess: (_data, { slug }) => {
      qc.invalidateQueries({ queryKey: ["articles"] });
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
      qc.invalidateQueries({ queryKey: ["article", slug] });
    },
  });
}

export function useDeleteArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteArticle,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["articles"] });
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
    },
  });
}

export function useTogglePublishArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: togglePublishArticle,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["articles"] });
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
    },
  });
}
