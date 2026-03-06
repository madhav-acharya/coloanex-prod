import { baseApi } from "./baseApi";

export interface PaymentSchedule {
  id: string;
  contractId: string;
  installmentNumber: number;
  dueDate: string;
  dueAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "PENDING" | "PAID" | "OVERDUE" | "PARTIALLY_PAID";
  paidAt?: string;
  paymentTransactionId?: string;
  createdAt: string;
  updatedAt: string;
  contract?: {
    id: string;
    contractNumber: string;
    borrowerId: string;
    tenantId: string;
  };
}

export const paymentSchedulesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentSchedulesByContract: builder.query<PaymentSchedule[], string>({
      query: (contractId) => `/payment-schedules/contract/${contractId}`,
    }),
    getPaymentSchedule: builder.query<PaymentSchedule, string>({
      query: (id) => `/payment-schedules/${id}`,
    }),
  }),
});

export const {
  useGetPaymentSchedulesByContractQuery,
  useGetPaymentScheduleQuery,
} = paymentSchedulesApi;
