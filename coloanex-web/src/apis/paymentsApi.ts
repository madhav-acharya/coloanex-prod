import { baseApi } from "./baseApi";

export type PaymentGateway = "ESEWA" | "FONEPAY" | "KHALTI";
export type TransactionType =
  | "DEPOSIT"
  | "WITHDRAW"
  | "DISBURSEMENT"
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
  transactionUuid: string;
  paymentUrl: string;
  formData: Record<string, string>;
  walletId: string;
}

export interface VerifyPaymentPayload {
  transactionUuid: string;
  totalAmount: number;
  gateway: PaymentGateway;
  walletId: string;
  type: TransactionType;
  contractId?: string;
  paymentScheduleId?: string;
}

export interface VerifyPaymentResult {
  success: boolean;
  transactionId: string | null;
  status: "COMPLETED" | "FAILED";
}

export interface LookupPaymentPayload {
  transactionUuid: string;
  totalAmount?: number;
  gateway: PaymentGateway;
}

export interface LookupPaymentResult {
  status: "COMPLETED" | "PENDING" | "FAILED" | "REFUNDED" | "EXPIRED";
  gatewayTransactionId?: string;
  gatewayResponse?: Record<string, unknown>;
  alreadyProcessed: boolean;
  transactionId: string | null;
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
    }),
    verifyPayment: builder.mutation<VerifyPaymentResult, VerifyPaymentPayload>({
      query: (data) => ({
        url: "/payments/verify",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Transactions", "Wallets"],
    }),
    lookupPayment: builder.mutation<LookupPaymentResult, LookupPaymentPayload>({
      query: (data) => ({
        url: "/payments/lookup",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useInitiatePaymentMutation,
  useVerifyPaymentMutation,
  useLookupPaymentMutation,
} = paymentsApi;
