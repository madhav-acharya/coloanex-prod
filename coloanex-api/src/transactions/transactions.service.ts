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

    const transaction = await this.prisma.transaction.create({
      data: {
        ...createTransactionDto,
        status: TransactionStatus.PENDING as any,
        gatewayDetails: createTransactionDto.paymentDetails as any,
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

    const bcTx = await this.blockchainService.recordPayment(
      transaction.id,
      createTransactionDto.contractId ?? 'no-contract',
      Math.round(Number(createTransactionDto.amount) * 100),
      'system',
      transaction.id,
    );

    let updatedTransaction = transaction;

    if (bcTx && bcTx.txHash) {
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { 
          status: TransactionStatus.COMPLETED as any,
          blockchainTxHash: bcTx.txHash,
          blockchainData: bcTx as any,
        },
      });
    } else {
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.COMPLETED as any },
      });

      if (this.blockchainService.isEnabled()) {
        throw new InternalServerErrorException(
          'Failed to record transaction on blockchain',
        );
      }
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

    const bcTx = await this.blockchainService.updateTransaction(id, status);

    let updateData: any = { status: status as any };

    if (bcTx && bcTx.txHash) {
      updateData = {
        ...updateData,
        blockchainTxHash: bcTx.txHash,
        blockchainData: bcTx as any,
      };
    } else if (this.blockchainService.isEnabled()) {
      throw new InternalServerErrorException(
        'Failed to record transaction status update on blockchain',
      );
    }

    return this.prisma.transaction.update({
      where: { id },
      data: updateData,
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
