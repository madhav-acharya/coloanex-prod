export interface InitiatePaymentParams {
  amount: number;
  transactionUuid: string;
  successUrl: string;
  failureUrl: string;
  tenantConfig?: Record<string, unknown> | null;
}

export interface InitiatePaymentResult {
  paymentUrl: string;
  formData: Record<string, string>;
}

export interface VerifyPaymentParams {
  transactionUuid: string;
  totalAmount: number;
  tenantConfig?: Record<string, unknown> | null;
}

export interface VerifyPaymentResult {
  success: boolean;
  gatewayTransactionId?: string;
  gatewayResponse: Record<string, unknown>;
}

export interface LookupPaymentParams {
  transactionUuid: string;
  totalAmount?: number;
  tenantConfig?: Record<string, unknown> | null;
}

export interface LookupPaymentResult {
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED' | 'EXPIRED';
  gatewayTransactionId?: string;
  gatewayResponse?: Record<string, unknown>;
}

export interface IPaymentGateway {
  readonly key: string;
  initiatePayment(
    params: InitiatePaymentParams,
  ): Promise<InitiatePaymentResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult>;
  lookupPayment(params: LookupPaymentParams): Promise<LookupPaymentResult>;
}

export const PAYMENT_GATEWAY_REGISTRY = 'PAYMENT_GATEWAY_REGISTRY';
