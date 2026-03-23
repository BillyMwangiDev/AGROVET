import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStockAlerts,
  acknowledgeAlert,
  resolveAlert,
  generateAlerts,
  type StockAlertParams,
} from "../api/stockAlerts";

export function useStockAlerts(params?: StockAlertParams) {
  return useQuery({
    queryKey: ["stock-alerts", params],
    queryFn: () => getStockAlerts(params),
  });
}

export function useAcknowledgeAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => acknowledgeAlert(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stock-alerts"] }),
  });
}

export function useResolveAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resolveAlert(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stock-alerts"] }),
  });
}

export function useGenerateAlerts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => generateAlerts(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-alerts"] });
      qc.invalidateQueries({ queryKey: ["admin-inventory"] });
    },
  });
}
