import { apiClient } from "./client";

export interface ApiAIRecord {
  id: string;
  farmer_name: string;
  farmer_phone: string;
  cow_id: string;
  cow_breed: string;
  semen_product: string;
  semen_product_name: string;
  semen_sire_code: string | null;
  insemination_date: string;
  technician: string;
  status: "scheduled" | "completed" | "confirmed_pregnant" | "failed";
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAIRecordPayload {
  farmer_name: string;
  farmer_phone: string;
  cow_id: string;
  cow_breed: string;
  semen_product: string;
  insemination_date: string;
  technician: string;
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
  patch: Partial<Pick<ApiAIRecord, "status" | "notes">>
): Promise<ApiAIRecord> {
  const { data } = await apiClient.patch<ApiAIRecord>(`/api/ai-records/${id}/`, patch);
  return data;
}
