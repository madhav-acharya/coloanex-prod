import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import type { Transaction } from './entities/transaction.entity';
import {
  TransactionStatus,
  TransactionType,
} from './entities/transaction.entity';
import { BlockchainService } from '../blockchain/blockchain.service';
import { TransactionOrchestratorService } from '../transaction-orchestrator/transaction-orchestrator.service';
import { SubscriptionResolverService } from '../transaction-orchestrator/subscription-resolver.service';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private prisma: PrismaService,
    private readonly blockchainService: BlockchainService,
    private readonly transactionOrchestrator: TransactionOrchestratorService,
    private readonly subscriptionResolver: SubscriptionResolverService,
  ) {}

  private resolvePlatform(user: { roles?: string[] }): 'APP' | 'WEB' {
    return user.roles?.includes('Borrower') ? 'APP' : 'WEB';
  }

  private resolveWalletRange(startDate?: string, endDate?: string) {
    const now = new Date();
    const end = endDate ? new Date(endDate) : now;
    if (Number.isNaN(end.getTime())) end.setTime(now.getTime());
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 180 * 24 * 60 * 60 * 1000);
    if (Number.isNaN(start.getTime())) {
      start.setTime(end.getTime() - 180 * 24 * 60 * 60 * 1000);
    }
    if (end < start) {
      const temp = new Date(start);
      start.setTime(end.getTime());
      end.setTime(temp.getTime());
    }
    return { start, end };
  }

  private buildWalletBuckets(start: Date, end: Date) {
    const durationMs = end.getTime() - start.getTime();
    const hourMs = 60 * 60 * 1000;
    const dayMs = 24 * hourMs;
    const monthMs = 30 * dayMs;

    if (durationMs <= dayMs) {
      const buckets: Array<{ start: Date; end: Date; label: string }> = [];
      let cursor = new Date(start);
      while (cursor <= end) {
        const bucketStart = new Date(cursor);
        const bucketEnd = new Date(cursor.getTime() + 4 * hourMs);
        buckets.push({
          start: bucketStart,
          end: bucketEnd,
          label: bucketStart.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
        });
        cursor = bucketEnd;
      }
      return buckets;
    }

    if (durationMs <= 31 * dayMs) {
      const buckets: Array<{ start: Date; end: Date; label: string }> = [];
      let cursor = new Date(start);
      while (cursor <= end) {
        const bucketStart = new Date(cursor);
        const bucketEnd = new Date(cursor.getTime() + dayMs);
        buckets.push({
          start: bucketStart,
          end: bucketEnd,
          label: bucketStart.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
        });
        cursor = bucketEnd;
      }
      return buckets;
    }

    const buckets: Array<{ start: Date; end: Date; label: string }> = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(end.getFullYear(), end.getMonth(), 1);
    while (cursor <= last) {
      const bucketStart = new Date(cursor);
      const bucketEnd = new Date(
        cursor.getFullYear(),
        cursor.getMonth() + 1,
        1,
      );
      buckets.push({
        start: bucketStart,
        end: bucketEnd,
        label: bucketStart.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return buckets;
  }

  private percentageFromSeries(series: Array<{ value: number }>) {
    const first = Number(series[0]?.value || 0);
    const last = Number(series[series.length - 1]?.value || 0);
    if (first === 0) return last > 0 ? 100 : 0;
    return Number((((last - first) / first) * 100).toFixed(2));
  }

  private async attachActorDetails<
    T extends { sentBy: string; receivedBy: string },
  >(
    transactions: T[],
  ): Promise<
    Array<
      T & {
        sentByUser?: { id: string; fullName: string; email: string };
        receivedByUser?: { id: string; fullName: string; email: string };
      }
    >
  > {
    const actorIds = [
      ...new Set(transactions.flatMap((t) => [t.sentBy, t.receivedBy])),
    ].filter((id): id is string => Boolean(id));

    if (!actorIds.length) {
      return transactions.map((t) => ({
        ...t,
        sentByUser: undefined,
        receivedByUser: undefined,
      }));
    }

    const actorMap = new Map<
      string,
      { id: string; fullName: string; email: string }
    >();

    const users = await this.prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, fullName: true, email: true },
    });

    users.forEach((user) => {
      actorMap.set(user.id, {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      });
    });

    const unresolvedAfterUsers = actorIds.filter((id) => !actorMap.has(id));
    if (unresolvedAfterUsers.length) {
      const borrowers = await this.prisma.borrower.findMany({
        where: { id: { in: unresolvedAfterUsers } },
        select: {
          id: true,
          user: { select: { fullName: true, email: true } },
        },
      });

      borrowers.forEach((borrower) => {
        actorMap.set(borrower.id, {
          id: borrower.id,
          fullName: borrower.user.fullName,
          email: borrower.user.email,
        });
      });
    }

    const unresolvedAfterBorrowers = actorIds.filter((id) => !actorMap.has(id));
    if (unresolvedAfterBorrowers.length) {
      const tenants = await this.prisma.tenant.findMany({
        where: { id: { in: unresolvedAfterBorrowers } },
        select: {
          id: true,
          name: true,
          contactEmail: true,
          ownerUser: { select: { fullName: true, email: true } },
        },
      });

      tenants.forEach((tenant) => {
        actorMap.set(tenant.id, {
          id: tenant.id,
          fullName: tenant.ownerUser
            ? `${tenant.ownerUser.fullName} (${tenant.name})`
            : tenant.name,
          email: tenant.ownerUser?.email ?? tenant.contactEmail ?? tenant.id,
        });
      });
    }

    return transactions.map((transaction) => ({
      ...transaction,
      sentByUser: actorMap.get(transaction.sentBy),
      receivedByUser: actorMap.get(transaction.receivedBy),
    }));
  }

  async create(
    createTransactionDto: CreateTransactionDto,
    currentUser: { sub: string; tenantId?: string; roles?: string[] },
  ): Promise<Transaction> {
    const {
      blockchain_tx_hash,
      contractId,
      paymentScheduleId,
      paymentDetails,
      sentBy,
      receivedBy,
      type,
      amount,
      description,
    } = createTransactionDto;
    const platform = this.resolvePlatform(currentUser);

    const decision = await this.transactionOrchestrator.orchestrate({
      userId: currentUser.sub,
      tenantId: currentUser.tenantId,
      transactionType: type,
      platform,
      userRoles: currentUser.roles,
      preferredWalletId: createTransactionDto.walletId,
      requestedGasPaymentMode: createTransactionDto.gasPaymentMode,
    });

    if (!decision.eligible) {
      throw new BadRequestException(
        decision.denialReason || 'Transaction is not eligible',
      );
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        sentBy: sentBy || currentUser.sub,
        receivedBy,
        type,
        amount,
        description,
        status: TransactionStatus.PENDING as any,
        gatewayDetails: paymentDetails as any,
        gasPaymentMode: decision.gasPaymentMode as any,
        gasPaidBy: decision.gasPayer,
        walletProvider: decision.walletProvider as any,
        platform: ((decision.evaluationData?.platform as
          | 'APP'
          | 'WEB'
          | undefined) || platform) as any,
        orchestrationData: {
          scope: decision.scope,
          plan: decision.plan,
          subscriptionId: decision.subscriptionId,
          featureFlags: decision.featureFlags,
        } as any,
        ...(contractId ? { contract: { connect: { id: contractId } } } : {}),
        ...(paymentScheduleId
          ? { paymentSchedule: { connect: { id: paymentScheduleId } } }
          : {}),
        ...(decision.walletId
          ? { wallet: { connect: { id: decision.walletId } } }
          : {}),
        ...(blockchain_tx_hash && { blockchainTxHash: blockchain_tx_hash }),
      },
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
          },
        },
      },
    });

    let blockchainTxHash: string | undefined = blockchain_tx_hash;
    let blockchainData: any = null;

    if (blockchainTxHash) {
      this.logger.log(
        `[Transaction ${transaction.id}] Using frontend blockchain hash: ${blockchainTxHash}`,
      );
      blockchainData = {
        txHash: blockchainTxHash,
        timestamp: new Date().toISOString(),
        source: 'frontend',
        explorerUrl: `https://sepolia.etherscan.io/tx/${blockchainTxHash}`,
      };
    } else if (this.blockchainService.isEnabled()) {
      this.logger.log(
        `[Transaction ${transaction.id}] Processing blockchain transaction...`,
      );
      const bcTx = await this.blockchainService.recordPayment(
        transaction.id,
        contractId ?? 'no-contract',
        Math.round(Number(amount) * 100),
        'system',
        transaction.id,
      );

      if (bcTx && bcTx.txHash) {
        this.logger.log(
          `[Transaction ${transaction.id}] Backend blockchain successful: ${bcTx.txHash}`,
        );
        blockchainTxHash = bcTx.txHash;
        blockchainData = bcTx;
      }
    }

    if (blockchainTxHash && blockchainData) {
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.COMPLETED as any,
          blockchainTxHash,
          blockchainData,
          completedAt: new Date(),
        },
      });

      await this.transactionOrchestrator.persistEvaluation({
        transactionId: transaction.id,
        decision,
      });
      await this.subscriptionResolver.consumeUsage(decision.subscriptionId);
    } else if (this.blockchainService.isEnabled()) {
      this.logger.error(
        `[Transaction ${transaction.id}] Blockchain transaction failed`,
      );
      throw new InternalServerErrorException(
        'Blockchain transaction failed. Cannot complete transaction.',
      );
    } else {
      this.logger.log(
        `[Transaction ${transaction.id}] Blockchain disabled, completing without chain record`,
      );
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.COMPLETED as any,
          completedAt: new Date(),
        },
      });

      await this.transactionOrchestrator.persistEvaluation({
        transactionId: transaction.id,
        decision,
      });
      await this.subscriptionResolver.consumeUsage(decision.subscriptionId);
    }

    return transaction as unknown as Transaction;
  }

  async findAll(): Promise<Transaction[]> {
    const transactions = await this.prisma.transaction.findMany({
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
            tenantId: true,
            borrowerId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return (await this.attachActorDetails(
      transactions as any[],
    )) as unknown as Transaction[];
  }

  async findByContract(contractId: string): Promise<Transaction[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: { contractId },
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return (await this.attachActorDetails(
      transactions as any[],
    )) as unknown as Transaction[];
  }

  async findByEntity(entityId: string): Promise<Transaction[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        OR: [{ sentBy: entityId }, { receivedBy: entityId }],
      },
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
            tenantId: true,
            borrowerId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return (await this.attachActorDetails(
      transactions as any[],
    )) as unknown as Transaction[];
  }

  async getWalletSummary(
    user: { sub: string; tenantId?: string; roles?: string[] },
    startDate?: string,
    endDate?: string,
  ) {
    const { start, end } = this.resolveWalletRange(startDate, endDate);
    const roleNames = (user.roles || []).map((role) => role.toLowerCase());
    const isSuperAdmin = roleNames.includes('super admin');
    const entityIds = [user.sub, user.tenantId].filter(Boolean) as string[];

    const where: any = {
      createdAt: { gte: start, lte: end },
    };

    if (!isSuperAdmin) {
      where.OR = [
        { sentBy: { in: entityIds } },
        { receivedBy: { in: entityIds } },
      ];
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      select: {
        sentBy: true,
        receivedBy: true,
        amount: true,
        type: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    let toGive = 0;
    let toReceive = 0;

    transactions.forEach((tx) => {
      if (tx.status !== 'COMPLETED') return;
      const amount = Number(tx.amount) || 0;

      if (isSuperAdmin) {
        toGive += amount;
        return;
      }

      const iSent = entityIds.includes(tx.sentBy);
      const iReceived = entityIds.includes(tx.receivedBy);

      if (iReceived && tx.type === 'DISBURSEMENT') toGive += amount;
      if (
        iSent &&
        (tx.type === 'INSTALLMENT_PAYMENT' || tx.type === 'PENALTY_PAYMENT')
      ) {
        toGive -= amount;
      }

      if (iSent && tx.type === 'DISBURSEMENT') toReceive += amount;
      if (
        iReceived &&
        (tx.type === 'INSTALLMENT_PAYMENT' || tx.type === 'PENALTY_PAYMENT')
      ) {
        toReceive -= amount;
      }
    });

    const buckets = this.buildWalletBuckets(start, end);

    const toGiveSeries = buckets.map((bucket) => {
      let value = 0;
      transactions.forEach((tx) => {
        const d = new Date(tx.createdAt);
        if (d < bucket.start || d >= bucket.end || tx.status !== 'COMPLETED') {
          return;
        }
        const amount = Number(tx.amount) || 0;

        if (isSuperAdmin) {
          value += amount;
          return;
        }

        const iSent = entityIds.includes(tx.sentBy);
        const iReceived = entityIds.includes(tx.receivedBy);

        if (iReceived && tx.type === 'DISBURSEMENT') value += amount;
        if (
          iSent &&
          (tx.type === 'INSTALLMENT_PAYMENT' || tx.type === 'PENALTY_PAYMENT')
        ) {
          value -= amount;
        }
      });

      return { month: bucket.label, value: Math.max(0, value) };
    });

    const toReceiveSeries = buckets.map((bucket) => {
      let value = 0;
      transactions.forEach((tx) => {
        const d = new Date(tx.createdAt);
        if (d < bucket.start || d >= bucket.end || tx.status !== 'COMPLETED') {
          return;
        }

        if (isSuperAdmin) return;

        const amount = Number(tx.amount) || 0;
        const iSent = entityIds.includes(tx.sentBy);
        const iReceived = entityIds.includes(tx.receivedBy);

        if (iSent && tx.type === 'DISBURSEMENT') value += amount;
        if (
          iReceived &&
          (tx.type === 'INSTALLMENT_PAYMENT' || tx.type === 'PENALTY_PAYMENT')
        ) {
          value -= amount;
        }
      });

      return { month: bucket.label, value: Math.max(0, value) };
    });

    const totalTransactionsSeries = buckets.map((bucket) => {
      const value = transactions.filter((tx) => {
        const d = new Date(tx.createdAt);
        return d >= bucket.start && d < bucket.end;
      }).length;
      return { month: bucket.label, value };
    });

    return {
      toGive: Math.max(0, toGive),
      toReceive: Math.max(0, toReceive),
      totalTransactions: transactions.length,
      toGivePercentage: this.percentageFromSeries(toGiveSeries),
      toReceivePercentage: this.percentageFromSeries(toReceiveSeries),
      totalTransactionsPercentage: this.percentageFromSeries(
        totalTransactionsSeries,
      ),
      toGiveSeries,
      toReceiveSeries,
      totalTransactionsSeries,
    };
  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const [enriched] = await this.attachActorDetails([transaction as any]);
    return enriched as unknown as Transaction;
  }

  async updateStatus(
    id: string,
    status: TransactionStatus,
    user: { sub: string; tenantId?: string; roles?: string[] },
  ): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (this.blockchainService.isEnabled()) {
      const orchestrationDecision =
        await this.transactionOrchestrator.orchestrate({
          userId: user.sub,
          tenantId: user.tenantId,
          transactionType: transaction.type,
          platform: this.resolvePlatform(user),
          userRoles: user.roles,
        });

      if (!orchestrationDecision.eligible) {
        throw new BadRequestException(
          orchestrationDecision.denialReason || 'Transaction blocked by policy',
        );
      }

      if (orchestrationDecision.gasPayer === 'USER') {
        throw new BadRequestException(
          'Status update in USER_WALLET mode must be signed from web wallet flow.',
        );
      }

      this.logger.log(
        `[Transaction ${id}] Updating blockchain status to ${status}...`,
      );
      const bcTx = await this.blockchainService.updateTransaction(id, status);

      if (bcTx && bcTx.txHash) {
        this.logger.log(
          `[Transaction ${id}] Blockchain update successful: ${bcTx.txHash}`,
        );
        const updated = (await this.prisma.transaction.update({
          where: { id },
          data: {
            status: status as any,
            blockchainTxHash: bcTx.txHash,
            blockchainData: bcTx as any,
            ...(status === TransactionStatus.COMPLETED
              ? { completedAt: new Date() }
              : {}),
          },
          include: {
            contract: {
              select: {
                id: true,
                contractNumber: true,
              },
            },
          },
        })) as unknown as Transaction;

        await this.subscriptionResolver.consumeUsage(
          orchestrationDecision.subscriptionId,
        );

        return updated;
      } else {
        this.logger.error(`[Transaction ${id}] Blockchain update failed`);
        throw new InternalServerErrorException(
          'Blockchain transaction update failed.',
        );
      }
    }

    this.logger.log(
      `[Transaction ${id}] Blockchain disabled, updating status without chain record`,
    );
    return this.prisma.transaction.update({
      where: { id },
      data: {
        status: status as any,
        ...(status === TransactionStatus.COMPLETED
          ? { completedAt: new Date() }
          : {}),
      },
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
          },
        },
      },
    }) as unknown as Transaction;
  }
}
