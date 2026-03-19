import apiClient from "./apiClient";

export const walletApi = {
  // 1. Get Fleet Wallet Data (Balance, Total Earnings, Transactions)
  getFleetWallet: async () => {
    const response = await apiClient.get("/api/wallet/fleet");
    return response.data;
  },

  // 2. Get Transaction History
  getTransactions: async () => {
    const response = await apiClient.get("/api/wallet/fleet/transactions");
    return response.data;
  },

  // 3. Submit Withdrawal Request
  withdraw: async (data) => {
    const response = await apiClient.post("/api/wallet/fleet/withdraw", data);
    return response.data;
  },
};
