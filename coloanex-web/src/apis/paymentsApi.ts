import { baseApi } from "./baseApi";

export type PaymentGateway = "ESEWA" | "FONEPAY" | "KHALTI";
export type TransactionType =
  | "DEPOSIT"
  | "WITHDRAW"
  | "INSTALLMENT_PAYMENT"
  | "PENALTY_PAYMENT"
  | "FEE";

export interface InitiatePaymentPayload {
  walletId: string;
  contractId?: string;
  paymentScheduleId?: string;
  amount: number;
  type: TransactionType;
  gateway: PaymentGateway;
  successUrl: string;
  failureUrl: string;
}

export interface InitiatePaymentResult {
  transactionId: string;
  transactionUuid: string;
  paymentUrl: string;
  formData: Record<string, string>;
}

export interface VerifyPaymentPayload {
  transactionId: string;
  transactionUuid: string;
  totalAmount?: number;
}

export interface VerifyPaymentResult {
  success: boolean;
  transactionId: string;
  status: "COMPLETED" | "FAILED";
}

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    initiatePayment: builder.mutation<
      InitiatePaymentResult,
      InitiatePaymentPayload
    >({
      query: (data) => ({
        url: "/payments/initiate",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Transactions"],
    }),
    verifyPayment: builder.mutation<VerifyPaymentResult, VerifyPaymentPayload>({
      query: (data) => ({
        url: "/payments/verify",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Transactions", "Wallets"],
    }),
  }),
});

export const { useInitiatePaymentMutation, useVerifyPaymentMutation } =
  paymentsApi;
