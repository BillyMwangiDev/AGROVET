import { useQuery } from "@tanstack/react-query";
import {
  getDashboardStats,
  getSalesTrend,
  getCategorySplit,
  getHourlySales,
  getSlowMovers,
  getCashierAudit,
  getDateRangeReport,
} from "@/api/analytics";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: getDashboardStats,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useSalesTrend(days = 7) {
  return useQuery({
    queryKey: ["analytics", "sales-trend", days],
    queryFn: () => getSalesTrend(days),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategorySplit() {
  return useQuery({
    queryKey: ["analytics", "category-split"],
    queryFn: getCategorySplit,
    staleTime: 10 * 60 * 1000,
  });
}

export function useHourlySales(days = 30) {
  return useQuery({
    queryKey: ["analytics", "hourly", days],
    queryFn: () => getHourlySales(days),
    staleTime: 10 * 60 * 1000,
  });
}

export function useSlowMovers(days = 30) {
  return useQuery({
    queryKey: ["analytics", "slow-movers", days],
    queryFn: () => getSlowMovers(days),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCashierAudit(days = 30) {
  return useQuery({
    queryKey: ["analytics", "cashier-audit", days],
    queryFn: () => getCashierAudit(days),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDateRangeReport(start: string, end: string) {
  return useQuery({
    queryKey: ["analytics", "date-range", start, end],
    queryFn: () => getDateRangeReport(start, end),
    staleTime: 5 * 60 * 1000,
    enabled: !!(start && end),
  });
}
