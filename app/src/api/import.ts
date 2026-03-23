import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "";

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; error: string }>;
}

export async function importExcel(file: File): Promise<ImportResult> {
  const token = localStorage.getItem("access_token");
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await axios.post<ImportResult>(
    `${BASE_URL}/api/admin/import-excel/`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );
  return data;
}
