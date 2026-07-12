import axios from "axios";

const api = axios.create({
  baseURL: "https://shanvilla.pythonanywhere.com",
  withCredentials: true, // Send HttpOnly JWT cookies on every request
});

// ----------------------------------------------------
// Debug every outgoing request
// ----------------------------------------------------
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// ----------------------------------------------------
// Response interceptor: auto-refresh on 401
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

    const isAuthEndpoint =
      originalRequest?.url?.includes("/login") ||
      originalRequest?.url?.includes("/refresh") ||
      originalRequest?.url?.includes("/logout");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
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
        console.error("Refresh failed:", refreshErr);

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