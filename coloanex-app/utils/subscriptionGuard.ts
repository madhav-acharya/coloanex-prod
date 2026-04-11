import { subscriptionsApi } from "@/api";

export async function ensureActiveSubscription(
  showToast: (message: string, type?: any) => void,
): Promise<boolean> {
  try {
    const subscriptions = await subscriptionsApi.listMine().catch(() => []);
    const now = Date.now();
    const activeSubscriptions = subscriptions.filter((subscription) => {
      if (String(subscription?.status).toUpperCase() !== "ACTIVE") return false;

      const startsAt = subscription?.startsAt
        ? new Date(subscription.startsAt).getTime()
        : undefined;
      const endsAt = subscription?.endsAt
        ? new Date(subscription.endsAt).getTime()
        : undefined;

      if (startsAt && startsAt > now) return false;
      if (endsAt && endsAt < now) return false;
      return true;
    });

    const hasActiveSubscription = activeSubscriptions.length > 0;

    if (!hasActiveSubscription) {
      showToast(
        "Active subscription required. Please take a subscription plan first.",
        "warning",
      );
      return false;
    }

    const hasSubscriptionCapacity = activeSubscriptions.some((subscription) => {
      const maxTransactions = Number(
        subscription?.planRef?.maxTransactions || 0,
      );
      const usageCount = Number(subscription?.usageCount || 0);
      if (maxTransactions <= 0) return true;
      return usageCount < maxTransactions;
    });

    if (!hasSubscriptionCapacity) {
      showToast(
        "Transaction limit reached for your active subscription. Please upgrade your plan or wait for usage reset.",
        "warning",
      );
      return false;
    }

    return true;
  } catch {
    showToast(
      "Unable to verify subscription right now. Please try again from Pricing.",
      "warning",
    );
    return false;
  }
}
