import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://bafnatoys-backend-production.up.railway.app/api",
  timeout: 30000,
  withCredentials: true,
});

export default api;
