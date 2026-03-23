import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAIRecords,
  createAIRecord,
  updateAIRecord,
  type CreateAIRecordPayload,
  type ApiAIRecord,
} from "@/api/aiRecords";

export function useAIRecords(search?: string) {
  return useQuery({
    queryKey: ["aiRecords", search],
    queryFn: () => getAIRecords(search),
    staleTime: 30 * 1000,
  });
}

export function useCreateAIRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAIRecordPayload) => createAIRecord(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aiRecords"] });
    },
  });
}

export function useUpdateAIRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Pick<ApiAIRecord, "status" | "notes">>;
    }) => updateAIRecord(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aiRecords"] });
    },
  });
}
