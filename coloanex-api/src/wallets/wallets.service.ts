import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureWalletManagementAllowed(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: { select: { name: true } } } } },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isBorrower = user.roles.some((r) => r.role.name === 'Borrower');
    if (isBorrower) {
      throw new ForbiddenException(
        'Borrower wallet management is disabled. Mobile borrower flows are always PLATFORM_WALLET.',
      );
    }
  }

  async create(userId: string, dto: CreateWalletDto) {
    await this.ensureWalletManagementAllowed(userId);
    if (dto.provider === 'ESEWA' || dto.provider === 'KHALTI') {
      throw new BadRequestException(
        'Use Tenant Payment Config to manage eSewa/Khalti credentials.',
      );
    }

    const purpose = dto.purpose || 'PRIMARY';

    if (purpose === 'RECEIVE_ESEWA' || purpose === 'RECEIVE_KHALTI') {
      throw new BadRequestException(
        'Receive wallet purposes are deprecated. Configure gateways in Tenant Payment Config.',
      );
    }

    const exists = await this.prisma.wallet.findFirst({
      where: {
        provider: dto.provider as never,
        address: dto.address,
      },
    });

    if (exists && exists.userId !== userId) {
      throw new BadRequestException('Wallet address is already linked');
    }

    const existingPurposeWallet = await this.prisma.wallet.findUnique({
      where: {
        userId_purpose: {
          userId,
          purpose: purpose as never,
        },
      },
      select: { id: true },
    });

    if (purpose === 'PRIMARY') {
      await this.prisma.wallet.updateMany({
        where: { userId },
        data: { isPrimary: false },
      });
    }

    if (existingPurposeWallet) {
      return this.prisma.wallet.update({
        where: { id: existingPurposeWallet.id },
        data: {
          provider: dto.provider as never,
          platform: dto.platform as never,
          address: dto.address,
          label: dto.label,
          purpose: purpose as never,
          isActive: true,
          isPrimary: purpose === 'PRIMARY',
        },
      });
    }

    return this.prisma.wallet.create({
      data: {
        userId,
        provider: dto.provider as never,
        platform: dto.platform as never,
        purpose: purpose as never,
        address: dto.address,
        label: dto.label,
        isPrimary: purpose === 'PRIMARY',
      },
    });
  }

  findMine(userId: string) {
    return this.prisma.wallet.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async update(userId: string, walletId: string, dto: UpdateWalletDto) {
    await this.ensureWalletManagementAllowed(userId);
    const wallet = await this.prisma.wallet.findFirst({
      where: { id: walletId, userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return this.prisma.wallet.update({
      where: { id: walletId },
      data: {
        label: dto.label,
        isActive: dto.isActive,
        platform: dto.platform as never,
        purpose: dto.purpose as never,
      },
    });
  }

  async setPrimary(userId: string, walletId: string) {
    await this.ensureWalletManagementAllowed(userId);
    const wallet = await this.prisma.wallet.findFirst({
      where: { id: walletId, userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    await this.prisma.wallet.updateMany({
      where: { userId },
      data: { isPrimary: false, purpose: 'GENERAL' as never },
    });

    return this.prisma.wallet.update({
      where: { id: walletId },
      data: { isPrimary: true, purpose: 'PRIMARY' as never },
    });
  }

  async remove(userId: string, walletId: string) {
    await this.ensureWalletManagementAllowed(userId);
    const wallet = await this.prisma.wallet.findFirst({
      where: { id: walletId, userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    await this.prisma.wallet.delete({ where: { id: walletId } });

    const nextWallet = await this.prisma.wallet.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (nextWallet) {
      await this.prisma.wallet.update({
        where: { id: nextWallet.id },
        data: { isPrimary: true },
      });
    }

    return { message: 'Wallet deleted' };
  }

  updateGasPaymentMode(userId: string, gasPaymentMode: string) {
    return this.updateGasPaymentModeInternal(userId, gasPaymentMode);
  }

  private async updateGasPaymentModeInternal(
    userId: string,
    gasPaymentMode: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: { select: { name: true } } } } },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const roleNames = user.roles.map((r) => r.role.name);
    const isBorrower = roleNames.includes('Borrower');

    if (isBorrower && gasPaymentMode !== 'PLATFORM_WALLET') {
      throw new BadRequestException(
        'Borrowers must use PLATFORM_WALLET gas mode on app flows.',
      );
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        gasPaymentMode: isBorrower
          ? ('PLATFORM_WALLET' as never)
          : (gasPaymentMode as never),
      },
      select: { id: true, gasPaymentMode: true },
    });
  }
}
