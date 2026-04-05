import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

export const getBlockchainEnabled = async (): Promise<{ enabled: boolean }> => {
  const response = await axios.get(`${API_URL}/blockchain/enabled`);
  return response.data;
};
