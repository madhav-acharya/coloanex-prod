import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';
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
export class EsewaGateway implements IPaymentGateway {
  readonly key = 'ESEWA';

  constructor() {}

  private getConfig(tenantConfig?: Record<string, unknown> | null) {
    return {
      merchantId:
        (tenantConfig?.merchantId as string | undefined) ||
        process.env.ESEWA_MERCHANT_ID!,
      secret:
        (tenantConfig?.secretKey as string | undefined) ||
        process.env.ESEWA_SECRET!,
      paymentUrl:
        (tenantConfig?.paymentUrl as string | undefined) ||
        process.env.ESEWA_PAYMENT_URL!,
      statusCheckUrl:
        (tenantConfig?.statusCheckUrl as string | undefined) ||
        process.env.ESEWA_PAYMENT_STATUS_CHECK_URL!,
    };
  }

  private computeSignature(message: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(message).digest('base64');
  }

  async initiatePayment(
    params: InitiatePaymentParams,
  ): Promise<InitiatePaymentResult> {
    const { amount, transactionUuid, successUrl, failureUrl, tenantConfig } =
      params;
    const { merchantId, secret, paymentUrl } = this.getConfig(tenantConfig);

    const signedFieldNames = 'total_amount,transaction_uuid,product_code';
    const message = `total_amount=${amount},transaction_uuid=${transactionUuid},product_code=${merchantId}`;
    const signature = this.computeSignature(message, secret);

    return Promise.resolve({
      paymentUrl,
      formData: {
        amount: String(amount),
        tax_amount: '0',
        total_amount: String(amount),
        transaction_uuid: transactionUuid,
        product_code: merchantId,
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
    const { transactionUuid, totalAmount, tenantConfig } = params;
    const { merchantId, statusCheckUrl } = this.getConfig(tenantConfig);

    const url =
      `${statusCheckUrl}?product_code=${encodeURIComponent(merchantId)}` +
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

  async lookupPayment(
    params: LookupPaymentParams,
  ): Promise<LookupPaymentResult> {
    const { transactionUuid, totalAmount, tenantConfig } = params;
    const { merchantId, statusCheckUrl } = this.getConfig(tenantConfig);

    if (!totalAmount) {
      throw new InternalServerErrorException(
        'totalAmount is required for eSewa lookup',
      );
    }

    const url =
      `${statusCheckUrl}?product_code=${encodeURIComponent(merchantId)}` +
      `&total_amount=${totalAmount}` +
      `&transaction_uuid=${encodeURIComponent(transactionUuid)}`;

    let data: Record<string, unknown>;

    try {
      const response = await fetch(url);
      data = (await response.json()) as Record<string, unknown>;

      const esewaStatus = data['status'] as string;
      let mappedStatus: LookupPaymentResult['status'];

      switch (esewaStatus) {
        case 'COMPLETE':
          mappedStatus = 'COMPLETED';
          break;
        case 'PENDING':
        case 'INITIATED':
          mappedStatus = 'PENDING';
          break;
        case 'REFUNDED':
          mappedStatus = 'REFUNDED';
          break;
        case 'EXPIRED':
        case 'CANCELED':
          mappedStatus = 'EXPIRED';
          break;
        default:
          mappedStatus = 'FAILED';
      }

      return {
        status: mappedStatus,
        gatewayTransactionId: data['ref_id'] as string | undefined,
        gatewayResponse: data,
      };
    } catch {
      throw new InternalServerErrorException(
        'Failed to reach eSewa lookup service',
      );
    }
  }
}
