import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSale,
  createReturn,
  downloadSalePDF,
  getSaleReceiptHtml,
  type CreateSalePayload,
  type CreateReturnPayload,
} from "@/api/sales";
import { getAllSales, getSaleDetail, type SaleListParams } from "@/api/customers";

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSalePayload) => createSale(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["all-sales"] });
    },
  });
}

export function useDownloadPDF() {
  return useMutation({
    mutationFn: ({ saleId, receiptNumber }: { saleId: string; receiptNumber: string }) =>
      downloadSalePDF(saleId, receiptNumber),
  });
}

export function useAllSales(params: SaleListParams) {
  return useQuery({
    queryKey: ["all-sales", params],
    queryFn: () => getAllSales(params),
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useSaleDetail(saleId: string | null) {
  return useQuery({
    queryKey: ["sale-detail", saleId],
    queryFn: () => getSaleDetail(saleId!),
    enabled: !!saleId,
    staleTime: 60 * 1000,
  });
}

export function useGetReceiptHtml() {
  return useMutation({
    mutationFn: (saleId: string) => getSaleReceiptHtml(saleId),
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReturnPayload) => createReturn(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-sales"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
