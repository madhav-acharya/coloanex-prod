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
import { PaymentConfigsService } from '../payment-configs/payment-configs.service';
import { TransactionOrchestratorService } from '../transaction-orchestrator/transaction-orchestrator.service';
import { SubscriptionResolverService } from '../transaction-orchestrator/subscription-resolver.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  private gatewayConfigMissingMessage(gateway: string) {
    const normalized = String(gateway || '').toUpperCase();
    if (normalized === 'ESEWA') {
      return 'Missing eSewa gateway configuration. Configure Payment Config or set ESEWA_MERCHANT_ID and ESEWA_SECRET in .env';
    }
    if (normalized === 'KHALTI') {
      return 'Missing Khalti gateway configuration. Configure Payment Config or set KHALTI_PUBLIC_KEY and KHALTI_SECRET_KEY in .env';
    }
    return `Missing ${normalized.toLowerCase()} gateway configuration`;
  }

  private getGatewayEnvFallbackConfig(gateway: string) {
    const normalized = String(gateway || '').toUpperCase();

    if (normalized === 'ESEWA') {
      const merchantId = process.env.ESEWA_MERCHANT_ID;
      const secret = process.env.ESEWA_SECRET;
      if (!merchantId || !secret) {
        return null;
      }
      return {
        merchantId,
        secretKey: secret,
        paymentUrl: process.env.ESEWA_PAYMENT_URL,
        statusCheckUrl: process.env.ESEWA_PAYMENT_STATUS_CHECK_URL,
      };
    }

    if (normalized === 'KHALTI') {
      const secretKey = process.env.KHALTI_SECRET_KEY;
      if (!secretKey) {
        return null;
      }
      return {
        publicKey: process.env.KHALTI_PUBLIC_KEY,
        secretKey,
        paymentUrl: process.env.KHALTI_PAYMENT_URL,
        verificationUrl: process.env.KHALTI_VERIFICATION_URL,
      };
    }

    return null;
  }

  private resolvePlatform(user: { roles?: string[] }): 'APP' | 'WEB' {
    return user.roles?.includes('Borrower') ? 'APP' : 'WEB';
  }

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_GATEWAY_REGISTRY)
    private readonly gatewayRegistry: Map<string, IPaymentGateway>,
    private readonly blockchainService: BlockchainService,
    private readonly paymentConfigsService: PaymentConfigsService,
    private readonly transactionOrchestrator: TransactionOrchestratorService,
    private readonly subscriptionResolver: SubscriptionResolverService,
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

  async initiatePayment(dto: InitiatePaymentDto, currentUser: any) {
    const { amount, gateway, successUrl, failureUrl, walletId } = dto;

    const contractContext = dto.contractId
      ? await this.prisma.contract.findUnique({
          where: { id: dto.contractId },
          select: { tenantId: true },
        })
      : null;

    const paymentConfig =
      await this.paymentConfigsService.resolveGatewayConfigForTransaction({
        gateway,
        type: dto.type,
        contractId: dto.contractId,
        currentUserId: currentUser.sub,
        currentUserTenantId: currentUser.tenantId,
      });

    const resolvedGatewayConfig =
      paymentConfig || this.getGatewayEnvFallbackConfig(gateway);

    if (!resolvedGatewayConfig) {
      throw new BadRequestException(this.gatewayConfigMissingMessage(gateway));
    }

    const paymentGateway = this.resolveGateway(gateway);
    const transactionUuid = randomUUID();

    const result = await paymentGateway.initiatePayment({
      amount,
      transactionUuid,
      successUrl,
      failureUrl,
      tenantConfig: resolvedGatewayConfig as any,
    });

    return {
      transactionUuid,
      paymentUrl: result.paymentUrl,
      formData: result.formData,
    };
  }

  async verifyPayment(dto: VerifyPaymentDto, currentUser: any) {
    const {
      transactionUuid,
      totalAmount,
      gateway,
      type,
      contractId,
      paymentScheduleId,
    } = dto;

    const contractContext = contractId
      ? await this.prisma.contract.findUnique({
          where: { id: contractId },
          select: { tenantId: true, borrowerId: true },
        })
      : null;

    const paymentConfig =
      await this.paymentConfigsService.resolveGatewayConfigForTransaction({
        gateway,
        type,
        contractId,
        currentUserId: currentUser.sub,
        currentUserTenantId: currentUser.tenantId,
      });

    const resolvedGatewayConfig =
      paymentConfig || this.getGatewayEnvFallbackConfig(gateway);

    if (!resolvedGatewayConfig) {
      throw new BadRequestException(this.gatewayConfigMissingMessage(gateway));
    }

    const paymentGateway = this.resolveGateway(gateway);

    const verifyResult = await paymentGateway.verifyPayment({
      transactionUuid,
      totalAmount,
      tenantConfig: resolvedGatewayConfig as any,
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
    const platform = this.resolvePlatform(currentUser);
    const isSubscriptionFeePayment =
      type === 'FEE' && !contractId && !paymentScheduleId;

    let blockchain_tx_hash: string | null = null;
    let gasFeeGwei: string | null = null;
    let blockchainExplorerUrl: string | null = null;

    const orchestrationDecision = isSubscriptionFeePayment
      ? {
          eligible: true,
          scope: 'NONE' as const,
          plan: 'NONE',
          gasPaymentMode: 'PLATFORM_WALLET' as const,
          gasPayer: 'PLATFORM' as const,
          featureFlags: {},
          evaluationData: {
            platform,
            bypassReason: 'subscription_fee_payment',
          },
        }
      : await this.transactionOrchestrator.orchestrate({
          userId: currentUser.sub,
          tenantId: contractContext?.tenantId || currentUser.tenantId,
          transactionType: type,
          platform,
          userRoles: currentUser.roles,
          preferredWalletId: dto.walletId,
          requestedGasPaymentMode: dto.gasPaymentMode,
        });

    if (!orchestrationDecision.eligible) {
      throw new BadRequestException(
        orchestrationDecision.denialReason || 'Transaction blocked by policy',
      );
    }

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
        this.logger.warn(
          `[Payment ${paymentId}] Blockchain transaction failed, proceeding without blockchain record`,
        );
      }
    } else {
      this.logger.warn(
        `[Payment ${paymentId}] Blockchain disabled, proceeding without chain record`,
      );
    }

    let sentBy = currentUser.sub;
    let receivedBy = 'system';

    if (contractId) {
      if (contractContext) {
        if (type === 'DISBURSEMENT') {
          sentBy = contractContext.tenantId;
          receivedBy = contractContext.borrowerId;
        } else {
          sentBy = currentUser.sub;
          receivedBy = contractContext.tenantId;
        }
      }
    }

    this.logger.log(`[Payment ${paymentId}] Creating database record...`);
    const transaction = await this.prisma.transaction.create({
      data: {
        id: paymentId,
        sentBy,
        receivedBy,
        contractId: contractId ?? null,
        paymentScheduleId: paymentScheduleId ?? null,
        type: type as never,
        amount: totalAmount,
        status: 'COMPLETED' as never,
        completedAt: new Date(),
        description: `${gateway} payment verified`,
        gasPaymentMode: orchestrationDecision.gasPaymentMode as any,
        gasPaidBy: orchestrationDecision.gasPayer,
        walletId: orchestrationDecision.walletId,
        walletProvider: orchestrationDecision.walletProvider as any,
        platform: ((orchestrationDecision.evaluationData?.platform as
          | 'APP'
          | 'WEB'
          | undefined) || platform) as any,
        orchestrationData: {
          scope: orchestrationDecision.scope,
          plan: orchestrationDecision.plan,
          featureFlags: orchestrationDecision.featureFlags,
          subscriptionId: orchestrationDecision.subscriptionId,
        } as any,
        blockchainTxHash: blockchain_tx_hash,
        blockchainData: blockchain_tx_hash
          ? ({
              txHash: blockchain_tx_hash,
              gasFeeGwei,
              explorerUrl: blockchainExplorerUrl,
              timestamp: new Date().toISOString(),
              source: 'payment_verification',
            } as any)
          : undefined,
        gatewayDetails: {
          gateway,
          tenantId: contractContext?.tenantId || currentUser.tenantId,
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
          // Transaction recorded correctly.
        }

        await this.prisma.contract.update({
          where: { id: contractId },
          data: {
            totalAmountPaid: { increment: amount },
            outstandingBalance: { decrement: amount },
          },
        });

        if (paymentScheduleId) {
          const scheduleIds = paymentScheduleId
            .split(',')
            .map((id) => id.trim());
          const schedules = await this.prisma.paymentSchedule.findMany({
            where: { id: { in: scheduleIds } },
          });

          const totalScheduleAmount = schedules.reduce(
            (sum, schedule) => sum + Number(schedule.totalAmount),
            0,
          );
          const amountPerSchedule = amount / schedules.length;

          for (const schedule of schedules) {
            const newAmountPaid =
              Number(schedule.amountPaid) + amountPerSchedule;
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
    }

    await this.transactionOrchestrator.persistEvaluation({
      transactionId: transaction.id,
      decision: orchestrationDecision,
    });
    await this.subscriptionResolver.consumeUsage(
      orchestrationDecision.subscriptionId,
    );

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
    currentUser: any,
  ) {
    const { transactionUuid, totalAmount, gateway } = dto;

    const paymentConfig =
      (await this.paymentConfigsService.resolveTenantGatewayConfig(
        currentUser.tenantId,
        gateway,
      )) ||
      (await this.paymentConfigsService.resolveUserGatewayConfig(
        currentUser.sub,
        gateway,
      ));

    const paymentGateway = this.resolveGateway(gateway);

    const lookupResult = await paymentGateway.lookupPayment({
      transactionUuid,
      totalAmount,
      tenantConfig: paymentConfig as any,
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

  async processEsewaWebhook(payload: Record<string, unknown>) {
    const transactionUuid =
      (payload.transaction_uuid as string | undefined) ||
      (payload.transactionUuid as string | undefined) ||
      randomUUID();
    return this.processWebhook('ESEWA', transactionUuid, payload);
  }

  async processKhaltiWebhook(payload: Record<string, unknown>) {
    const eventId =
      (payload.pidx as string | undefined) ||
      (payload.transaction_uuid as string | undefined) ||
      randomUUID();
    return this.processWebhook('KHALTI', eventId, payload);
  }

  private async processWebhook(
    gateway: 'ESEWA' | 'KHALTI',
    eventId: string,
    payload: Record<string, unknown>,
  ) {
    const transactionUuid =
      (payload.transaction_uuid as string | undefined) ||
      (payload.purchase_order_id as string | undefined) ||
      (payload.pidx as string | undefined);

    const transaction = transactionUuid
      ? await this.prisma.transaction.findFirst({
          where: {
            gatewayDetails: {
              path: ['transactionUuid'],
              equals: transactionUuid,
            },
          },
          select: { id: true, contractId: true, type: true, status: true },
        })
      : null;

    if (transaction) {
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status:
            transaction.status === 'COMPLETED'
              ? ('COMPLETED' as never)
              : ('COMPLETED' as never),
          completedAt:
            transaction.status === 'COMPLETED' ? undefined : new Date(),
          gatewayDetails: {
            webhookGateway: gateway,
            webhookPayload: payload,
            transactionUuid,
          } as never,
        },
      });
    }

    return {
      ok: true,
      idempotent: false,
      gateway,
      eventId,
      transactionId: transaction?.id ?? null,
    };
  }
}
