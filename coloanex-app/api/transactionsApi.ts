import client from "./client";

export interface Transaction {
  id: string;
  sentBy: string;
  receivedBy: string;
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
  description?: string;
  createdAt: string;
  completedAt?: string;
  contract?: {
    id: string;
    contractNumber: string;
  };
}

export interface CreateTransactionDto {
  sentBy: string;
  receivedBy: string;
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

  getByEntity: async (entityId: string): Promise<Transaction[]> => {
    const response = await client.get(`/transactions/entity/${entityId}`);
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

  getBlockchainHistory: async (id: string): Promise<any> => {
    const response = await client.get(`/transactions/${id}/blockchain-history`);
    return response.data;
  },
};
