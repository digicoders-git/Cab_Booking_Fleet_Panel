import apiClient from "./apiClient";

export const fleetApi = {
  // 1. Get Fleet Profile
  getProfile: async () => {
    const response = await apiClient.get("/api/fleet/profile");
    return response.data;
  },

  // 2. Update Profile (Multipart/Form-Data)
  updateProfile: async (formData) => {
    const response = await apiClient.put("/api/fleet/profile-update", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // 3. Update Bank Details (JSON)
  updateBankDetails: async (bankData) => {
    const response = await apiClient.put("/api/fleet/profile-update", bankData);
    return response.data;
  },

  // 4. Get Fleet Dashboard Data
  getDashboard: async () => {
    const response = await apiClient.get("/api/fleet/dashboard");
    return response.data;
  },

  // 5. Get Fleet Performance Report
  getPerformanceReport: async () => {
    const response = await apiClient.get("/api/fleet/performance");
    return response.data;
  },
};
