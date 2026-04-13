import axios from "axios";

const RAW = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";
export const API_ROOT: string = RAW.replace(/\/+$/, "").replace(/\/api\/?$/, "");
export const API_URL: string = API_ROOT + "/api";
export const MEDIA_URL: string =
  (import.meta as any).env?.VITE_IMAGE_BASE_URL ||
  (import.meta as any).env?.VITE_MEDIA_URL ||
  `${API_ROOT}/uploads`;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 35000, // 35 seconds — Railway cold start can take 15-30s
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      error.message = "Request timed out. Please try again.";
    } else if (!error.response) {
      error.message = "Network Error";
    }
    return Promise.reject(error);
  }
);

export default api;