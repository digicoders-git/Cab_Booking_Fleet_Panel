import axios from "axios";
import apiClient from "./apiClient";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const carsApi = {
  // 1. Car Create Karo (Fleet Only) - multipart/form-data for image support
  createCar: async (carData) => {
    const response = await apiClient.post("/api/fleet/cars/create", carData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // 2. Apni Saari Cars Dekho (Fleet Only)
  getAllCars: async () => {
    const response = await apiClient.get("/api/fleet/cars/all");
    return response.data;
  },

  // 3. Available Cars Dekho
  getAvailableCars: async () => {
    const response = await apiClient.get("/api/fleet/cars/available");
    return response.data;
  },

  // 4. Busy Cars Dekho
  getBusyCars: async () => {
    const response = await apiClient.get("/api/fleet/cars/busy");
    return response.data;
  },

  // 5. Ek Car ki Detail Dekho
  getCarById: async (carId) => {
    const response = await apiClient.get(`/api/fleet/cars/${carId}`);
    return response.data;
  },

  // 6. Car Update Karo - multipart/form-data for image support
  updateCar: async (carId, updateData) => {
    const response = await apiClient.put(`/api/fleet/cars/${carId}`, updateData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // 7. Car Delete Karo
  deleteCar: async (carId) => {
    const response = await apiClient.delete(`/api/fleet/cars/${carId}`);
    return response.data;
  },

  // 8. Admin — Saari Fleets ki Saari Cars
  adminGetAllCars: async () => {
    const response = await apiClient.get("/api/fleet/cars/admin/all");
    return response.data;
  },

  // 9. Get active car categories (Public API)
  getActiveCategories: async () => {
    // using raw axios to avoid sending auth headers for a public API
    const response = await axios.get(`${BASE_URL}/api/car-categories/active`);
    return response.data;
  },
};
