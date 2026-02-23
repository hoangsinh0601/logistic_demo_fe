import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";

// Khởi tạo instance với withCredentials để gửi cookies tự động
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  withCredentials: true,
});

// Không cần request interceptor gắn Authorization header nữa
// Cookie sẽ được gửi tự động nhờ withCredentials: true

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(undefined);
    }
  });

  failedQueue = [];
};

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Response Interceptor: Xử lý lỗi 401 tự động lấy lại token mới
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Cookie refresh_token sẽ tự động gửi kèm nhờ withCredentials
        await axios.post(
          `${api.defaults.baseURL}/refresh`,
          {},
          { withCredentials: true },
        );

        processQueue(null);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Nếu không phải 401 hoặc đã retry rồi, bắn lỗi ra ngoài
    return Promise.reject(error);
  },
);
