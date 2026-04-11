import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { PlatformType } from './transaction-orchestrator.types';

@Injectable()
export class WalletResolverService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveWallet(
    userId: string,
    platform: PlatformType,
    preferredWalletId?: string,
    purpose?: 'GAS' | 'PRIMARY',
  ) {
    if (preferredWalletId) {
      const wallet = await this.prisma.wallet.findFirst({
        where: {
          id: preferredWalletId,
          userId,
          isActive: true,
          platform: platform as never,
        },
      });
      if (wallet) {
        return wallet;
      }
    }

    const primary = await this.prisma.wallet.findFirst({
      where: {
        userId,
        ...(purpose ? { purpose: purpose as never } : { isPrimary: true }),
        isActive: true,
        platform: platform as never,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (primary) {
      return primary;
    }

    return this.prisma.wallet.findFirst({
      where: {
        userId,
        ...(purpose ? { purpose: purpose as never } : {}),
        isActive: true,
        platform: platform as never,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
