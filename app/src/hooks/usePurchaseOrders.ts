import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  receivePurchaseOrder,
  type POCreatePayload,
  type POListParams,
  type ReceiveItemPayload,
} from "../api/purchaseOrders";

export function usePurchaseOrders(params?: POListParams) {
  return useQuery({
    queryKey: ["purchase-orders", params],
    queryFn: () => getPurchaseOrders(params),
  });
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: ["purchase-orders", id],
    queryFn: () => getPurchaseOrder(id),
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: POCreatePayload) => createPurchaseOrder(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-inventory"] });
    },
  });
}

export function useUpdatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<POCreatePayload> }) =>
      updatePurchaseOrder(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchase-orders"] }),
  });
}

export function useReceivePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, items }: { id: string; items: ReceiveItemPayload[] }) =>
      receivePurchaseOrder(id, items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      // Invalidate inventory since stock levels change
      qc.invalidateQueries({ queryKey: ["admin-inventory"] });
      qc.invalidateQueries({ queryKey: ["stock-alerts"] });
    },
  });
}
