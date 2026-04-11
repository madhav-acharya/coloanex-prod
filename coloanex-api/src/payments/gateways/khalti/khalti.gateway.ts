import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type {
  IPaymentGateway,
  InitiatePaymentParams,
  InitiatePaymentResult,
  VerifyPaymentParams,
  VerifyPaymentResult,
  LookupPaymentParams,
  LookupPaymentResult,
} from '../payment-gateway.interface';

@Injectable()
export class KhaltiGateway implements IPaymentGateway {
  readonly key = 'KHALTI';

  constructor() {}

  private getConfig(tenantConfig?: Record<string, unknown> | null) {
    return {
      secretKey:
        (tenantConfig?.secretKey as string | undefined) ||
        process.env.KHALTI_SECRET_KEY!,
      paymentUrl:
        (tenantConfig?.paymentUrl as string | undefined) ||
        process.env.KHALTI_PAYMENT_URL!,
      verificationUrl:
        (tenantConfig?.verificationUrl as string | undefined) ||
        process.env.KHALTI_VERIFICATION_URL!,
    };
  }

  async initiatePayment(
    params: InitiatePaymentParams,
  ): Promise<InitiatePaymentResult> {
    const {
      amount,
      transactionUuid,
      successUrl,
      failureUrl: _failureUrl,
      tenantConfig,
    } = params;

    const { secretKey, paymentUrl } = this.getConfig(tenantConfig);

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
      response = await fetch(paymentUrl, {
        method: 'POST',
        headers: {
          Authorization: `Key ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      data = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        console.error('Khalti API Error:', {
          status: response.status,
          statusText: response.statusText,
          response: data,
          requestBody: body,
        });

        if (response.status === 401) {
          throw new InternalServerErrorException(
            'Khalti authentication failed. Please check your API credentials.',
          );
        } else {
          const errorMessage =
            data['detail'] ||
            data['message'] ||
            `Khalti payment initiation failed with status ${response.status}`;
          throw new InternalServerErrorException(errorMessage as string);
        }
      }

      if (!data['payment_url']) {
        console.error('Khalti response missing payment_url:', data);
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

      console.error('Khalti payment initiation error:', error);
      throw new InternalServerErrorException(
        `Failed to reach Khalti payment service: ${error || 'Unknown error'}`,
      );
    }
  }

  async verifyPayment(
    params: VerifyPaymentParams,
  ): Promise<VerifyPaymentResult> {
    const { transactionUuid, tenantConfig } = params;
    const { secretKey, verificationUrl } = this.getConfig(tenantConfig);

    let response: Response;
    let data: Record<string, unknown>;

    try {
      response = await fetch(verificationUrl, {
        method: 'POST',
        headers: {
          Authorization: `Key ${secretKey}`,
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

  async lookupPayment(
    params: LookupPaymentParams,
  ): Promise<LookupPaymentResult> {
    const { transactionUuid, tenantConfig } = params;
    const { secretKey, verificationUrl } = this.getConfig(tenantConfig);

    let response: Response;
    let data: Record<string, unknown>;

    try {
      response = await fetch(verificationUrl, {
        method: 'POST',
        headers: {
          Authorization: `Key ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pidx: transactionUuid }),
      });

      data = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        if (response.status === 404) {
          return {
            status: 'FAILED',
            gatewayResponse: data,
          };
        }
        if (response.status === 401) {
          throw new InternalServerErrorException(
            'Khalti lookup failed - Invalid authentication.',
          );
        }
        throw new InternalServerErrorException(
          `Khalti lookup failed with status ${response.status}`,
        );
      }

      const khaltiStatus = data['status'] as string;
      let mappedStatus: LookupPaymentResult['status'];

      switch (khaltiStatus) {
        case 'Completed':
          mappedStatus = 'COMPLETED';
          break;
        case 'Pending':
        case 'Initiated':
          mappedStatus = 'PENDING';
          break;
        case 'Refunded':
          mappedStatus = 'REFUNDED';
          break;
        case 'Expired':
        case 'User canceled':
          mappedStatus = 'EXPIRED';
          break;
        default:
          mappedStatus = 'FAILED';
      }

      return {
        status: mappedStatus,
        gatewayTransactionId: data['transaction_id'] as string | undefined,
        gatewayResponse: data,
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to lookup payment with Khalti: ${error || 'Network error'}`,
      );
    }
  }
}
