import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type {
  IPaymentGateway,
  InitiatePaymentParams,
  InitiatePaymentResult,
  VerifyPaymentParams,
  VerifyPaymentResult,
} from '../payment-gateway.interface';

@Injectable()
export class KhaltiGateway implements IPaymentGateway {
  readonly key = 'KHALTI';

  private readonly secretKey: string;
  private readonly paymentUrl: string;
  private readonly verificationUrl: string;

  constructor() {
    this.secretKey = process.env.KHALTI_SECRET_KEY!;
    this.paymentUrl = process.env.KHALTI_PAYMENT_URL!;
    this.verificationUrl = process.env.KHALTI_VERIFICATION_URL!;
  }

  async initiatePayment(
    params: InitiatePaymentParams,
  ): Promise<InitiatePaymentResult> {
    const { amount, transactionUuid, successUrl, failureUrl } = params;

    const websiteUrl = successUrl.startsWith('http')
      ? new URL(successUrl).origin
      : (process.env.KHALTI_WEBSITE_URL ??
        process.env.API_BASE_URL ??
        'http://localhost:3000');

    const body = {
      return_url: successUrl,
      website_url: websiteUrl,
      amount: Math.round(amount * 100),
      purchase_order_id: transactionUuid,
      purchase_order_name: `Payment-${transactionUuid}`,
    };

    let data: Record<string, unknown>;

    try {
      const response = await fetch(this.paymentUrl, {
        method: 'POST',
        headers: {
          Authorization: `Key ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      throw new InternalServerErrorException(
        'Failed to reach Khalti payment service',
      );
    }

    if (!data['payment_url']) {
      throw new InternalServerErrorException(
        `Khalti initiation failed: ${JSON.stringify(data)}`,
      );
    }

    return {
      paymentUrl: data['payment_url'] as string,
      formData: {
        pidx: data['pidx'] as string,
      },
    };
  }

  async verifyPayment(
    params: VerifyPaymentParams,
  ): Promise<VerifyPaymentResult> {
    const { transactionUuid } = params;

    let data: Record<string, unknown>;

    try {
      const response = await fetch(this.verificationUrl, {
        method: 'POST',
        headers: {
          Authorization: `Key ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pidx: transactionUuid }),
      });
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      throw new InternalServerErrorException(
        'Failed to reach Khalti verification service',
      );
    }

    return {
      success: data['status'] === 'Completed',
      gatewayTransactionId: data['transaction_id'] as string | undefined,
      gatewayResponse: data,
    };
  }
}
