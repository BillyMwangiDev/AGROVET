import { apiClient } from "./client";
import type { User, UserRole, StoreConfig } from "@/types";

export interface LoginResponse {
  access: string;
  refresh: string;
  role: UserRole;
  full_name: string;
}

export type MeResponse = User;

export interface SignupPayload {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface CreateStaffPayload {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  password: string;
  pin?: string;
  is_active_cashier?: boolean;
}

export interface UpdateStaffPayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  password?: string;
  pin?: string;
  is_active_cashier?: boolean;
  is_active?: boolean;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/api/auth/token/", {
    username,
    password,
  });
  return data;
}

export async function refreshToken(refresh: string): Promise<{ access: string }> {
  const { data } = await apiClient.post<{ access: string }>("/api/auth/token/refresh/", {
    refresh,
  });
  return data;
}

export async function getMe(): Promise<MeResponse> {
  const { data } = await apiClient.get<MeResponse>("/api/auth/me/");
  return data;
}

export async function pinVerify(user_id: string, pin: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/api/auth/pin-verify/", { user_id, pin });
  return data;
}

export async function getActiveCashiers(): Promise<Pick<User, "id" | "first_name" | "last_name" | "username" | "role" | "avatar">[]> {
  const { data } = await apiClient.get("/api/auth/cashiers/");
  return data;
}

export async function signup(payload: SignupPayload): Promise<{ detail: string }> {
  const { data } = await apiClient.post("/api/auth/signup/", payload);
  return data;
}

export async function getStaffList(params?: { role?: string; search?: string }): Promise<User[]> {
  const { data } = await apiClient.get<User[]>("/api/auth/users/", { params });
  return data;
}

export async function createStaff(payload: CreateStaffPayload): Promise<User> {
  const { data } = await apiClient.post<User>("/api/auth/users/", payload);
  return data;
}

export async function updateStaff(id: string, payload: UpdateStaffPayload): Promise<User> {
  const { data } = await apiClient.patch<User>(`/api/auth/users/${id}/`, payload);
  return data;
}

export async function deactivateStaff(id: string): Promise<void> {
  await apiClient.delete(`/api/auth/users/${id}/`);
}

export async function getStoreConfig(): Promise<StoreConfig> {
  const { data } = await apiClient.get<StoreConfig>("/api/auth/store-config/");
  return data;
}

export async function updateStoreConfig(payload: Partial<StoreConfig>): Promise<StoreConfig> {
  const { data } = await apiClient.patch<StoreConfig>("/api/auth/store-config/", payload);
  return data;
}
