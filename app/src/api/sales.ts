import { apiClient } from "./client";

export interface SaleItem {
  product_id: string;
  quantity: number;
}

export interface CreateSalePayload {
  customer_name?: string;
  customer_phone?: string;
  customer_id?: string;
  payment_method: "cash" | "mpesa" | "card";
  discount?: number;
  redeem_points?: number;
  items: SaleItem[];
}

export interface CreateSaleResponse {
  sale_id: string;
  receipt_number: string;
  total: string;
  receipt_html: string;
}

export async function createSale(payload: CreateSalePayload): Promise<CreateSaleResponse> {
  const { data } = await apiClient.post<CreateSaleResponse>("/api/pos/sale/", payload);
  return data;
}

export interface CreateReturnPayload {
  parent_sale_id: string;
  payment_method: "cash" | "mpesa" | "card";
  items: { product_id: string; quantity: number }[];
  is_return: true;
}

export async function createReturn(payload: CreateReturnPayload): Promise<CreateSaleResponse & { is_return: true }> {
  const { data } = await apiClient.post<CreateSaleResponse & { is_return: true }>("/api/pos/sale/", payload);
  return data;
}

export async function getSaleReceiptHtml(saleId: string): Promise<string> {
  const { data } = await apiClient.get<{ receipt_html: string }>(
    `/api/pos/sales/${saleId}/receipt.html/`
  );
  return data.receipt_html;
}

export async function downloadSalePDF(saleId: string, receiptNumber: string): Promise<void> {
  const { data } = await apiClient.get(`/api/pos/sale/${saleId}/receipt.pdf/`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipt_${receiptNumber}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
