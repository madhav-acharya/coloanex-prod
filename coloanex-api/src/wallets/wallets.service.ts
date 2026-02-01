import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import type { Wallet } from './entities/wallet.entity';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createWalletDto: CreateWalletDto,
    user: JwtPayload,
  ): Promise<Wallet> {
    const paymentGatewayLinks = {
      esewa: createWalletDto.esewa,
      fonepay: createWalletDto.fonepay,
      khalti: createWalletDto.khalti,
    };

    return this.prisma.wallet.create({
      data: {
        userId: user.sub,
        balance: 0,
        paymentGatewayLinks: paymentGatewayLinks as any,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    }) as unknown as Wallet;
  }

  async findByUser(userId: string): Promise<Wallet | null> {
    const wallet = await this.prisma.wallet.findFirst({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return wallet as unknown as Wallet;
  }

  async findOne(id: string): Promise<Wallet> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet as unknown as Wallet;
  }

  async updateBalance(id: string, amount: number): Promise<Wallet> {
    const wallet = await this.prisma.wallet.findUnique({ where: { id } });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const newBalance = Number(wallet.balance) + amount;

    return this.prisma.wallet.update({
      where: { id },
      data: { balance: newBalance },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    }) as unknown as Wallet;
  }
}
