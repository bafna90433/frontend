import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://bafnatoys-backend-production.up.railway.app/api",
  withCredentials: true, // if using cookies or sessions
});

export default api;
