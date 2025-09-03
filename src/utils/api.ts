// src/utils/api.ts
import axios from "axios";

/**
 * Vite env:
 * - VITE_API_URL may be 'https://host' or 'https://host/api'
 * - VITE_IMAGE_BASE_URL (optional) is for Cloudinary / CDN base (no trailing slash)
 */

const RAW = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

// API_ROOT: host without trailing slash and without /api suffix
export const API_ROOT: string = RAW.replace(/\/+$/, "").replace(/\/api\/?$/, "");

// API_URL: full API endpoint (with /api)
export const API_URL: string = API_ROOT + "/api";

// MEDIA_URL: optional Cloudinary / image base, fallback to API_ROOT/uploads
export const MEDIA_URL: string =
  (import.meta as any).env?.VITE_IMAGE_BASE_URL ||
  (import.meta as any).env?.VITE_MEDIA_URL ||
  `${API_ROOT}/uploads`;

// Axios instance that front-end should use
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

// Attach JWT token (if present) to requests
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore (e.g. SSR or privacy modes)
  }
  return config;
});

export default api;
