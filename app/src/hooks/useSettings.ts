import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStoreSettings, updateStoreSettings, type StoreSettings } from "@/api/settings";

export function useStoreSettings() {
  return useQuery({
    queryKey: ["store-settings"],
    queryFn: getStoreSettings,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateStoreSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<StoreSettings>) => updateStoreSettings(patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["store-settings"] }),
  });
}
