import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TransactionPolicyEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluate(input: {
    scope: 'USER' | 'TENANT' | 'NONE';
    plan: string;
    userId: string;
    transactionType: string;
    subscriptionId?: string;
    requiresSubscription?: boolean;
  }) {
    if (
      input.requiresSubscription &&
      (!input.subscriptionId || input.plan === 'NONE')
    ) {
      return {
        eligible: false,
        planCode: undefined,
        featureFlags: {},
        denialReason:
          'A valid subscription is required for PLATFORM_WALLET transactions.',
      };
    }

    if (input.scope === 'NONE' || input.plan === 'NONE') {
      return {
        eligible: true,
        planCode: undefined,
        featureFlags: {},
        denialReason: undefined,
      };
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: input.plan },
      select: {
        code: true,
        maxTransactions: true,
        billingCycle: true,
        features: true,
      },
    });

    const maxTransactions = Number(plan?.maxTransactions || 0);
    const policyFeatures =
      (plan?.features as Record<string, unknown> | null) || {};

    const rawWindowDays = Number(
      (policyFeatures?.usageWindowDays as number | string | undefined) || 0,
    );
    const usageWindowDays =
      Number.isFinite(rawWindowDays) && rawWindowDays > 0
        ? rawWindowDays
        : plan?.billingCycle === 'YEARLY'
          ? 365
          : plan?.billingCycle === 'WEEKLY'
            ? 7
            : 30;

    if (input.subscriptionId && maxTransactions > 0) {
      const subscription = await this.prisma.subscription.findUnique({
        where: { id: input.subscriptionId },
        select: { usageCount: true, usageWindowStart: true },
      });

      if (subscription?.usageWindowStart) {
        const elapsedMs = Date.now() - subscription.usageWindowStart.getTime();
        const windowMs = usageWindowDays * 24 * 60 * 60 * 1000;
        if (elapsedMs > windowMs) {
          await this.prisma.subscription.update({
            where: { id: input.subscriptionId },
            data: {
              usageCount: 0,
              usageWindowStart: new Date(),
            },
          });
        }
      }

      const freshSubscription = await this.prisma.subscription.findUnique({
        where: { id: input.subscriptionId },
        select: { usageCount: true },
      });

      if (
        freshSubscription &&
        freshSubscription.usageCount >= maxTransactions
      ) {
        return {
          eligible: false,
          planCode: plan?.code,
          featureFlags: { maxTransactions, usageWindowDays },
          denialReason: 'Transaction limit reached for current plan',
        };
      }
    }

    return {
      eligible: true,
      planCode: plan?.code,
      featureFlags: { maxTransactions, usageWindowDays },
      denialReason: undefined,
    };
  }
}
