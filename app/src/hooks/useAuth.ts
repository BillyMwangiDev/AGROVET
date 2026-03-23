import { useState, useEffect, useCallback } from "react";
import { login as apiLogin, getMe, pinVerify as apiPinVerify, type MeResponse } from "@/api/auth";

export function useAuth() {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore user from existing token
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const tokens = await apiLogin(username, password);
    localStorage.setItem("access_token", tokens.access);
    localStorage.setItem("refresh_token", tokens.refresh);
    const me = await getMe();
    setUser(me);
    return me;
  }, []);

  const switchUser = useCallback(async (userId: string, pin: string) => {
    const tokens = await apiPinVerify(userId, pin);
    localStorage.setItem("access_token", tokens.access);
    localStorage.setItem("refresh_token", tokens.refresh);
    const me = await getMe();
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  }, []);

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager" || isAdmin;
  const isCashier = user?.role === "cashier" || isManager;

  return {
    user,
    loading,
    login,
    switchUser,
    logout,
    isAuthenticated: !!user,
    isAdmin,
    isManager,
    isCashier,
  };
}
