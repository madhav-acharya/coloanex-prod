import client from "./client";

export interface Wallet {
  id: string;
  userId: string;
  provider: "METAMASK" | "EXPO_SECURE";
  platform: "WEB" | "APP";
  address: string;
  label?: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const walletsApi = {
  listMine: async (): Promise<Wallet[]> => {
    const response = await client.get("/wallets/me");
    return response.data;
  },

  create: async (data: {
    provider: "METAMASK" | "EXPO_SECURE";
    platform: "WEB" | "APP";
    address: string;
    label?: string;
  }): Promise<Wallet> => {
    const response = await client.post("/wallets", data);
    return response.data;
  },

  setPrimary: async (id: string): Promise<Wallet> => {
    const response = await client.patch(`/wallets/${id}/primary`);
    return response.data;
  },

  remove: async (id: string): Promise<{ message: string }> => {
    const response = await client.delete(`/wallets/${id}`);
    return response.data;
  },

  updateGasMode: async (
    gasPaymentMode: "USER_WALLET" | "PLATFORM_WALLET",
    platform: "WEB" | "APP" = "APP",
  ): Promise<{
    id: string;
    gasPaymentMode: "USER_WALLET" | "PLATFORM_WALLET";
  }> => {
    const response = await client.patch("/wallets/gas-mode", {
      gasPaymentMode,
      platform,
    });
    return response.data;
  },
};
