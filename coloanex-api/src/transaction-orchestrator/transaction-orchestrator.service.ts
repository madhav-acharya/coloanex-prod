import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { GasResolverService } from './gas-resolver.service';
import { SubscriptionResolverService } from './subscription-resolver.service';
import { TransactionPolicyEngineService } from './transaction-policy-engine.service';
import type {
  OrchestrationDecision,
  OrchestrationInput,
} from './transaction-orchestrator.types';
import { WalletResolverService } from './wallet-resolver.service';

@Injectable()
export class TransactionOrchestratorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionResolver: SubscriptionResolverService,
    private readonly walletResolver: WalletResolverService,
    private readonly gasResolver: GasResolverService,
    private readonly policyEngine: TransactionPolicyEngineService,
  ) {}

  async orchestrate(input: OrchestrationInput): Promise<OrchestrationDecision> {
    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
      select: {
        id: true,
        gasPaymentMode: true,
        tenantId: true,
        roles: {
          select: {
            role: { select: { name: true } },
          },
        },
      },
    });

    if (!user) {
      return {
        eligible: false,
        denialReason: 'User not found',
        scope: 'NONE',
        plan: 'NONE',
        gasPaymentMode: 'PLATFORM_WALLET',
        gasPayer: 'USER',
        featureFlags: {},
      };
    }

    const userRoles = input.userRoles?.length
      ? input.userRoles
      : user.roles.map((r) => r.role.name);
    const isBorrower = userRoles.includes('Borrower');
    const effectivePlatform: 'APP' | 'WEB' =
      input.platform === 'APP' || input.platform === 'WEB'
        ? input.platform
        : isBorrower
          ? 'APP'
          : 'WEB';

    if (input.platform === 'APP' && !isBorrower) {
      return {
        eligible: false,
        denialReason:
          'Mobile app is restricted to Borrower users only. Please use the web platform.',
        scope: 'NONE',
        plan: 'NONE',
        gasPaymentMode: 'PLATFORM_WALLET',
        gasPayer: 'PLATFORM',
        featureFlags: {},
      };
    }

    if (
      effectivePlatform === 'APP' &&
      input.requestedGasPaymentMode === 'USER_WALLET'
    ) {
      return {
        eligible: false,
        denialReason:
          'Wallet mode is not supported in the app. Please switch to Platform Mode (subscription mode).',
        scope: 'NONE',
        plan: 'NONE',
        gasPaymentMode: 'PLATFORM_WALLET',
        gasPayer: 'PLATFORM',
        featureFlags: {},
      };
    }

    const subscriptionResolution =
      await this.subscriptionResolver.resolveActiveSubscription(
        input.userId,
        input.tenantId || user.tenantId || undefined,
      );

    const scope = subscriptionResolution.scope;
    const plan = subscriptionResolution.subscription?.plan || 'NONE';

    const gas = this.gasResolver.resolve(
      effectivePlatform,
      input.requestedGasPaymentMode,
      user.gasPaymentMode as any,
    );

    if (effectivePlatform === 'APP' && input.preferredWalletId) {
      return {
        eligible: false,
        denialReason:
          'Wallet connection is not supported for mobile borrowers. Use subscription-based platform gas.',
        scope,
        plan,
        gasPaymentMode: gas.gasPaymentMode,
        gasPayer: gas.gasPayer,
        featureFlags: {},
        subscriptionId: subscriptionResolution.subscription?.id,
      };
    }

    if (gas.gasPayer === 'PLATFORM' && !subscriptionResolution.subscription) {
      return {
        eligible: false,
        denialReason:
          subscriptionResolution.denialReason ||
          'No valid subscription found for platform-paid gas.',
        scope,
        plan,
        gasPaymentMode: gas.gasPaymentMode,
        gasPayer: gas.gasPayer,
        featureFlags: {},
      };
    }

    const wallet = await this.walletResolver.resolveWallet(
      input.userId,
      effectivePlatform,
      input.preferredWalletId,
      gas.gasPayer === 'USER' ? 'GAS' : 'PRIMARY',
    );

    const policy = await this.policyEngine.evaluate({
      scope,
      plan,
      userId: input.userId,
      transactionType: input.transactionType,
      subscriptionId: subscriptionResolution.subscription?.id,
      requiresSubscription: gas.gasPayer === 'PLATFORM',
    });

    if (gas.gasPayer === 'USER' && !wallet) {
      return {
        eligible: false,
        denialReason: 'No active wallet available for user-paid gas',
        scope,
        plan,
        gasPaymentMode: gas.gasPaymentMode,
        gasPayer: gas.gasPayer,
        featureFlags: policy.featureFlags,
        subscriptionId: subscriptionResolution.subscription?.id,
      };
    }

    if (!policy.eligible) {
      return {
        eligible: false,
        denialReason: policy.denialReason,
        scope,
        plan,
        gasPaymentMode: gas.gasPaymentMode,
        gasPayer: gas.gasPayer,
        featureFlags: policy.featureFlags,
        subscriptionId: subscriptionResolution.subscription?.id,
        walletId: wallet?.id,
        walletProvider: wallet?.provider as any,
      };
    }

    return {
      eligible: true,
      scope,
      plan,
      gasPaymentMode: gas.gasPaymentMode,
      gasPayer: gas.gasPayer,
      walletId: wallet?.id,
      walletProvider: wallet?.provider as any,
      subscriptionId: subscriptionResolution.subscription?.id,
      featureFlags: policy.featureFlags,
      evaluationData: {
        platform: effectivePlatform,
        userGasPreference: user.gasPaymentMode,
        activeSubscriptionScope: scope,
      },
    };
  }

  async persistEvaluation(input: {
    transactionId: string;
    decision: OrchestrationDecision;
  }) {
    return {
      transactionId: input.transactionId,
      eligible: input.decision.eligible,
    };
  }
}
