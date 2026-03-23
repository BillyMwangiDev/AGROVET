import { apiClient } from "./client";

export interface StoreSettings {
  business_name: string;
  logo: string | null;
  tax_rate: string;
  currency: string;
  mpesa_consumer_key: string;
  mpesa_consumer_secret: string;
  mpesa_shortcode: string;
  mpesa_passkey: string;
  mpesa_callback_url: string;
  receipt_footer: string;
  enable_etims: boolean;
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const { data } = await apiClient.get<StoreSettings>("/api/auth/store-settings/");
  return data;
}

export async function updateStoreSettings(patch: Partial<StoreSettings>): Promise<StoreSettings> {
  const { data } = await apiClient.patch<StoreSettings>("/api/auth/store-settings/", patch);
  return data;
}
