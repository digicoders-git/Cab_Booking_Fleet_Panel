import apiClient from "./apiClient";

export const notificationApi = {
  // 1. Get My Notifications (Fleet Specific)
  getMyNotifications: async () => {
    const response = await apiClient.get("/api/notifications/my-notifications");
    return response.data;
  },
};
