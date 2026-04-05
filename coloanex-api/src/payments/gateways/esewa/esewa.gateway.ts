import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';
import type {
  IPaymentGateway,
  InitiatePaymentParams,
  InitiatePaymentResult,
  VerifyPaymentParams,
  VerifyPaymentResult,
} from '../payment-gateway.interface';

@Injectable()
export class EsewaGateway implements IPaymentGateway {
  readonly key = 'ESEWA';

  private readonly merchantId: string;
  private readonly secret: string;
  private readonly paymentUrl: string;
  private readonly statusCheckUrl: string;

  constructor() {
    this.merchantId = process.env.ESEWA_MERCHANT_ID!;
    this.secret = process.env.ESEWA_SECRET!;
    this.paymentUrl = process.env.ESEWA_PAYMENT_URL!;
    this.statusCheckUrl = process.env.ESEWA_PAYMENT_STATUS_CHECK_URL!;
  }

  private computeSignature(message: string): string {
    return crypto
      .createHmac('sha256', this.secret)
      .update(message)
      .digest('base64');
  }

  async initiatePayment(
    params: InitiatePaymentParams,
  ): Promise<InitiatePaymentResult> {
    const { amount, transactionUuid, successUrl, failureUrl } = params;

    const signedFieldNames = 'total_amount,transaction_uuid,product_code';
    const message = `total_amount=${amount},transaction_uuid=${transactionUuid},product_code=${this.merchantId}`;
    const signature = this.computeSignature(message);

    return Promise.resolve({
      paymentUrl: this.paymentUrl,
      formData: {
        amount: String(amount),
        tax_amount: '0',
        total_amount: String(amount),
        transaction_uuid: transactionUuid,
        product_code: this.merchantId,
        product_service_charge: '0',
        product_delivery_charge: '0',
        success_url: successUrl,
        failure_url: failureUrl,
        signed_field_names: signedFieldNames,
        signature,
      },
    });
  }

  async verifyPayment(
    params: VerifyPaymentParams,
  ): Promise<VerifyPaymentResult> {
    const { transactionUuid, totalAmount } = params;

    const url =
      `${this.statusCheckUrl}?product_code=${encodeURIComponent(this.merchantId)}` +
      `&total_amount=${totalAmount}` +
      `&transaction_uuid=${encodeURIComponent(transactionUuid)}`;

    let data: Record<string, unknown>;

    try {
      const response = await fetch(url);
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      throw new InternalServerErrorException(
        'Failed to reach eSewa verification service',
      );
    }

    return {
      success: data['status'] === 'COMPLETE',
      gatewayTransactionId: data['ref_id'] as string | undefined,
      gatewayResponse: data,
    };
  }
}
