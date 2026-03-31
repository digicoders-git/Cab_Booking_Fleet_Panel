import apiClient from "./apiClient";

export const driversApi = {
  // 1. Create New Driver (All Fields - FormData)
  createDriver: async (formData) => {
    const response = await apiClient.post("/api/fleet/drivers/create", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // 2. Get ALL Drivers
  getAllDrivers: async () => {
    const response = await apiClient.get("/api/fleet/drivers/all");
    return response.data;
  },

  // 3. Get Pending Drivers
  getPendingDrivers: async () => {
    const response = await apiClient.get("/api/fleet/drivers/pending");
    return response.data;
  },

  // 4. Get Approved Drivers
  getApprovedDrivers: async () => {
    const response = await apiClient.get("/api/fleet/drivers/approved");
    return response.data;
  },

  // 5. Get Single Driver
  getDriverById: async (driverId) => {
    const response = await apiClient.get(`/api/fleet/drivers/${driverId}`);
    return response.data;
  },

  // 6. Update Driver Details (All Fields - FormData)
  updateDriver: async (driverId, formData) => {
    const response = await apiClient.put(`/api/fleet/drivers/update/${driverId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // 7. Delete Driver
  // 8. Get LIVE Status Drivers (Directly from main model)
  getFleetDriversLive: async () => {
    const response = await apiClient.get("/api/fleet/drivers/live");
    return response.data;
  },
};
