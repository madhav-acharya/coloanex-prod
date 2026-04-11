import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { PurchaseSubscriptionDto } from './dto/purchase-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  private computeLifecycleStatus(subscription: {
    status: string;
    startsAt: Date;
    endsAt: Date | null;
    usageCount?: number | null;
    planRef?: {
      maxTransactions?: number | null;
      billingCycle?: string | null;
      features?: unknown;
    } | null;
  }): 'BOUGHT' | 'EXPIRED' | 'LIMIT_EXCEEDED' {
    const now = Date.now();
    const startsAt = subscription.startsAt.getTime();
    const endsAt = subscription.endsAt ? subscription.endsAt.getTime() : null;
    const withinWindow = startsAt <= now && (!endsAt || endsAt >= now);

    if (subscription.status !== 'ACTIVE' || !withinWindow) {
      return 'EXPIRED';
    }

    const maxTransactions = Number(subscription.planRef?.maxTransactions || 0);
    const usageCount = Number(subscription.usageCount || 0);
    if (maxTransactions > 0 && usageCount >= maxTransactions) {
      return 'LIMIT_EXCEEDED';
    }

    return 'BOUGHT';
  }

  private isSelected(metadata: unknown) {
    if (!metadata || typeof metadata !== 'object') return false;
    return Boolean((metadata as Record<string, unknown>).selected);
  }

  private resolvePlanDurationMs(plan: {
    billingCycle: string;
    features: unknown;
  }) {
    const features = (plan.features || {}) as Record<string, unknown>;
    const durationDays = Number(features.durationDays || 0);

    if (Number.isFinite(durationDays) && durationDays > 0) {
      return durationDays * 24 * 60 * 60 * 1000;
    }

    const cycle = String(plan.billingCycle || 'MONTHLY').toUpperCase();
    if (cycle === 'WEEKLY') return 7 * 24 * 60 * 60 * 1000;
    if (cycle === 'YEARLY') return 365 * 24 * 60 * 60 * 1000;
    if (cycle === 'ONCE') return 3650 * 24 * 60 * 60 * 1000;
    return 30 * 24 * 60 * 60 * 1000;
  }

  private ensureSuperAdmin(currentUser: any) {
    if (!currentUser?.roles?.includes('Super Admin')) {
      throw new ForbiddenException('Only Super Admin can manage subscriptions');
    }
  }

  private normalizePlanCode(code: string) {
    return code.trim().toLowerCase();
  }

  async createPlan(dto: CreateSubscriptionPlanDto, currentUser: any) {
    this.ensureSuperAdmin(currentUser);
    const code = this.normalizePlanCode(dto.code);
    return this.prisma.subscriptionPlan.upsert({
      where: { code },
      update: {
        name: dto.name,
        scope: (dto.scope || 'USER') as never,
        description: dto.description,
        features: dto.features as any,
        price: dto.price,
        maxTransactions: dto.maxTransactions ?? 100,
        currency: dto.currency || 'NPR',
        billingCycle: dto.billingCycle || 'MONTHLY',
        isActive: dto.isActive ?? true,
      },
      create: {
        code,
        name: dto.name,
        scope: (dto.scope || 'USER') as never,
        description: dto.description,
        features: dto.features as any,
        price: dto.price,
        maxTransactions: dto.maxTransactions ?? 100,
        currency: dto.currency || 'NPR',
        billingCycle: dto.billingCycle || 'MONTHLY',
        isActive: dto.isActive ?? true,
      },
    });
  }

  listPlans() {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: [{ isActive: 'desc' }, { price: 'asc' }, { code: 'asc' }],
    });
  }

  async updatePlan(
    id: string,
    dto: UpdateSubscriptionPlanDto,
    currentUser: any,
  ) {
    this.ensureSuperAdmin(currentUser);
    const existing = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Subscription plan not found');
    }

    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        code: dto.code ? this.normalizePlanCode(dto.code) : undefined,
        name: dto.name,
        scope: dto.scope as never,
        description: dto.description,
        features: dto.features as any,
        price: dto.price,
        maxTransactions: dto.maxTransactions,
        currency: dto.currency,
        billingCycle: dto.billingCycle,
        isActive: dto.isActive,
      },
    });
  }

  async removePlan(id: string, currentUser: any) {
    this.ensureSuperAdmin(currentUser);

    const existing = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Subscription plan not found');
    }

    await this.prisma.subscriptionPlan.delete({ where: { id } });
    return { message: 'Subscription plan deleted' };
  }

  async create(dto: CreateSubscriptionDto, currentUser: any) {
    this.ensureSuperAdmin(currentUser);
    const planCode = this.normalizePlanCode(dto.plan);

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: planCode },
      select: { code: true, scope: true },
    });
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    if (dto.scope !== plan.scope) {
      throw new ForbiddenException(
        `Plan ${plan.code} is scoped to ${plan.scope} subscriptions`,
      );
    }

    if (dto.scope === 'TENANT') {
      if (!dto.tenantId) {
        throw new ForbiddenException('Tenant subscription requires tenantId');
      }
      return this.prisma.subscription.upsert({
        where: {
          scope_tenantId_plan: {
            scope: 'TENANT' as never,
            tenantId: dto.tenantId,
            plan: planCode,
          },
        },
        update: {
          plan: planCode,
          status: dto.status as never,
          startsAt: new Date(dto.startsAt),
          endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
          userId: null,
          tenantId: dto.tenantId,
          createdBy: currentUser.sub,
        },
        create: {
          scope: 'TENANT' as never,
          plan: planCode,
          status: dto.status as never,
          userId: null,
          tenantId: dto.tenantId,
          startsAt: new Date(dto.startsAt),
          endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
          createdBy: currentUser.sub,
        },
      });
    }

    if (!dto.userId) {
      throw new ForbiddenException('User subscription requires userId');
    }

    return this.prisma.subscription.upsert({
      where: {
        scope_userId_plan: {
          scope: 'USER' as never,
          userId: dto.userId,
          plan: planCode,
        },
      },
      update: {
        plan: planCode,
        status: dto.status as never,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        userId: dto.userId,
        tenantId: null,
        createdBy: currentUser.sub,
      },
      create: {
        scope: 'USER' as never,
        plan: planCode,
        status: dto.status as never,
        userId: dto.userId,
        tenantId: null,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        createdBy: currentUser.sub,
      },
    });
  }

  findAll(currentUser: any) {
    this.ensureSuperAdmin(currentUser);
    return this.prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        tenant: { select: { id: true, name: true } },
      },
    });
  }

  async listMine(currentUser: any) {
    const records = await this.prisma.subscription.findMany({
      where: {
        OR: [
          { scope: 'USER' as never, userId: currentUser.sub },
          currentUser.tenantId
            ? { scope: 'TENANT' as never, tenantId: currentUser.tenantId }
            : undefined,
        ].filter(Boolean) as any,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: { select: { id: true, name: true } },
        planRef: {
          select: {
            code: true,
            name: true,
            maxTransactions: true,
            billingCycle: true,
            currency: true,
            features: true,
          },
        },
      },
    });

    const normalized = records.map((subscription) => {
      const lifecycleStatus = this.computeLifecycleStatus(subscription as any);
      return {
        ...subscription,
        lifecycleStatus,
        isSelected: this.isSelected(subscription.metadata),
      };
    });

    return normalized;
  }

  async purchase(dto: PurchaseSubscriptionDto, currentUser: any) {
    const planCode = this.normalizePlanCode(dto.planCode);
    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: { code: planCode, isActive: true },
      select: {
        code: true,
        price: true,
        scope: true,
        billingCycle: true,
        features: true,
      },
    });
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    if (dto.scope !== plan.scope) {
      throw new ForbiddenException(
        `Plan ${plan.code} is scoped to ${plan.scope} subscriptions`,
      );
    }

    const planPrice = Number(plan.price || 0);
    if (planPrice > 0) {
      if (!dto.paymentTransactionId) {
        throw new ForbiddenException(
          'Paid plans require a successful payment before activation',
        );
      }

      const paymentTx = await this.prisma.transaction.findUnique({
        where: { id: dto.paymentTransactionId },
        select: {
          id: true,
          status: true,
          type: true,
          sentBy: true,
          amount: true,
        },
      });

      if (
        !paymentTx ||
        paymentTx.status !== 'COMPLETED' ||
        paymentTx.type !== 'FEE'
      ) {
        throw new ForbiddenException(
          'Subscription payment transaction is invalid or not completed',
        );
      }

      if (paymentTx.sentBy !== currentUser.sub) {
        throw new ForbiddenException(
          'Subscription payment must be completed by the same user',
        );
      }

      if (Number(paymentTx.amount || 0) < planPrice) {
        throw new ForbiddenException(
          'Subscription payment amount is insufficient for selected plan',
        );
      }
    }

    if (dto.scope === 'TENANT') {
      const tenantId = dto.tenantId || currentUser.tenantId;
      if (!tenantId) {
        throw new ForbiddenException('Tenant subscription requires a tenant');
      }
      const isSuperAdmin = currentUser?.roles?.includes('Super Admin');
      const isBorrower = currentUser?.roles?.includes('Borrower');
      if (!isSuperAdmin && isBorrower) {
        throw new ForbiddenException(
          'Borrowers cannot purchase tenant-level subscriptions.',
        );
      }
      if (!isSuperAdmin && tenantId !== currentUser.tenantId) {
        throw new ForbiddenException('You can only purchase for your tenant');
      }

      const existingSamePlan = await this.prisma.subscription.findFirst({
        where: {
          scope: 'TENANT' as never,
          tenantId,
          plan: planCode,
        },
        include: {
          planRef: {
            select: {
              maxTransactions: true,
              billingCycle: true,
              features: true,
            },
          },
        },
      });

      if (
        existingSamePlan &&
        this.computeLifecycleStatus(existingSamePlan as any) === 'BOUGHT'
      ) {
        throw new ForbiddenException(
          `You already have an active ${planCode} subscription`,
        );
      }

      const existingTenantSubscriptions =
        await this.prisma.subscription.findMany({
          where: {
            scope: 'TENANT' as never,
            tenantId,
          },
        });
      const hasSelectedTenantSubscription = existingTenantSubscriptions.some(
        (s) => this.isSelected(s.metadata),
      );

      const startsAt = new Date();
      const endsAt = new Date(
        startsAt.getTime() + this.resolvePlanDurationMs(plan),
      );

      return this.prisma.subscription.upsert({
        where: {
          scope_tenantId_plan: {
            scope: 'TENANT' as never,
            tenantId,
            plan: planCode,
          },
        },
        update: {
          plan: planCode,
          status: 'ACTIVE' as never,
          startsAt,
          endsAt,
          usageCount: 0,
          usageWindowStart: null,
          metadata: dto.paymentTransactionId
            ? ({
                paymentTransactionId: dto.paymentTransactionId,
                selected: !hasSelectedTenantSubscription,
              } as any)
            : ({ selected: !hasSelectedTenantSubscription } as any),
          userId: null,
          createdBy: currentUser.sub,
        },
        create: {
          scope: 'TENANT' as never,
          plan: planCode,
          status: 'ACTIVE' as never,
          tenantId,
          startsAt,
          endsAt,
          metadata: dto.paymentTransactionId
            ? ({
                paymentTransactionId: dto.paymentTransactionId,
                selected: !hasSelectedTenantSubscription,
              } as any)
            : ({ selected: !hasSelectedTenantSubscription } as any),
          createdBy: currentUser.sub,
        },
      });
    }

    const existingSamePlan = await this.prisma.subscription.findFirst({
      where: {
        scope: 'USER' as never,
        userId: currentUser.sub,
        plan: planCode,
      },
      include: {
        planRef: {
          select: {
            maxTransactions: true,
            billingCycle: true,
            features: true,
          },
        },
      },
    });

    if (
      existingSamePlan &&
      this.computeLifecycleStatus(existingSamePlan as any) === 'BOUGHT'
    ) {
      throw new ForbiddenException(
        `You already have an active ${planCode} subscription`,
      );
    }

    const existingUserSubscriptions = await this.prisma.subscription.findMany({
      where: {
        scope: 'USER' as never,
        userId: currentUser.sub,
      },
    });
    const hasSelectedUserSubscription = existingUserSubscriptions.some((s) =>
      this.isSelected(s.metadata),
    );

    const startsAt = new Date();
    const endsAt = new Date(
      startsAt.getTime() + this.resolvePlanDurationMs(plan),
    );

    return this.prisma.subscription.upsert({
      where: {
        scope_userId_plan: {
          scope: 'USER' as never,
          userId: currentUser.sub,
          plan: planCode,
        },
      },
      update: {
        plan: planCode,
        status: 'ACTIVE' as never,
        startsAt,
        endsAt,
        usageCount: 0,
        usageWindowStart: null,
        metadata: dto.paymentTransactionId
          ? ({
              paymentTransactionId: dto.paymentTransactionId,
              selected: !hasSelectedUserSubscription,
            } as any)
          : ({ selected: !hasSelectedUserSubscription } as any),
        tenantId: null,
        createdBy: currentUser.sub,
      },
      create: {
        scope: 'USER' as never,
        plan: planCode,
        status: 'ACTIVE' as never,
        userId: currentUser.sub,
        startsAt,
        endsAt,
        metadata: dto.paymentTransactionId
          ? ({
              paymentTransactionId: dto.paymentTransactionId,
              selected: !hasSelectedUserSubscription,
            } as any)
          : ({ selected: !hasSelectedUserSubscription } as any),
        createdBy: currentUser.sub,
      },
    });
  }

  async selectSubscription(id: string, currentUser: any) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        planRef: {
          select: {
            maxTransactions: true,
            billingCycle: true,
            features: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.scope === 'USER') {
      if (subscription.userId !== currentUser.sub) {
        throw new ForbiddenException('You cannot select this subscription');
      }
    } else {
      const isSuperAdmin = currentUser?.roles?.includes('Super Admin');
      if (!isSuperAdmin && subscription.tenantId !== currentUser.tenantId) {
        throw new ForbiddenException('You cannot select this subscription');
      }
    }

    const lifecycleStatus = this.computeLifecycleStatus(subscription as any);
    if (lifecycleStatus !== 'BOUGHT') {
      throw new ForbiddenException(
        'Only active and usable subscriptions can be selected',
      );
    }

    const peerWhere =
      subscription.scope === 'USER'
        ? ({
            scope: 'USER' as never,
            userId: subscription.userId,
          } as const)
        : ({
            scope: 'TENANT' as never,
            tenantId: subscription.tenantId,
          } as const);

    const peers = await this.prisma.subscription.findMany({
      where: peerWhere as any,
      select: { id: true, metadata: true },
    });

    await this.prisma.$transaction(
      peers.map((peer) =>
        this.prisma.subscription.update({
          where: { id: peer.id },
          data: {
            metadata: {
              ...((peer.metadata as Record<string, unknown> | null) || {}),
              selected: peer.id === subscription.id,
            } as any,
          },
        }),
      ),
    );

    const updated = await this.prisma.subscription.findUnique({
      where: { id: subscription.id },
      include: {
        tenant: { select: { id: true, name: true } },
        planRef: {
          select: {
            code: true,
            name: true,
            maxTransactions: true,
            billingCycle: true,
            currency: true,
            features: true,
          },
        },
      },
    });

    if (!updated) {
      throw new NotFoundException('Subscription not found after selection');
    }

    return {
      ...updated,
      lifecycleStatus: this.computeLifecycleStatus(updated as any),
      isSelected: true,
    };
  }

  async update(id: string, dto: UpdateSubscriptionDto, currentUser: any) {
    this.ensureSuperAdmin(currentUser);

    const existing = await this.prisma.subscription.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Subscription not found');
    }

    if (dto.plan) {
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { code: this.normalizePlanCode(dto.plan) },
        select: { code: true },
      });
      if (!plan) {
        throw new NotFoundException('Subscription plan not found');
      }
    }

    return this.prisma.subscription.update({
      where: { id },
      data: {
        plan: dto.plan ? this.normalizePlanCode(dto.plan) : undefined,
        status: dto.status as never,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        userId: dto.userId,
        tenantId: dto.tenantId,
      },
    });
  }

  async remove(id: string, currentUser: any) {
    this.ensureSuperAdmin(currentUser);

    const existing = await this.prisma.subscription.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Subscription not found');
    }

    await this.prisma.subscription.delete({ where: { id } });
    return { message: 'Subscription deleted' };
  }
}
