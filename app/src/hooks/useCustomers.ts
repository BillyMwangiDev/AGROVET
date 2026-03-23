import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCustomers, createCustomer, updateCustomer, getCustomerSales,
  type CreateCustomerPayload, type UpdateCustomerPayload,
} from "@/api/customers";

export function useCustomers(search?: string) {
  return useQuery({
    queryKey: ["customers", search],
    queryFn: () => getCustomers(search),
    staleTime: 60 * 1000,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCustomerPayload) => createCustomer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCustomerPayload }) =>
      updateCustomer(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useCustomerSales(
  customerId: string | null,
  page = 1,
  pageSize = 10
) {
  return useQuery({
    queryKey: ["customer-sales", customerId, page, pageSize],
    queryFn: () => getCustomerSales(customerId!, { page, page_size: pageSize }),
    enabled: !!customerId,
    staleTime: 30 * 1000,
  });
}

export function useCustomerSearch(query: string) {
  return useQuery({
    queryKey: ["customers", "search", query],
    queryFn: () => getCustomers(query),
    enabled: query.length >= 2,
    staleTime: 30 * 1000,
  });
}
