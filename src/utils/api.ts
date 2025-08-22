import axios from "axios";

const api = axios.create({
  // 👇 Railway production URL (via Vercel env) ya local fallback
  baseURL: (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api",
  withCredentials: true, // cookies/session ke liye helpful
});

// ✅ Request Interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
