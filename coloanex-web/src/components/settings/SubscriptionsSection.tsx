import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";

type SubscriptionsSectionProps = {
  subscriptionStats: any[];
  plans: any[];
  planAccentByCode: Record<
    string,
    { card: string; button: string; chip: string }
  >;
  isSelectingSubscription: boolean;
  isPurchasingSubscription: boolean;
  handleSelectSubscription: (id: string) => Promise<void>;
  handleBuyPlanFromSettings: (plan: any) => Promise<void>;
  goToPricing: () => void;
};

export default function SubscriptionsSection({
  subscriptionStats,
  plans,
  planAccentByCode,
  isSelectingSubscription,
  isPurchasingSubscription,
  handleSelectSubscription,
  handleBuyPlanFromSettings,
  goToPricing,
}: SubscriptionsSectionProps) {
  return (
    <Card>
      <CardHeader className="border-b border-border/60 bg-muted/20">
        <CardTitle>Subscriptions</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Pick your gas sponsorship tier and upgrade instantly.
        </p>
      </CardHeader>
      <CardContent className="pt-6 space-y-5">
        <div className="rounded-xl border border-border/70 bg-gradient-to-br from-background via-muted/20 to-background p-4">
          {(() => {
            const activeSub = subscriptionStats.find(
              (subscription) => subscription.isBought,
            );
            return (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Active Subscription
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-lg font-semibold">
                    {activeSub?.plan || "No Active Plan"}
                  </p>
                  {activeSub ? (
                    <span className="text-xs text-muted-foreground">
                      Used {activeSub.usedTransactions} • Remaining{" "}
                      {activeSub.remainingTransactions === null
                        ? "Unlimited"
                        : activeSub.remainingTransactions}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Platform Sponsored gas requires an active subscription.
                </p>
              </>
            );
          })()}
        </div>

        <div className="space-y-2">
          <Label>My Subscription Usage</Label>
          {subscriptionStats.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No subscriptions yet. Buy a plan to enable sponsored gas and
              blockchain workflows.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {subscriptionStats.map((subscription) => (
                <div
                  key={subscription.id}
                  className="rounded-xl border border-border/70 bg-card/60 p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">
                        {subscription.plan} Plan
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {subscription.scope} scope • Valid till{" "}
                        {subscription.endsAt
                          ? new Date(subscription.endsAt).toLocaleDateString()
                          : "Indefinitely"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        subscription.lifecycleStatus === "EXPIRED"
                          ? "destructive"
                          : subscription.lifecycleStatus === "LIMIT_EXCEEDED"
                            ? "outline"
                            : "secondary"
                      }
                      className="text-[10px] font-bold uppercase"
                    >
                      {subscription.lifecycleStatus}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] uppercase tracking-wider font-semibold">
                    <div className="bg-muted/50 p-1.5 rounded-lg text-center">
                      <p className="text-muted-foreground">Used</p>
                      <p className="text-foreground">
                        {subscription.usedTransactions}
                      </p>
                    </div>
                    <div className="bg-muted/50 p-1.5 rounded-lg text-center">
                      <p className="text-muted-foreground">Remaining</p>
                      <p className="text-foreground">
                        {subscription.remainingTransactions === null
                          ? "∞"
                          : subscription.remainingTransactions}
                      </p>
                    </div>
                  </div>

                  <p
                    className={`text-xs mt-1 ${
                      subscription.lifecycleStatus === "EXPIRED"
                        ? "text-destructive"
                        : subscription.lifecycleStatus === "LIMIT_EXCEEDED"
                          ? "text-amber-500"
                          : "text-primary"
                    }`}
                  >
                    {subscription.endsAt
                      ? `Valid till ${new Date(subscription.endsAt).toLocaleDateString()}`
                      : "No expiry date"}
                  </p>
                  {(subscription.isBought ||
                    subscription.status === "ACTIVE") && (
                    <div className="mt-3 flex justify-end">
                      <Button
                        size="sm"
                        variant={
                          subscription.isSelected ? "secondary" : "outline"
                        }
                        disabled={
                          subscription.isSelected || isSelectingSubscription
                        }
                        onClick={() =>
                          void handleSelectSubscription(subscription.id)
                        }
                      >
                        {subscription.isSelected
                          ? "Selected"
                          : "Use This Subscription"}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Available Plans</Label>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {plans
              .filter((plan) => plan.isActive)
              .map((plan) => {
                const accent = planAccentByCode[plan.code.toLowerCase()] || {
                  card: "border-border/70 bg-card/80",
                  button:
                    "bg-primary hover:bg-primary/90 text-primary-foreground",
                  chip: "bg-primary/10 text-primary",
                };

                const existing = subscriptionStats.find(
                  (subscription) =>
                    subscription.scope === plan.scope &&
                    subscription.plan === plan.code,
                );
                const lifecycleStatus = existing?.lifecycleStatus || null;

                return (
                  <div
                    key={plan.id}
                    className={`rounded-xl border p-4 shadow-sm transition-all hover:shadow-lg ${accent.card}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-base">{plan.name}</p>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${accent.chip}`}
                        >
                          {plan.scope}
                        </span>
                        {lifecycleStatus ? (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-muted text-muted-foreground">
                            {lifecycleStatus === "BOUGHT"
                              ? "Bought"
                              : lifecycleStatus === "LIMIT_EXCEEDED"
                                ? "Limit Exceeded"
                                : "Expired"}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {plan.description || "No description"}
                    </p>
                    <p className="text-sm font-semibold mt-2">
                      <span className="inline-flex items-center gap-1">
                        {String(plan.currency || "").toUpperCase() === "NPR" ? (
                          <IconCurrencyRupeeNepalese className="w-4 h-4" />
                        ) : (
                          <span>{plan.currency}</span>
                        )}
                        <span>{Number(plan.price).toLocaleString()}</span>
                      </span>
                      /{plan.billingCycle.toLowerCase()}
                    </p>
                    <Button
                      className={`mt-3 w-full ${accent.button}`}
                      disabled={
                        isPurchasingSubscription || lifecycleStatus === "BOUGHT"
                      }
                      onClick={() => void handleBuyPlanFromSettings(plan)}
                    >
                      {isPurchasingSubscription
                        ? "Processing..."
                        : lifecycleStatus === "BOUGHT"
                          ? "Already Bought"
                          : Number(plan.price || 0) > 0
                            ? `Buy ${plan.name}`
                            : `Activate ${plan.name}`}
                    </Button>
                  </div>
                );
              })}
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={goToPricing}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Buy / Upgrade Subscription
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
