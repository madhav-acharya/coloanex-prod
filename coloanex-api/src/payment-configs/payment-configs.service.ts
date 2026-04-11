import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpsertPaymentConfigDto } from './dto/upsert-payment-config.dto';

@Injectable()
export class PaymentConfigsService {
  constructor(private readonly prisma: PrismaService) {}

  private canManageTenant(currentUser: any, tenantId: string) {
    const isSuperAdmin = currentUser?.roles?.includes('Super Admin');
    return isSuperAdmin || currentUser?.tenantId === tenantId;
  }

  private canManageUser(currentUser: any, userId: string) {
    const isSuperAdmin = currentUser?.roles?.includes('Super Admin');
    return isSuperAdmin || currentUser?.sub === userId;
  }

  async upsert(dto: UpsertPaymentConfigDto, currentUser: any) {
    if (dto.scope === 'TENANT') {
      const tenantId = dto.tenantId || currentUser?.tenantId;
      if (!tenantId) {
        throw new ForbiddenException('Tenant scope requires tenantId');
      }

      if (!this.canManageTenant(currentUser, tenantId)) {
        throw new ForbiddenException(
          'You cannot manage payment config for this tenant',
        );
      }

      return this.prisma.paymentConfig.upsert({
        where: {
          tenantId_gateway_environment: {
            tenantId,
            gateway: dto.gateway as never,
            environment: dto.environment,
          },
        },
        update: {
          ownerScope: 'TENANT' as never,
          ownerUserId: null,
          tenantId,
          isActive: dto.isActive ?? true,
          publicKey: dto.publicKey,
          secretKey: dto.secretKey,
          merchantId: dto.merchantId,
          webhookUrl: dto.webhookUrl,
          payoutConfig: dto.payoutConfig as any,
          metadata: dto.metadata as any,
        },
        create: {
          ownerScope: 'TENANT' as never,
          ownerUserId: null,
          tenantId,
          gateway: dto.gateway as never,
          environment: dto.environment,
          isActive: dto.isActive ?? true,
          publicKey: dto.publicKey,
          secretKey: dto.secretKey,
          merchantId: dto.merchantId,
          webhookUrl: dto.webhookUrl,
          payoutConfig: dto.payoutConfig as any,
          metadata: dto.metadata as any,
        },
      });
    }

    const ownerUserId = dto.userId || currentUser?.sub;
    if (!ownerUserId) {
      throw new ForbiddenException('User scope requires a user id');
    }

    if (!this.canManageUser(currentUser, ownerUserId)) {
      throw new ForbiddenException('You cannot manage payment config for user');
    }

    return this.prisma.paymentConfig.upsert({
      where: {
        ownerUserId_gateway_environment: {
          ownerUserId,
          gateway: dto.gateway as never,
          environment: dto.environment,
        },
      },
      update: {
        ownerScope: 'USER' as never,
        ownerUserId,
        tenantId: null,
        isActive: dto.isActive ?? true,
        publicKey: dto.publicKey,
        secretKey: dto.secretKey,
        merchantId: dto.merchantId,
        webhookUrl: dto.webhookUrl,
        payoutConfig: dto.payoutConfig as any,
        metadata: dto.metadata as any,
      },
      create: {
        ownerScope: 'USER' as never,
        ownerUserId,
        tenantId: null,
        gateway: dto.gateway as never,
        environment: dto.environment,
        isActive: dto.isActive ?? true,
        publicKey: dto.publicKey,
        secretKey: dto.secretKey,
        merchantId: dto.merchantId,
        webhookUrl: dto.webhookUrl,
        payoutConfig: dto.payoutConfig as any,
        metadata: dto.metadata as any,
      },
    });
  }

