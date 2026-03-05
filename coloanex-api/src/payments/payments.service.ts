import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service';
import type { IPaymentGateway } from './gateways/payment-gateway.interface';
import { PAYMENT_GATEWAY_REGISTRY } from './gateways/payment-gateway.interface';
import type { InitiatePaymentDto } from './dto/initiate-payment.dto';
import type { VerifyPaymentDto } from './dto/verify-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_GATEWAY_REGISTRY)
    private readonly gatewayRegistry: Map<string, IPaymentGateway>,
  ) {}

  private resolveGateway(gateway: string): IPaymentGateway {
    const instance = this.gatewayRegistry.get(gateway.toUpperCase());
    if (!instance) {
      throw new BadRequestException(
        `Payment gateway "${gateway}" is not supported`,
      );
    }
    return instance;
  }

  async initiatePayment(dto: InitiatePaymentDto) {
    const { amount, gateway, successUrl, failureUrl } = dto;

    const paymentGateway = this.resolveGateway(gateway);
    const transactionUuid = randomUUID();

    const result = await paymentGateway.initiatePayment({
      amount,
      transactionUuid,
      successUrl,
      failureUrl,
    });

    return {
      transactionUuid,
      paymentUrl: result.paymentUrl,
      formData: result.formData,
    };
  }

  async verifyPayment(dto: VerifyPaymentDto) {
    const {
      transactionUuid,
      totalAmount,
      gateway,
      walletId,
      type,
      contractId,
      paymentScheduleId,
    } = dto;

    const paymentGateway = this.resolveGateway(gateway);

    const verifyResult = await paymentGateway.verifyPayment({
      transactionUuid,
      totalAmount,
    });

    if (!verifyResult.success) {
      return { success: false, transactionId: null, status: 'FAILED' };
    }

    // Prevent duplicate transactions if this UUID was already verified
    const existingTransaction = await this.prisma.transaction.findFirst({
      where: {
        gatewayDetails: {
          path: ['transactionUuid'],
          equals: transactionUuid,
        },
      },
    });

    if (existingTransaction) {
      return {
        success: true,
        transactionId: existingTransaction.id,
        status: 'COMPLETED',
      };
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        walletId,
        contractId: contractId ?? null,
        paymentScheduleId: paymentScheduleId ?? null,
        type: type as never,
        amount: totalAmount,
        status: 'COMPLETED' as never,
        completedAt: new Date(),
        description: `${gateway} payment verified`,
        gatewayDetails: {
          gateway,
          transactionUuid,
          gatewayTransactionId: verifyResult.gatewayTransactionId,
          gatewayResponse: verifyResult.gatewayResponse,
        } as never,
      },
    });

    const amount = Number(totalAmount);
    const isDebit = [
      'WITHDRAW',
      'INSTALLMENT_PAYMENT',
      'PENALTY_PAYMENT',
      'FEE',
    ].includes(type as string);
    const isCredit = ['DEPOSIT', 'DISBURSEMENT'].includes(type as string);

    if (isDebit) {
      await this.prisma.wallet.update({
        where: { id: walletId },
        data: { balance: { decrement: amount } },
      });
    } else if (isCredit) {
      await this.prisma.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: amount } },
      });
    }

    return {
      success: true,
      transactionId: transaction.id,
      status: 'COMPLETED',
    };
  }
}
