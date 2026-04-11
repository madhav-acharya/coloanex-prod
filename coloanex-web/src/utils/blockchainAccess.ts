import type { Subscription } from "@/apis/subscriptionsApi";
import type { Wallet } from "@/apis/walletsApi";

export type GasPaymentMode = "USER_WALLET" | "PLATFORM_WALLET";
export type ResolvedGasMode = GasPaymentMode | "NOT_CONFIGURED";

const GAS_MODE_LABELS: Record<ResolvedGasMode, string> = {
  USER_WALLET: "User Wallet",
  PLATFORM_WALLET: "Platform Sponsored",
  NOT_CONFIGURED: "Not Configured",
};

export interface BlockchainAccessSnapshot {
  mode: ResolvedGasMode;
  modeLabel: string;
  hasWallet: boolean;
  hasActiveSubscription: boolean;
  hasSubscriptionCapacity: boolean;
  canRunBlockchain: boolean;
  reason?: string;
}

export const formatGasPaymentMode = (mode?: string | null): string => {
  if (mode === "USER_WALLET" || mode === "PLATFORM_WALLET") {
    return GAS_MODE_LABELS[mode];
  }
  return GAS_MODE_LABELS.NOT_CONFIGURED;
};

export const getBlockchainAccessSnapshot = (params: {
  gasPaymentMode?: string | null;
  wallets?: Wallet[];
  subscriptions?: Subscription[];
}): BlockchainAccessSnapshot => {
  const wallets = params.wallets ?? [];
  const subscriptions = params.subscriptions ?? [];

  const hasWallet = wallets.some((wallet) => wallet.isActive !== false);
  const now = Date.now();
  const activeSubscriptions = subscriptions.filter((subscription) => {
    if (subscription.status !== "ACTIVE") return false;

    const startsAt = subscription.startsAt
      ? new Date(subscription.startsAt).getTime()
      : undefined;
    const endsAt = subscription.endsAt
      ? new Date(subscription.endsAt).getTime()
      : undefined;

    if (startsAt && startsAt > now) return false;
    if (endsAt && endsAt < now) return false;
    return true;
  });

  const hasActiveSubscription = activeSubscriptions.length > 0;
  const hasSubscriptionCapacity = activeSubscriptions.some((subscription) => {
    const maxTransactions = Number(subscription.planRef?.maxTransactions || 0);
    const usageCount = Number(subscription.usageCount || 0);

    // maxTransactions <= 0 means unlimited usage for that plan.
    if (maxTransactions <= 0) return true;
    return usageCount < maxTransactions;
  });

  const rawMode = params.gasPaymentMode;
  const mode: ResolvedGasMode =
    rawMode === "USER_WALLET" || rawMode === "PLATFORM_WALLET"
      ? rawMode
      : "NOT_CONFIGURED";

  if (mode === "USER_WALLET") {
    if (!hasWallet) {
      return {
        mode,
        modeLabel: GAS_MODE_LABELS[mode],
        hasWallet,
        hasActiveSubscription,
        hasSubscriptionCapacity,
        canRunBlockchain: false,
        reason: "User Wallet mode requires a connected wallet.",
      };
    }

    return {
      mode,
      modeLabel: GAS_MODE_LABELS[mode],
      hasWallet,
      hasActiveSubscription,
      hasSubscriptionCapacity,
      canRunBlockchain: true,
    };
  }

  if (mode === "PLATFORM_WALLET") {
    if (!hasActiveSubscription) {
      return {
        mode,
        modeLabel: GAS_MODE_LABELS[mode],
        hasWallet,
        hasActiveSubscription,
        hasSubscriptionCapacity,
        canRunBlockchain: false,
        reason: "Platform Sponsored mode requires an active subscription.",
      };
    }

    if (!hasSubscriptionCapacity) {
      return {
        mode,
        modeLabel: GAS_MODE_LABELS[mode],
        hasWallet,
        hasActiveSubscription,
        hasSubscriptionCapacity,
        canRunBlockchain: false,
        reason:
          "Transaction limit reached for your active subscription. Please upgrade or wait for your usage window reset.",
      };
    }

    return {
      mode,
      modeLabel: GAS_MODE_LABELS[mode],
      hasWallet,
      hasActiveSubscription,
      hasSubscriptionCapacity,
      canRunBlockchain: true,
    };
  }

  return {
    mode,
    modeLabel: GAS_MODE_LABELS[mode],
    hasWallet,
    hasActiveSubscription,
    hasSubscriptionCapacity,
    canRunBlockchain: false,
    reason:
      "Connect a wallet for User Wallet mode or activate a subscription for Platform Sponsored mode.",
  };
};
