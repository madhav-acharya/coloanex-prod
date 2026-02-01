import client from "./client";

export interface Transaction {
  id: string;
  walletId: string;
  contractId?: string;
  paymentScheduleId?: string;
  type:
    | "DEPOSIT"
    | "WITHDRAW"
    | "DISBURSEMENT"
    | "INSTALLMENT_PAYMENT"
    | "PENALTY_PAYMENT"
    | "FEE";
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  gatewayDetails?: Record<string, unknown>;
  blockchainTxHash?: string;
  description?: string;
  createdAt: string;
  completedAt?: string;
  wallet?: {
    id: string;
    userId: string;
  };
  contract?: {
    id: string;
    contractNumber: string;
  };
}

export interface CreateTransactionDto {
  walletId: string;
  contractId?: string;
  paymentScheduleId?: string;
  type:
    | "DEPOSIT"
    | "WITHDRAW"
    | "DISBURSEMENT"
    | "INSTALLMENT_PAYMENT"
    | "PENALTY_PAYMENT"
    | "FEE";
  amount: number;
  gatewayDetails?: Record<string, unknown>;
  description?: string;
}

export const transactionsApi = {
  create: async (data: CreateTransactionDto): Promise<Transaction> => {
    const response = await client.post("/transactions", data);
    return response.data;
  },

  getByContract: async (contractId: string): Promise<Transaction[]> => {
    const response = await client.get(`/transactions/contract/${contractId}`);
    return response.data;
  },

  getByWallet: async (walletId: string): Promise<Transaction[]> => {
    const response = await client.get(`/transactions/wallet/${walletId}`);
    return response.data;
  },

  getById: async (id: string): Promise<Transaction> => {
    const response = await client.get(`/transactions/${id}`);
    return response.data;
  },

  updateStatus: async (
    id: string,
    status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED",
  ): Promise<Transaction> => {
    const response = await client.patch(`/transactions/${id}/status`, {
      status,
    });
    return response.data;
  },
};
