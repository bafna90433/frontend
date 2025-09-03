// src/utils/api.ts
import axios from "axios";

/**
 * Keep compatibility:
 * - VITE_API_URL may be provided as root (no /api) or may include /api.
 * - Provide both API_ROOT (no /api) and API (with /api) named exports
 * - Provide MEDIA_URL (cloudinary / image base)
 * - Default export is axios instance (baseURL -> API)
 */

// raw environment value (may be like "https://host" or "https://host/api")
const RAW = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

// API_ROOT: no trailing slash, and no "/api" suffix
export const API_ROOT: string = RAW.replace(/\/+$/, "").replace(/\/api\/?$/, "");

// API (with /api)
export const API: string = `${API_ROOT}/api`;

// MEDIA_URL: cloudinary/image base OR fallback to API_ROOT/uploads pattern
export const MEDIA_URL: string =
  (import.meta as any).env?.VITE_IMAGE_BASE_URL ||
  (import.meta as any).env?.VITE_MEDIA_URL || // if you used VITE_MEDIA_URL earlier
  `${API_ROOT}/uploads`;

// Backwards compatibility: keep API_URL name if other files already import it
export const API_URL: string = API; // original behavior: pointed to /api

// Axios instance pointing at the API (/api)
const api = axios.create({
  baseURL: API,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

// optional interceptor: add customer JWT if present
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore in SSR / env without localStorage
  }
  return config;
});

export default api;
