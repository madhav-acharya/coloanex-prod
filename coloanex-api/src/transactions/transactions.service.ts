import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
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
import { WalletsService } from '../wallets/wallets.service';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => WalletsService))
    private walletsService: WalletsService,
    private readonly blockchainService: BlockchainService,
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    if (!createTransactionDto.contractId && !createTransactionDto.walletId) {
      throw new BadRequestException(
        'Either contractId or walletId must be provided',
      );
    }

    const { blockchain_tx_hash, ...transactionData } = createTransactionDto;
    
    const transaction = await this.prisma.transaction.create({
      data: {
        ...transactionData,
        status: TransactionStatus.PENDING as any,
        gatewayDetails: createTransactionDto.paymentDetails as any,
        ...(blockchain_tx_hash && { blockchainTxHash: blockchain_tx_hash }),
      },
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
          },
        },
        wallet: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (createTransactionDto.walletId) {
      const amount = Number(createTransactionDto.amount);
      let walletUpdateAmount: number;

      if (
        createTransactionDto.type === TransactionType.DEPOSIT ||
        createTransactionDto.type === TransactionType.DISBURSEMENT
      ) {
        walletUpdateAmount = amount;
      } else if (
        createTransactionDto.type === TransactionType.WITHDRAW ||
        createTransactionDto.type === TransactionType.INSTALLMENT_PAYMENT ||
        createTransactionDto.type === TransactionType.PENALTY_PAYMENT ||
        createTransactionDto.type === TransactionType.FEE
      ) {
        walletUpdateAmount = -amount;
      } else {
        walletUpdateAmount = 0;
      }

      if (walletUpdateAmount !== 0) {
        await this.walletsService.updateBalance(
          createTransactionDto.walletId,
          walletUpdateAmount,
        );
      }
    }

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
    }

    return transaction as unknown as Transaction;
  }

  async findByContract(contractId: string): Promise<Transaction[]> {
    return (await this.prisma.transaction.findMany({
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
    })) as unknown as Transaction[];
  }

  async findByWallet(walletId: string): Promise<Transaction[]> {
    return (await this.prisma.transaction.findMany({
      where: { walletId },
      include: {
        wallet: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })) as unknown as Transaction[];
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
        wallet: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction as unknown as Transaction;
  }

  async updateStatus(
    id: string,
    status: TransactionStatus,
  ): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (this.blockchainService.isEnabled()) {
      this.logger.log(
        `[Transaction ${id}] Updating blockchain status to ${status}...`,
      );
      const bcTx = await this.blockchainService.updateTransaction(id, status);

      if (bcTx && bcTx.txHash) {
        this.logger.log(
          `[Transaction ${id}] Blockchain update successful: ${bcTx.txHash}`,
        );
        return this.prisma.transaction.update({
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
            wallet: {
              select: {
                id: true,
                userId: true,
              },
            },
          },
        }) as unknown as Transaction;
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
        wallet: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    }) as unknown as Transaction;
  }
}
