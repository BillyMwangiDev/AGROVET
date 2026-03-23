import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStoreConfig, updateStoreConfig } from "@/api/auth";
import type { StoreConfig } from "@/types";

export function useStoreConfig() {
  return useQuery({
    queryKey: ["store-config"],
    queryFn: getStoreConfig,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateStoreConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<StoreConfig>) => updateStoreConfig(patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["store-config"] }),
  });
}
