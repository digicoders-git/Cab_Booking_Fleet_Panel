import apiClient from "./apiClient";

export const getBulkMarketplace = async () => {
  try {
    const response = await apiClient.get("/api/bulk-bookings/marketplace");
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const acceptBulkBooking = async (bookingId) => {
  try {
    const response = await apiClient.post(`/api/bulk-bookings/accept/${bookingId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getMyBulkRides = async () => {
  try {
    const response = await apiClient.get("/api/bulk-bookings/my-bulk-rides");
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const verifyBulkPayment = async (payload) => {
  try {
    const response = await apiClient.post("/api/bulk-bookings/verify-payment", payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const assignDriverToBulk = async (bookingId, payload) => {
  try {
    const response = await apiClient.post(`/api/bulk-bookings/assign-driver/${bookingId}`, payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
