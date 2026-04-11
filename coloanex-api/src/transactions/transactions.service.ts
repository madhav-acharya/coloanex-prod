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
    const { blockchain_tx_hash, ...transactionData } = createTransactionDto;
    const platform = this.resolvePlatform(currentUser);

    const decision = await this.transactionOrchestrator.orchestrate({
      userId: currentUser.sub,
      tenantId: currentUser.tenantId,
      transactionType: createTransactionDto.type,
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
        ...transactionData,
        sentBy: createTransactionDto.sentBy || currentUser.sub,
        status: TransactionStatus.PENDING as any,
        gatewayDetails: createTransactionDto.paymentDetails as any,
        gasPaymentMode: decision.gasPaymentMode as any,
        gasPaidBy: decision.gasPayer,
        walletId: decision.walletId,
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
        createTransactionDto.contractId ?? 'no-contract',
        Math.round(Number(createTransactionDto.amount) * 100),
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
