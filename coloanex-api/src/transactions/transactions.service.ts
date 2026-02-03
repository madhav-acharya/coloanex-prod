import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import type { Transaction } from './entities/transaction.entity';
import {
  TransactionStatus,
  TransactionType,
} from './entities/transaction.entity';
import { WalletsService } from '../wallets/wallets.service';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => WalletsService))
    private walletsService: WalletsService,
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

    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: TransactionStatus.COMPLETED as any },
    });

    return transaction as unknown as Transaction;
  }

  async findByContract(contractId: string): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
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
    }) as unknown as Transaction[];
  }

  async findByWallet(walletId: string): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
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
    }) as unknown as Transaction[];
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

    return this.prisma.transaction.update({
      where: { id },
      data: { status: status as any },
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
