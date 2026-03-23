import { useMutation, useQuery } from "@tanstack/react-query";
import { initiateSTKPush, checkMpesaStatus, type STKPushPayload } from "@/api/mpesa";

export function useSTKPush() {
  return useMutation({
    mutationFn: (payload: STKPushPayload) => initiateSTKPush(payload),
  });
}

export function useMpesaStatus(checkoutRequestId: string | null) {
  return useQuery({
    queryKey: ["mpesa-status", checkoutRequestId],
    queryFn: () => checkMpesaStatus(checkoutRequestId!),
    enabled: !!checkoutRequestId,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Stop polling once terminal state reached
      if (data?.status === "success" || data?.status === "failed" || data?.status === "cancelled") {
        return false;
      }
      return 3000; // poll every 3s while pending
    },
    staleTime: 0,
  });
}
