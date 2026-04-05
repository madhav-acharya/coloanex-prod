export interface InitiatePaymentParams {
  amount: number;
  transactionUuid: string;
  successUrl: string;
  failureUrl: string;
}

export interface InitiatePaymentResult {
  paymentUrl: string;
  formData: Record<string, string>;
}

export interface VerifyPaymentParams {
  transactionUuid: string;
  totalAmount: number;
}

export interface VerifyPaymentResult {
  success: boolean;
  gatewayTransactionId?: string;
  gatewayResponse: Record<string, unknown>;
}

export interface IPaymentGateway {
  readonly key: string;
  initiatePayment(
    params: InitiatePaymentParams,
  ): Promise<InitiatePaymentResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult>;
}

export const PAYMENT_GATEWAY_REGISTRY = 'PAYMENT_GATEWAY_REGISTRY';
