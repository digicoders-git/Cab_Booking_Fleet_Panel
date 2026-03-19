import axios from "axios";

// Accessing VITE_API_BASE_URL from .env
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to add token to every request automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("fleet-token"); // using key from AuthContext.jsx
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
