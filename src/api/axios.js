import axios from "axios";
import { message } from "antd";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Send HttpOnly JWT cookies on every request
  timeout: 15000,        // 15s — requests won't hang forever
});

// ----------------------------------------------------
// Request interceptor: attach CSRF token (double-submit cookie pattern)
// Flask-JWT-Extended sets a readable `csrf_access_token` cookie on login.
// We must forward it as X-CSRF-TOKEN on every mutating request.
// ----------------------------------------------------
api.interceptors.request.use((config) => {
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf_access_token='))
    ?.split('=')[1];

  if (csrfToken) {
    config.headers['X-CSRF-TOKEN'] = csrfToken;
  }
  return config;
});


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
        await api.post("/refresh");
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