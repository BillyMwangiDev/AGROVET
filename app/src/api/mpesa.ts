import { apiClient } from "./client";

export interface STKPushPayload {
  phone: string;
  amount: number;
  account_reference?: string;
}

export interface STKPushResponse {
  checkout_request_id: string;
  customer_message: string;
  response_code: string;
}

export interface MpesaStatusResponse {
  status: "pending" | "success" | "failed" | "cancelled";
  mpesa_receipt: string;
  result_desc: string;
  amount: string;
  phone: string;
}

export async function initiateSTKPush(payload: STKPushPayload): Promise<STKPushResponse> {
  const { data } = await apiClient.post<STKPushResponse>("/api/pos/mpesa/stk-push/", payload);
  return data;
}

export async function checkMpesaStatus(checkoutRequestId: string): Promise<MpesaStatusResponse> {
  const { data } = await apiClient.get<MpesaStatusResponse>(
    `/api/pos/mpesa/status/${checkoutRequestId}/`
  );
  return data;
}
