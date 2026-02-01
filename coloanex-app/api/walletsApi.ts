import client from "./client";

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  pendingBalance: number;
  paymentGatewayLinks?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface CreateWalletDto {
  paymentGatewayLinks?: Record<string, unknown>;
}

export const walletsApi = {
  create: async (data: CreateWalletDto): Promise<Wallet> => {
    const response = await client.post("/wallets", data);
    return response.data;
  },

  getMyWallet: async (): Promise<Wallet> => {
    const response = await client.get("/wallets/my-wallet");
    return response.data;
  },

  getByUser: async (userId: string): Promise<Wallet> => {
    const response = await client.get(`/wallets/user/${userId}`);
    return response.data;
  },

  getById: async (id: string): Promise<Wallet> => {
    const response = await client.get(`/wallets/${id}`);
    return response.data;
  },

  updateBalance: async (id: string, amount: number): Promise<Wallet> => {
    const response = await client.patch(`/wallets/${id}/balance`, { amount });
    return response.data;
  },
};
