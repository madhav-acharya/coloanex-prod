import client from "./client";

export interface PaymentSchedule {
  id: string;
  contractId: string;
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  status: "PENDING" | "PAID" | "OVERDUE" | "PARTIALLY_PAID";
  amountPaid: number;
  penaltyAmount: number;
  paidAt?: string;
  paymentDetails?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  contract?: {
    id: string;
    contractNumber: string;
    borrowerId: string;
    tenantId: string;
  };
}

export const paymentSchedulesApi = {
  getByContract: async (contractId: string): Promise<PaymentSchedule[]> => {
    const response = await client.get(
      `/payment-schedules/contract/${contractId}`,
    );
    return response.data;
  },

  getById: async (id: string): Promise<PaymentSchedule> => {
    const response = await client.get(`/payment-schedules/${id}`);
    return response.data;
  },
};
