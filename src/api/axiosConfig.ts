import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // Adjust if your backend path is different
  withCredentials: true, // if using cookies or sessions
});

export default api;
