import axios from "axios";
import { message } from "antd";

// Helper to read cookies (for CSRF tokens)
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Send HttpOnly JWT cookies on every request
  timeout: 15000,        // 15s — requests won't hang forever
  // Automatically pull csrf_access_token and send as X-CSRF-TOKEN
  xsrfCookieName: "csrf_access_token",
  xsrfHeaderName: "X-CSRF-TOKEN",
});

// ----------------------------------------------------
// Request interceptor
// ----------------------------------------------------
api.interceptors.request.use(
  (config) => {
    const method = config.method?.toLowerCase();
    if (["post", "put", "delete", "patch"].includes(method)) {
      const csrfToken = getCookie("csrf_access_token");
      if (csrfToken && !config.headers["X-CSRF-TOKEN"]) {
        config.headers["X-CSRF-TOKEN"] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ----------------------------------------------------
// Response interceptor: handle 401 / 403 / 429 / auto-refresh
// ----------------------------------------------------
let isRefreshing = false;
let failedQueue = [];

function processQueue(error) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // ── 429 Rate Limit ────────────────────────────────────────────────────────
    if (status === 429) {
      message.error(
        error.response?.data?.message ||
        "Too many attempts. Please try again later."
      );
      return Promise.reject(error);
    }

    // ── 403 Forbidden ─────────────────────────────────────────────────────────
    if (status === 403) {
      message.error("You do not have permission to perform this action.");
      return Promise.reject(error);
    }

    // ── 401 Unauthorised — attempt token refresh ───────────────────────────────
    const isAuthEndpoint =
      originalRequest?.url?.includes("/login") ||
      originalRequest?.url?.includes("/refresh") ||
      originalRequest?.url?.includes("/logout");

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const csrfRefresh = getCookie("csrf_refresh_token");
        await api.post("/refresh", {}, {
          headers: csrfRefresh ? { "X-CSRF-TOKEN": csrfRefresh } : {}
        });
        processQueue(null);
        return api(originalRequest);
      } catch (refreshErr) {
        if (import.meta.env.DEV) {
          console.error("Refresh failed:", refreshErr);
        }
        processQueue(refreshErr);
        localStorage.removeItem("sv_user");
        window.dispatchEvent(new Event("sv:session-expired"));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;