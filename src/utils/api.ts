import axios from "axios";

export const API_URL: string = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const MEDIA_URL: string = import.meta.env.VITE_MEDIA_URL || API_URL.replace("/api", "");

// Axios instance for Frontend
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Customer token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
