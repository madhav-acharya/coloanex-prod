import client from "./client";

export type PaymentGateway = "ESEWA" | "KHALTI";

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

export const paymentsApi = {
  initiatePayment: async (
    payload: InitiatePaymentPayload,
  ): Promise<InitiatePaymentResult> => {
    const { data } = await client.post("/payments/initiate", payload);
    return data;
  },

  verifyPayment: async (
    payload: VerifyPaymentPayload,
  ): Promise<VerifyPaymentResult> => {
    const { data } = await client.post("/payments/verify", payload);
    return data;
  },
};
