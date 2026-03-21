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
import { PaymentBlockchainService } from '../blockchain/services/payment.blockchain.service';
import { ContractBlockchainService } from '../blockchain/services/contract.blockchain.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_GATEWAY_REGISTRY)
    private readonly gatewayRegistry: Map<string, IPaymentGateway>,
    private readonly paymentBlockchainService: PaymentBlockchainService,
    private readonly contractBlockchainService: ContractBlockchainService,
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

    if (contractId) {
      const contractData = await this.prisma.contract.findUnique({
        where: { id: contractId },
        select: { borrowerId: true, tenantId: true },
      });

      if (contractData) {
        if (type === 'INSTALLMENT_PAYMENT' || type === 'PENALTY_PAYMENT') {
          const installmentNumber = paymentScheduleId
            ? await this.prisma.paymentSchedule
                .findUnique({
                  where: { id: paymentScheduleId },
                  select: { installmentNumber: true },
                })
                .then((s) => (s ? [s.installmentNumber] : []))
            : [];

          this.paymentBlockchainService
            .recordPayment(
              transaction.id,
              contractId,
              contractData.borrowerId,
              contractData.tenantId,
              totalAmount.toString(),
              gateway,
              transactionUuid,
              installmentNumber,
              '0',
            )
            .then((result) => {
              if (result?.txId) {
                return this.prisma.transaction.update({
                  where: { id: transaction.id },
                  data: { blockchainTxHash: result.txId },
                });
              }
            })
            .catch((err) =>
              this.logger.error(
                `Blockchain recordPayment failed [${transaction.id}]`,
                err,
              ),
            );

          this.contractBlockchainService
            .updatePaymentBalance(contractId, totalAmount.toString())
            .catch((err) =>
              this.logger.error(
                `Blockchain updatePaymentBalance failed [${contractId}]`,
                err,
              ),
            );
        } else if (type === 'DISBURSEMENT') {
          this.paymentBlockchainService
            .recordPayment(
              transaction.id,
              contractId,
              contractData.borrowerId,
              contractData.tenantId,
              totalAmount.toString(),
              gateway,
              transactionUuid,
              [],
              '1',
            )
            .then((result) => {
              if (result?.txId) {
                return this.prisma.transaction.update({
                  where: { id: transaction.id },
                  data: { blockchainTxHash: result.txId },
                });
              }
            })
            .catch((err) =>
              this.logger.error(
                `Blockchain recordPayment failed [${transaction.id}]`,
                err,
              ),
            );

          this.contractBlockchainService
            .updatePaymentBalance(contractId, totalAmount.toString())
            .catch((err) =>
              this.logger.error(
                `Blockchain updatePaymentBalance failed [${contractId}]`,
                err,
              ),
            );
        }
      }
    }

    return {
      success: true,
      transactionId: transaction.id,
      status: 'COMPLETED',
    };
  }

  async verifyBlockchainTransaction(
    id: string,
    user: any,
  ): Promise<{
    success: boolean;
    isVerified: boolean;
    onChain: boolean;
    transactionHash?: string;
    blockNumber?: string;
    timestamp?: string;
    confirmations?: number;
    chainData?: any;
    error?: string;
  }> {
    try {
      const payment = await this.prisma.transaction.findUnique({
        where: { id },
        select: {
          id: true,
          blockchainTxHash: true,
          contractId: true,
          contract: {
            select: {
              tenantId: true,
              borrower: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (!payment) {
        return {
          success: false,
          isVerified: false,
          onChain: false,
          error: 'Payment not found',
        };
      }

      const txId = payment.blockchainTxHash;

      if (!txId) {
        return {
          success: true,
          isVerified: false,
          onChain: false,
          error: 'No blockchain transaction hash found',
        };
      }

      try {
        const verification =
          await this.paymentBlockchainService.verifyPaymentOnChain(id);

        if (verification.exists && verification.onChain && verification.data) {
          const chaincodeName = verification.data.chaincodeName;
          if (chaincodeName !== 'payments') {
            return {
              success: true,
              isVerified: false,
              onChain: false,
              error: `Transaction found on blockchain but belongs to ${chaincodeName} chaincode, not payments`,
            };
          }

          return {
            success: true,
            isVerified: true,
            onChain: true,
            transactionHash: txId,
            blockNumber: verification.data.blockNumber,
            timestamp: verification.data.timestamp,
            confirmations: verification.data.confirmations,
            chainData: verification.data,
          };
        } else {
          return {
            success: true,
            isVerified: false,
            onChain: false,
            error: 'Transaction not found on blockchain',
          };
        }
      } catch (blockchainError) {
        this.logger.warn(
          'Blockchain verification failed for payment ' + id,
          blockchainError,
        );

        return {
          success: true,
          isVerified: false,
          onChain: false,
          error: 'Blockchain verification service unavailable',
        };
      }
    } catch (error) {
      this.logger.error(
        'Failed to verify blockchain transaction for payment ' + id,
        error,
      );
      return {
        success: false,
        isVerified: false,
        onChain: false,
        error: 'Failed to verify blockchain transaction',
      };
    }
  }
}
