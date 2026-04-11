import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SubscriptionResolverService {
  constructor(private readonly prisma: PrismaService) {}

  private isSubscriptionActive(subscription: {
    status: string;
    startsAt: Date;
    endsAt: Date | null;
  }) {
    const now = new Date();
    const withinWindow =
      subscription.startsAt <= now &&
      (!subscription.endsAt || subscription.endsAt >= now);
    return subscription.status === 'ACTIVE' && withinWindow;
  }

  private isSelected(metadata: unknown) {
    if (!metadata || typeof metadata !== 'object') return false;
    return Boolean((metadata as Record<string, unknown>).selected);
  }

  private getUsageWindowDays(plan: {
    billingCycle?: string | null;
    features?: unknown;
  }) {
    const features = (plan.features || {}) as Record<string, unknown>;
    const rawWindowDays = Number(
      (features.usageWindowDays as number | string | undefined) || 0,
    );
    if (Number.isFinite(rawWindowDays) && rawWindowDays > 0) {
      return rawWindowDays;
    }
    const cycle = String(plan.billingCycle || 'MONTHLY').toUpperCase();
    if (cycle === 'YEARLY') return 365;
    if (cycle === 'WEEKLY') return 7;
    return 30;
  }

  private async ensureWindowFresh(subscription: {
    id: string;
    usageWindowStart: Date | null;
    planRef: {
      billingCycle: string | null;
      features: unknown;
    };
  }) {
    if (!subscription.usageWindowStart) return;
    const usageWindowDays = this.getUsageWindowDays(subscription.planRef);
    const elapsedMs = Date.now() - subscription.usageWindowStart.getTime();
    const windowMs = usageWindowDays * 24 * 60 * 60 * 1000;
    if (elapsedMs <= windowMs) return;

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        usageCount: 0,
        usageWindowStart: new Date(),
      },
    });
  }

  private isLimitReached(subscription: {
    usageCount: number;
    planRef: {
      maxTransactions: number;
    };
  }) {
    const maxTransactions = Number(subscription.planRef.maxTransactions || 0);
    if (maxTransactions <= 0) return false;
    return Number(subscription.usageCount || 0) >= maxTransactions;
  }

  async resolveActiveSubscription(userId: string, tenantId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, tenantId: true },
    });

    const effectiveTenantId = tenantId || user?.tenantId || undefined;

    const tenantSubscriptions = effectiveTenantId
      ? await this.prisma.subscription.findMany({
          where: {
            scope: 'TENANT' as never,
            tenantId: effectiveTenantId,
          },
          orderBy: { createdAt: 'desc' },
          include: {
            planRef: {
              select: {
                maxTransactions: true,
                billingCycle: true,
                features: true,
              },
            },
          },
        })
      : [];

    if (tenantSubscriptions.length > 0) {
      for (const subscription of tenantSubscriptions) {
        await this.ensureWindowFresh(subscription as any);
      }

      const freshTenantSubscriptions = await this.prisma.subscription.findMany({
        where: {
          scope: 'TENANT' as never,
          tenantId: effectiveTenantId,
        },
        orderBy: { createdAt: 'desc' },
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

      const usableTenantSubscriptions = freshTenantSubscriptions.filter(
        (subscription) =>
          this.isSubscriptionActive(subscription) &&
          !this.isLimitReached(subscription as any),
      );

      if (usableTenantSubscriptions.length > 0) {
        const selected = usableTenantSubscriptions.find((subscription) =>
          this.isSelected(subscription.metadata),
        );
        return {
          scope: 'TENANT' as const,
          subscription: selected || usableTenantSubscriptions[0],
          tenantId: effectiveTenantId,
          hasSubscriptionRecord: true,
          denialReason: undefined,
        };
      }

      return {
        scope: 'TENANT' as const,
        subscription: null,
        tenantId: effectiveTenantId,
        hasSubscriptionRecord: true,
        denialReason:
          'No tenant subscription is currently usable. Renew or select USER_WALLET mode.',
      };
    }

    const userSubscriptions = await this.prisma.subscription.findMany({
      where: {
        scope: 'USER' as never,
        userId,
      },
      orderBy: { createdAt: 'desc' },
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

    if (userSubscriptions.length > 0) {
      for (const subscription of userSubscriptions) {
        await this.ensureWindowFresh(subscription as any);
      }

      const freshUserSubscriptions = await this.prisma.subscription.findMany({
        where: {
          scope: 'USER' as never,
          userId,
        },
        orderBy: { createdAt: 'desc' },
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

      const usableUserSubscriptions = freshUserSubscriptions.filter(
        (subscription) =>
          this.isSubscriptionActive(subscription) &&
          !this.isLimitReached(subscription as any),
      );

      if (usableUserSubscriptions.length > 0) {
        const selected = usableUserSubscriptions.find((subscription) =>
          this.isSelected(subscription.metadata),
        );
        return {
          scope: 'USER' as const,
          subscription: selected || usableUserSubscriptions[0],
          tenantId: effectiveTenantId,
          hasSubscriptionRecord: true,
          denialReason: undefined,
        };
      }

      return {
        scope: 'USER' as const,
        subscription: null,
        tenantId: effectiveTenantId,
        hasSubscriptionRecord: true,
        denialReason:
          'No user subscription is currently usable. Renew subscription or switch to USER_WALLET.',
      };
    }

    return {
      scope: 'NONE' as const,
      subscription: null,
      tenantId: effectiveTenantId,
      hasSubscriptionRecord: false,
      denialReason:
        'No active subscription found. Please purchase subscription or switch to USER_WALLET.',
    };
  }

  async consumeUsage(subscriptionId?: string) {
    if (!subscriptionId) return;
    const existing = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: { usageWindowStart: true },
    });

    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        usageCount: { increment: 1 },
        usageWindowStart: existing?.usageWindowStart
          ? undefined
          : { set: new Date() },
      },
    });
  }
}
