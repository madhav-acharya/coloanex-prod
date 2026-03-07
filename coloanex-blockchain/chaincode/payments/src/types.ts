export interface PaymentAsset {
  docType: "payment";
  id: string;
  contractId: string;
  borrowerId: string;
  tenantId: string;
  amount: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  paymentDate: string;
  reference: string;
  gatewayTransactionId: string | null;
  installmentNumbers: number[];
  penaltyAmount: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = "ESEWA" | "KHALTI" | "WALLET" | "BANK_TRANSFER";

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface PaymentStatusTransition {
  from: PaymentStatus[];
  to: PaymentStatus;
}

export const PAYMENT_STATUS_TRANSITIONS: PaymentStatusTransition[] = [
  { from: ["PENDING"], to: "COMPLETED" },
  { from: ["PENDING"], to: "FAILED" },
  { from: ["COMPLETED"], to: "REFUNDED" },
];
