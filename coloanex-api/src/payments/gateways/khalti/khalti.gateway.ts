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
    const { amount, transactionUuid, successUrl, failureUrl: _failureUrl } = params;

    const websiteUrl = successUrl.startsWith('http')
      ? new URL(successUrl).origin
      : process.env.KHALTI_WEBSITE_URL!;

    const body = {
      return_url: successUrl,
      website_url: websiteUrl,
      amount: Math.round(amount * 100),
      purchase_order_id: transactionUuid,
      purchase_order_name: `Payment-${transactionUuid}`,
    };

    let response: Response;
    let data: Record<string, unknown>;

    try {
      response = await fetch(this.paymentUrl, {
        method: 'POST',
        headers: {
          Authorization: `Key ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      data = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        if (response.status === 401) {
          throw new InternalServerErrorException(
            'Khalti authentication failed. Please check your API credentials.',
          );
        } else {
          throw new InternalServerErrorException(
            `Khalti payment initiation failed with status ${response.status}`,
          );
        }
      }

      if (!data['payment_url']) {
        throw new InternalServerErrorException(
          'Khalti response missing payment_url',
        );
      }

      return {
        paymentUrl: data['payment_url'] as string,
        formData: {
          pidx: data['pidx'] as string,
        },
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to reach Khalti payment service: ${error || 'Unknown error'}`,
      );
    }
  }

  async verifyPayment(
    params: VerifyPaymentParams,
  ): Promise<VerifyPaymentResult> {
    const { transactionUuid } = params;

    let response: Response;
    let data: Record<string, unknown>;

    try {
      response = await fetch(this.verificationUrl, {
        method: 'POST',
        headers: {
          Authorization: `Key ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pidx: transactionUuid }),
      });

      data = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        if (response.status === 401) {
          throw new InternalServerErrorException(
            'Khalti verification failed - Invalid authentication. Please check your API credentials.',
          );
        } else {
          throw new InternalServerErrorException(
            `Khalti verification failed with status ${response.status}`,
          );
        }
      }

      return {
        success: data['status'] === 'Completed',
        gatewayTransactionId: data['transaction_id'] as string | undefined,
        gatewayResponse: data,
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to verify payment with Khalti: ${error || 'Network error'}`,
      );
    }
  }
}
