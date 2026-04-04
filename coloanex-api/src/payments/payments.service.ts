import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service';
import type { IPaymentGateway } from './gateways/payment-gateway.interface';
import { PAYMENT_GATEWAY_REGISTRY } from './gateways/payment-gateway.interface';
import type { InitiatePaymentDto } from './dto/initiate-payment.dto';
import type { VerifyPaymentDto } from './dto/verify-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

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

  async initiatePayment(dto: InitiatePaymentDto, userId: string) {
    const { amount, gateway, successUrl, failureUrl, walletId } = dto;

    let resolvedWalletId = walletId;
    const wallet = walletId
      ? await this.prisma.wallet.findUnique({ where: { id: walletId } })
      : null;

    if (!wallet) {
      const existing = await this.prisma.wallet.findFirst({
        where: { userId },
      });
      if (existing) {
        resolvedWalletId = existing.id;
      } else {
        const created = await this.prisma.wallet.create({
          data: { userId, balance: 0, paymentGatewayLinks: {} },
        });
        resolvedWalletId = created.id;
      }
    }

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
      walletId: resolvedWalletId,
    };
  }

  async verifyPayment(dto: VerifyPaymentDto, userId: string) {
    const {
      transactionUuid,
      totalAmount,
      gateway,
      walletId,
      type,
      contractId,
      paymentScheduleId,
    } = dto;

    let resolvedWalletId = walletId;
    const wallet = walletId
      ? await this.prisma.wallet.findUnique({ where: { id: walletId } })
      : null;

    if (!wallet) {
      const existing = await this.prisma.wallet.findFirst({
        where: { userId },
      });
      if (existing) {
        resolvedWalletId = existing.id;
      } else {
        const created = await this.prisma.wallet.create({
          data: { userId, balance: 0, paymentGatewayLinks: {} },
        });
        resolvedWalletId = created.id;
      }
    }

    const paymentGateway = this.resolveGateway(gateway);

    const verifyResult = await paymentGateway.verifyPayment({
      transactionUuid,
      totalAmount,
    });

    if (!verifyResult.success) {
      return { success: false, transactionId: null, status: 'FAILED' };
    }

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
        walletId: resolvedWalletId as string,
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
        where: { id: resolvedWalletId },
        data: { balance: { decrement: amount } },
      });

      if (
        (type === 'INSTALLMENT_PAYMENT' || type === 'PENALTY_PAYMENT') &&
        contractId
      ) {
        const contract = await this.prisma.contract.findUnique({
          where: { id: contractId },
          include: { tenant: { select: { ownerUserId: true } } },
        });

        if (contract?.tenant?.ownerUserId) {
          const lenderWallet = await this.prisma.wallet.findFirst({
            where: { userId: contract.tenant.ownerUserId },
          });

          if (lenderWallet) {
            await this.prisma.wallet.update({
              where: { id: lenderWallet.id },
              data: { balance: { increment: amount } },
            });

            await this.prisma.transaction.create({
              data: {
                walletId: lenderWallet.id,
                contractId: contractId ?? null,
                paymentScheduleId: paymentScheduleId ?? null,
                type: 'DISBURSEMENT' as never,
                amount: totalAmount,
                status: 'COMPLETED' as never,
                completedAt: new Date(),
                description: `Repayment received from borrower via ${gateway}`,
                gatewayDetails: {
                  gateway,
                  transactionUuid,
                  gatewayTransactionId: verifyResult.gatewayTransactionId,
                } as never,
              },
            });
          }
        }

        await this.prisma.contract.update({
          where: { id: contractId },
          data: {
            totalAmountPaid: { increment: amount },
            outstandingBalance: { decrement: amount },
          },
        });

        if (paymentScheduleId) {
          const schedule = await this.prisma.paymentSchedule.findUnique({
            where: { id: paymentScheduleId },
          });
          if (schedule) {
            const newAmountPaid = Number(schedule.amountPaid) + amount;
            const scheduleTotal = Number(schedule.totalAmount);
            const newStatus =
              newAmountPaid >= scheduleTotal
                ? 'PAID'
                : newAmountPaid > 0
                  ? 'PARTIALLY_PAID'
                  : schedule.status;
            await this.prisma.paymentSchedule.update({
              where: { id: paymentScheduleId },
              data: {
                amountPaid: newAmountPaid,
                status: newStatus as never,
                ...(newAmountPaid >= scheduleTotal
                  ? { paidAt: new Date() }
                  : {}),
              },
            });
          }
        }
      }
    } else if (isCredit) {
      await this.prisma.wallet.update({
        where: { id: resolvedWalletId },
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
