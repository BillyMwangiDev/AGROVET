import { apiClient } from "./client";

export interface ApiAIRecord {
  id: string;
  certificate_no: string;
  // Farmer
  farmer_name: string;
  farmer_phone: string;
  sub_location: string;
  farm_ai_no: string;
  amount_charged: string | null;
  // Animal
  cow_id: string;
  animal_name: string;
  cow_breed: string;
  animal_dob: string | null;
  // Last calving
  last_calving_date: string | null;
  last_calving_outcome: string;
  // First insemination
  semen_product: string;
  semen_product_name: string;
  semen_sire_code: string | null;
  insemination_date: string;
  insemination_time: string | null;
  bull_code: string;
  bull_name: string;
  technician: string;
  // Second insemination
  second_semen_product: string | null;
  second_semen_product_name: string | null;
  second_semen_sire_code: string | null;
  second_insemination_date: string | null;
  second_insemination_time: string | null;
  second_bull_code: string;
  second_bull_name: string;
  second_technician: string;
  // Outcome
  status: "scheduled" | "completed" | "confirmed_pregnant" | "failed";
  measure: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAIRecordPayload {
  // Farmer
  farmer_name: string;
  farmer_phone: string;
  sub_location?: string;
  farm_ai_no?: string;
  amount_charged?: string | null;
  // Animal
  cow_id: string;
  animal_name?: string;
  cow_breed: string;
  animal_dob?: string | null;
  // Last calving
  last_calving_date?: string | null;
  last_calving_outcome?: string;
  // First insemination
  semen_product: string;
  insemination_date: string;
  insemination_time?: string | null;
  bull_code?: string;
  bull_name?: string;
  technician: string;
  // Second insemination
  second_semen_product?: string | null;
  second_insemination_date?: string | null;
  second_insemination_time?: string | null;
  second_bull_code?: string;
  second_bull_name?: string;
  second_technician?: string;
  // Outcome
  measure?: string;
  notes?: string;
}

export async function getAIRecords(search?: string): Promise<ApiAIRecord[]> {
  const params = search ? { search } : undefined;
  const { data } = await apiClient.get<{ results?: ApiAIRecord[] } | ApiAIRecord[]>(
    "/api/ai-records/",
    { params }
  );
  return Array.isArray(data) ? data : (data as { results: ApiAIRecord[] }).results ?? [];
}

export async function createAIRecord(payload: CreateAIRecordPayload): Promise<ApiAIRecord> {
  const { data } = await apiClient.post<ApiAIRecord>("/api/ai-records/", payload);
  return data;
}

export async function updateAIRecord(
  id: string,
  patch: Partial<Omit<ApiAIRecord, "id" | "certificate_no" | "created_at" | "updated_at">>
): Promise<ApiAIRecord> {
  const { data } = await apiClient.patch<ApiAIRecord>(`/api/ai-records/${id}/`, patch);
  return data;
}
