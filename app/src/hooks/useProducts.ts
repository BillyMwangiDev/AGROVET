import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProducts,
  getProduct,
  getProductBySlug,
  getFeaturedProducts,
  searchProductSuggestions,
  getInventory,
  getCategories,
  getCategoryDetail,
  adjustStock,
  updateProduct,
  createProduct,
  deactivateProduct,
  getStockLog,
  type CreateProductPayload,
} from "@/api/products";
import type { ProductFilters } from "@/types";

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => getProducts(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProduct(id: string | null) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductBySlug(slug: string | null) {
  return useQuery({
    queryKey: ["product-slug", slug],
    queryFn: () => getProductBySlug(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ["featured-products"],
    queryFn: getFeaturedProducts,
    staleTime: 10 * 60 * 1000,
  });
}

export function useTrendingProducts(limit: number = 8) {
  const trendingQuery = useQuery({
    queryKey: ["trending-products", limit],
    queryFn: () => getProducts({ sort: "best_selling", limit: String(limit) }),
    staleTime: 10 * 60 * 1000,
  });

  const needsFallback = !trendingQuery.isLoading && (trendingQuery.data?.length ?? 0) < 3;

  const featuredQuery = useQuery({
    queryKey: ["featured-products"],
    queryFn: getFeaturedProducts,
    staleTime: 10 * 60 * 1000,
    enabled: needsFallback,
  });

  if (needsFallback) {
    return {
      ...featuredQuery,
      data: featuredQuery.data?.slice(0, limit) ?? [],
      isFallback: true as const,
    };
  }
  return {
    ...trendingQuery,
    data: trendingQuery.data ?? [],
    isFallback: false as const,
  };
}

export function useProductSearchSuggestions(q: string) {
  return useQuery({
    queryKey: ["product-suggestions", q],
    queryFn: () => searchProductSuggestions(q),
    enabled: q.length >= 2,
    staleTime: 30 * 1000,
  });
}

export function useCategories(topOnly = false) {
  return useQuery({
    queryKey: ["categories", topOnly],
    queryFn: () => getCategories(topOnly),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCategoryDetail(slug: string | null) {
  return useQuery({
    queryKey: ["category", slug],
    queryFn: () => getCategoryDetail(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useInventory(params?: { category?: string; search?: string }) {
  return useQuery({
    queryKey: ["inventory", params],
    queryFn: () => getInventory(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useStockAdjust() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      adjustment,
      reason,
    }: {
      productId: string;
      adjustment: number;
      reason?: string;
    }) => adjustStock(productId, adjustment, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: string; payload: FormData }) =>
      updateProduct(productId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["featured-products"] });
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductPayload | FormData) => createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeactivateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => deactivateProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useStockLog(productId: string | null) {
  return useQuery({
    queryKey: ["stock-log", productId],
    queryFn: () => getStockLog(productId!),
    enabled: !!productId,
    staleTime: 0,
  });
}
