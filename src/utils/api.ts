// src/utils/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api"
  // withCredentials: true // <-- Isko HATA DO! Jab tak cookies/auth na ho
});

export default api;
