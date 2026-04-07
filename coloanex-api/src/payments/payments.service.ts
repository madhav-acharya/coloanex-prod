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
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_GATEWAY_REGISTRY)
    private readonly gatewayRegistry: Map<string, IPaymentGateway>,
    private readonly blockchainService: BlockchainService,
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
        blockchain_tx_hash: existingTransaction.blockchainTxHash,
      };
    }

    const paymentId = randomUUID();

    let blockchain_tx_hash: string | null = null;
    let gasFeeGwei: string | null = null;
    let blockchainExplorerUrl: string | null = null;

    if (this.blockchainService.isEnabled()) {
      this.logger.log(
        `[Payment ${paymentId}] Processing blockchain transaction...`,
      );
      const bcTx = await this.blockchainService.recordPayment(
        paymentId,
        contractId ?? 'no-contract',
        Math.round(Number(totalAmount) * 100),
        gateway,
        verifyResult.gatewayTransactionId ?? transactionUuid,
      );

      if (bcTx) {
        blockchain_tx_hash = bcTx.txHash;
        gasFeeGwei = bcTx.gasFeeGwei;
        blockchainExplorerUrl = bcTx.explorerUrl;
        this.logger.log(
          `[Payment ${paymentId}] Blockchain transaction successful: tx=${bcTx.txHash} gas=${bcTx.gasFeeGwei} GWEI`,
        );
      } else {
        this.logger.error(
          `[Payment ${paymentId}] Blockchain transaction failed`,
        );
        throw new BadRequestException(
          'Blockchain transaction failed. Cannot record payment without blockchain record.',
        );
      }
    } else {
      this.logger.warn(
        `[Payment ${paymentId}] Blockchain disabled, proceeding without chain record`,
      );
    }

    this.logger.log(`[Payment ${paymentId}] Creating database record...`);
    const transaction = await this.prisma.transaction.create({
      data: {
        id: paymentId,
        walletId: resolvedWalletId as string,
        contractId: contractId ?? null,
        paymentScheduleId: paymentScheduleId ?? null,
        type: type as never,
        amount: totalAmount,
        status: 'COMPLETED' as never,
        completedAt: new Date(),
        description: `${gateway} payment verified`,
        blockchainTxHash: blockchain_tx_hash,
        blockchainData: blockchain_tx_hash ? {
          txHash: blockchain_tx_hash,
          gasFeeGwei,
          explorerUrl: blockchainExplorerUrl,
          timestamp: new Date().toISOString(),
          source: 'payment_verification'
        } as any : undefined,
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
        (String(type) === 'INSTALLMENT_PAYMENT' ||
          String(type) === 'PENALTY_PAYMENT') &&
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

            // Note: Lender balance updated but no DEPOSIT transaction created per business requirement
            // Only INSTALLMENT_PAYMENT transaction is stored for the borrower
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
          const scheduleIds = paymentScheduleId.split(',').map(id => id.trim());
          const schedules = await this.prisma.paymentSchedule.findMany({
            where: { id: { in: scheduleIds } },
          });

          const totalScheduleAmount = schedules.reduce((sum, schedule) => sum + Number(schedule.totalAmount), 0);
          const amountPerSchedule = amount / schedules.length;

          for (const schedule of schedules) {
            const newAmountPaid = Number(schedule.amountPaid) + amountPerSchedule;
            const scheduleTotal = Number(schedule.totalAmount);
            const newStatus =
              newAmountPaid >= scheduleTotal
                ? 'PAID'
                : newAmountPaid > 0
                  ? 'PARTIALLY_PAID'
                  : schedule.status;
            await this.prisma.paymentSchedule.update({
              where: { id: schedule.id },
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
      blockchain_tx_hash,
      gasFeeGwei,
      blockchainExplorerUrl,
    };
  }

  async lookupPayment(
    dto: { transactionUuid: string; totalAmount?: number; gateway: string },
    userId: string,
  ) {
    const { transactionUuid, totalAmount, gateway } = dto;

    const paymentGateway = this.resolveGateway(gateway);

    const lookupResult = await paymentGateway.lookupPayment({
      transactionUuid,
      totalAmount,
    });

    const existingTransaction = await this.prisma.transaction.findFirst({
      where: {
        gatewayDetails: {
          path: ['transactionUuid'],
          equals: transactionUuid,
        },
      },
    });

    return {
      status: lookupResult.status,
      gatewayTransactionId: lookupResult.gatewayTransactionId,
      gatewayResponse: lookupResult.gatewayResponse,
      alreadyProcessed: !!existingTransaction,
      transactionId: existingTransaction?.id ?? null,
    };
  }
}
