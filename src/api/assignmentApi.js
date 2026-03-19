import apiClient from "./apiClient";

export const assignmentApi = {
  // 1. Car Assign Karo — Driver ko Car Do
  assignCar: async (driverId, carId) => {
    const response = await apiClient.post("/api/fleet/assignment/assign", { driverId, carId });
    return response.data;
  },

  // 2. Saari Assignments Dekho (Driver + Car)
  getAllAssignments: async () => {
    const response = await apiClient.get("/api/fleet/assignment/all");
    return response.data;
  },

  // 3. Ek Car ka Assignment Status
  getCarAssignmentStatus: async (carId) => {
    const response = await apiClient.get(`/api/fleet/assignment/status/${carId}`);
    return response.data;
  },

  // 4. Car Unassign Karo — Driver se Car Wapas Lo
  unassignCar: async (assignmentId) => {
    const response = await apiClient.put(`/api/fleet/assignment/unassign/${assignmentId}`);
    return response.data;
  },

  // 5. Unassigned History Dekho (Past Assignments)
  getUnassignedHistory: async () => {
    const response = await apiClient.get("/api/fleet/assignment/unassigned");
    return response.data;
  },
};