  async findMine(currentUser: any) {
    const tenantId = currentUser?.tenantId;
    return this.prisma.paymentConfig.findMany({
      where: {
        OR: [
          { ownerScope: 'USER' as never, ownerUserId: currentUser.sub },
          ...(tenantId
            ? [
                {
                  ownerScope: 'TENANT' as never,
                  tenantId,
                },
              ]
            : []),
        ],
      },
      orderBy: [
        { ownerScope: 'desc' },
        { gateway: 'asc' },
        { environment: 'asc' },
      ],
    });
  }

  async findByTenant(tenantId: string, currentUser: any) {
    if (!this.canManageTenant(currentUser, tenantId)) {
      throw new ForbiddenException(
        'You cannot view payment config for this tenant',
      );
    }

    return this.prisma.paymentConfig.findMany({
      where: {
        ownerScope: 'TENANT' as never,
        tenantId,
      },
      orderBy: [{ gateway: 'asc' }, { environment: 'asc' }],
    });
  }

  async remove(id: string, currentUser: any) {
    const existing = await this.prisma.paymentConfig.findUnique({
      where: { id },
      select: {
        id: true,
        ownerScope: true,
        ownerUserId: true,
        tenantId: true,
      },
    });

    if (!existing) {
      return { message: 'Payment config deleted' };
    }

    if (
      existing.ownerScope === 'USER' &&
      !this.canManageUser(currentUser, existing.ownerUserId || '')
    ) {
      throw new ForbiddenException(
        'You cannot delete payment config for this user',
      );
    }

    if (
      existing.ownerScope === 'TENANT' &&
      !this.canManageTenant(currentUser, existing.tenantId || '')
    ) {
      throw new ForbiddenException(
        'You cannot delete payment config for this tenant',
      );
    }

    await this.prisma.paymentConfig.delete({ where: { id } });
    return { message: 'Payment config deleted' };
  }

  async resolveUserGatewayConfig(userId: string | undefined, gateway: string) {
    if (!userId) return null;
    return this.prisma.paymentConfig.findFirst({
      where: {
        ownerScope: 'USER' as never,
        ownerUserId: userId,
        gateway: gateway as never,
        isActive: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async resolveTenantGatewayConfig(
    tenantId: string | undefined,
    gateway: string,
  ) {
    if (!tenantId) return null;
    return this.prisma.paymentConfig.findFirst({
      where: {
        ownerScope: 'TENANT' as never,
        tenantId,
        gateway: gateway as never,
        isActive: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async resolveGatewayConfigForTransaction(input: {
    gateway: string;
    type: string;
    contractId?: string;
    currentUserId: string;
    currentUserTenantId?: string;
  }) {
    const type = String(input.type || '').toUpperCase();

    const contract = input.contractId
      ? await this.prisma.contract.findUnique({
          where: { id: input.contractId },
          select: {
            tenantId: true,
            borrower: { select: { userId: true } },
            tenant: { select: { ownerUserId: true } },
          },
        })
      : null;

    if (type === 'DISBURSEMENT') {
      const borrowerConfig = await this.resolveUserGatewayConfig(
        contract?.borrower?.userId,
        input.gateway,
      );
      if (borrowerConfig) return borrowerConfig;

      return this.resolveTenantGatewayConfig(
        contract?.tenantId || input.currentUserTenantId,
        input.gateway,
      );
    }

    if (type === 'INSTALLMENT_PAYMENT' || type === 'PENALTY_PAYMENT') {
      const tenantConfig = await this.resolveTenantGatewayConfig(
        contract?.tenantId || input.currentUserTenantId,
        input.gateway,
      );
      if (tenantConfig) return tenantConfig;

      return this.resolveUserGatewayConfig(
        contract?.tenant?.ownerUserId || undefined,
        input.gateway,
      );
    }

    const tenantConfig = await this.resolveTenantGatewayConfig(
      contract?.tenantId || input.currentUserTenantId,
      input.gateway,
    );
    if (tenantConfig) return tenantConfig;

    return this.resolveUserGatewayConfig(input.currentUserId, input.gateway);
  }
}
