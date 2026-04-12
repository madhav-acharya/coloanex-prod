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

    const purposePriority: Array<'GAS' | 'PRIMARY' | 'GENERAL'> = purpose
      ? purpose === 'GAS'
        ? ['GAS', 'PRIMARY', 'GENERAL']
        : ['PRIMARY', 'GENERAL']
      : ['PRIMARY', 'GENERAL'];

    for (const prioritizedPurpose of purposePriority) {
      const wallet = await this.prisma.wallet.findFirst({
        where: {
          userId,
          purpose: prioritizedPurpose as never,
          isActive: true,
          platform: platform as never,
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (wallet) {
        return wallet;
      }
    }

    return this.prisma.wallet.findFirst({
      where: {
        userId,
        isActive: true,
        platform: platform as never,
      },
      orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
    });
  }
}
