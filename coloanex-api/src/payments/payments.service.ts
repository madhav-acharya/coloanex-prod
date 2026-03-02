import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
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
    const {
      walletId,
      contractId,
      paymentScheduleId,
      amount,
      type,
      gateway,
      successUrl,
      failureUrl,
    } = dto;

    const paymentGateway = this.resolveGateway(gateway);
    const transactionUuid = randomUUID();

    const transaction = await this.prisma.transaction.create({
      data: {
        walletId,
        contractId: contractId ?? null,
        paymentScheduleId: paymentScheduleId ?? null,
        type: type as never,
        amount,
        status: 'PENDING' as never,
        description: `${gateway} payment initiated`,
        gatewayDetails: { gateway, transactionUuid } as never,
      },
    });

    const result = await paymentGateway.initiatePayment({
      amount,
      transactionUuid,
      successUrl,
      failureUrl,
    });

    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        gatewayDetails: {
          gateway,
          transactionUuid,
          ...result.formData,
        } as never,
      },
    });

    return {
      transactionId: transaction.id,
      transactionUuid,
      paymentUrl: result.paymentUrl,
      formData: result.formData,
    };
  }

  async verifyPayment(dto: VerifyPaymentDto) {
    const { transactionId, transactionUuid, totalAmount } = dto;

    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const gatewayDetails = transaction.gatewayDetails as Record<
      string,
      unknown
    >;
    const gateway = (gatewayDetails?.gateway as string) ?? 'ESEWA';

    const paymentGateway = this.resolveGateway(gateway);

    const verifyResult = await paymentGateway.verifyPayment({
      transactionUuid,
      totalAmount: totalAmount ?? Number(transaction.amount),
    });

    const newStatus = verifyResult.success ? 'COMPLETED' : 'FAILED';

    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: newStatus as never,
        completedAt: verifyResult.success ? new Date() : null,
        gatewayDetails: {
          ...gatewayDetails,
          gatewayTransactionId: verifyResult.gatewayTransactionId,
          gatewayResponse: verifyResult.gatewayResponse,
        } as never,
      },
    });

    if (verifyResult.success && transaction.walletId) {
      const amount = Number(transaction.amount);
      const isDebit = [
        'WITHDRAW',
        'INSTALLMENT_PAYMENT',
        'PENALTY_PAYMENT',
        'FEE',
      ].includes(transaction.type as string);
      const isCredit = ['DEPOSIT', 'DISBURSEMENT'].includes(
        transaction.type as string,
      );

      if (isDebit) {
        await this.prisma.wallet.update({
          where: { id: transaction.walletId },
          data: { balance: { decrement: amount } },
        });
      } else if (isCredit) {
        await this.prisma.wallet.update({
          where: { id: transaction.walletId },
          data: { balance: { increment: amount } },
        });
      }
    }

    return {
      success: verifyResult.success,
      transactionId,
      status: newStatus,
    };
  }
}
