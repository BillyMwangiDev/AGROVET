import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT from localStorage on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Queue of callers waiting for an in-flight token refresh to complete
let isRefreshing = false;
let refreshQueue: ((token: string) => void)[] = [];

function redirectToLogin() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  // Avoid redirect loop if already on the login page
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

// On 401: attempt silent token refresh once, then redirect to /login on failure
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Only attempt refresh for 401s that haven't been retried yet
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;
    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
      redirectToLogin();
      return Promise.reject(error);
    }

    // If a refresh is already in flight, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve) => {
        refreshQueue.push(resolve);
      }).then((newToken) => {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      });
    }

    isRefreshing = true;
    try {
      const { data } = await axios.post(`${BASE_URL}/api/auth/token/refresh/`, {
        refresh: refreshToken,
      });
      const newAccess: string = data.access;
      localStorage.setItem("access_token", newAccess);
      // simplejwt returns a rotated refresh token when ROTATE_REFRESH_TOKENS=True
      if (data.refresh) {
        localStorage.setItem("refresh_token", data.refresh);
      }
      // Unblock all queued requests
      refreshQueue.forEach((resolve) => resolve(newAccess));
      refreshQueue = [];
      original.headers.Authorization = `Bearer ${newAccess}`;
      return apiClient(original);
    } catch {
      // Refresh failed — force logout
      redirectToLogin();
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);
