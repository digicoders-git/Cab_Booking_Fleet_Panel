import apiClient from "./apiClient";

export const authApi = {
  login: async (email, password) => {
    try {
      const response = await apiClient.post("/api/fleet/login", {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      // Throw error data if available
      throw error.response?.data || { message: "Something went wrong!" };
    }
  },
};
