import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import PublicLayout from "@/components/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  useListMySubscriptionsQuery,
  useListPlansQuery,
  usePurchaseSubscriptionMutation,
} from "@/apis/subscriptionsApi";
import { useToast } from "@/hooks/use-toast";
import { useEsewaPayment } from "@/hooks/useEsewaPayment";
import { useKhaltiPayment } from "@/hooks/useKhaltiPayment";
import { BlockchainProcessingModal } from "@/components/ui/blockchain-processing-modal";
import { PageShell } from "@/components/shared/PageShell";
import { useRevealOnView } from "@/hooks/useReveal";
import { Bone } from "@/components/shared/Bone";
import { cn } from "@/lib/utils";

type Gateway = "KHALTI" | "ESEWA";

type PendingPurchase = {
  planCode: string;
  scope: "USER" | "TENANT";
  planPrice: number;
};

const normalizeFeature = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
};

interface PricingProps {
  showFooter?: boolean;
  isSubcomponent?: boolean;
}

export default function Pricing({
  showFooter = true,
  isSubcomponent = false,
}: PricingProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const isAuthenticated = Boolean(localStorage.getItem("token"));
  const [gateway, setGateway] = useState<Gateway>("KHALTI");
  const [pendingPurchase, setPendingPurchase] =
    useState<PendingPurchase | null>(null);
  const { data: plans = [], isLoading } = useListPlansQuery();
  const { data: mySubscriptions = [], refetch: refetchSubs } =
    useListMySubscriptionsQuery(undefined, { skip: !isAuthenticated });
  const [purchaseSubscription, { isLoading: isPurchasing }] =
    usePurchaseSubscriptionMutation();
  const {
    pay: payKhalti,
    isInitiating: isInitiatingKhalti,
    isVerifying: isVerifyingKhalti,
  } = useKhaltiPayment();
  const {
    pay: payEsewa,
    isInitiating: isInitiatingEsewa,
    isVerifying: isVerifyingEsewa,
  } = useEsewaPayment();
  const ref = useRevealOnView();

  const subscriptionStatusByPlanScope = useMemo(() => {
    const map = new Map<string, "BOUGHT" | "EXPIRED" | "LIMIT_EXCEEDED">();
    for (const subscription of mySubscriptions) {
      const key = `${subscription.scope}:${subscription.plan}`;
      const status = subscription.lifecycleStatus || "EXPIRED";
      const existing = map.get(key);
      if (!existing || existing !== "BOUGHT") {
        map.set(key, status);
      }
      if (status === "BOUGHT") {
        map.set(key, "BOUGHT");
      }
    }
    return map;
  }, [mySubscriptions]);

  const buyPlan = async (
    planCode: string,
    scope: "USER" | "TENANT",
    planPrice: number,
  ) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const existingStatus = subscriptionStatusByPlanScope.get(
      `${scope}:${planCode}`,
    );
    if (existingStatus === "BOUGHT") {
      toast({
        title: "Already purchased",
        description: `You already have an active ${planCode} subscription.`,
        variant: "destructive",
      });
      return;
    }

    if (scope === "TENANT" && !user?.tenantId) {
      toast({
        title: "Tenant required",
        description:
          "This plan is tenant-scoped. Please join or create a tenant first.",
        variant: "destructive",
      });
      return;
    }

    if (planPrice <= 0) {
      try {
        await purchaseSubscription({
          planCode,
          scope,
          tenantId: scope === "TENANT" ? user?.tenantId : undefined,
        }).unwrap();
        await refetchSubs();
        toast({ title: "Subscription activated", description: planCode });
      } catch (error: any) {
        toast({
          title: "Purchase failed",
          description: error?.data?.message || "Try again",
          variant: "destructive",
        });
      }
      return;
    }

    setPendingPurchase({ planCode, scope, planPrice });
  };

  const confirmGatewayPurchase = async () => {
    if (!pendingPurchase) return;

    const { planCode, scope, planPrice } = pendingPurchase;
    setPendingPurchase(null);
    const pendingSubscriptionContext = {
      planCode,
      scope,
      tenantId: scope === "TENANT" ? user?.tenantId : undefined,
      planPrice,
      ts: Date.now(),
    };
    sessionStorage.setItem(
      "web_pending_subscription_purchase",
      JSON.stringify(pendingSubscriptionContext),
    );
    localStorage.setItem(
      "web_pending_subscription_purchase",
      JSON.stringify(pendingSubscriptionContext),
    );

    const successPath = `/payment/success?context=subscription&planCode=${encodeURIComponent(planCode)}&scope=${scope}&amount=${encodeURIComponent(String(planPrice))}`;
    const failurePath = `/payment/failure?context=subscription&planCode=${encodeURIComponent(planCode)}&scope=${scope}&amount=${encodeURIComponent(String(planPrice))}`;

    try {
      if (gateway === "KHALTI") {
        await payKhalti({
          amount: planPrice,
          type: "FEE",
          gasPaymentMode: "PLATFORM_WALLET",
          platform: "WEB",
          successPath,
          failurePath,
        });
      } else {
        await payEsewa({
          amount: planPrice,
          type: "FEE",
          gasPaymentMode: "PLATFORM_WALLET",
          platform: "WEB",
          successPath,
          failurePath,
        });
      }
    } catch (error: any) {
      toast({
        title: "Checkout failed",
        description: error?.data?.message || "Unable to start payment",
        variant: "destructive",
      });
    }
  };

  const isBusy =
    isPurchasing ||
    isInitiatingKhalti ||
    isVerifyingKhalti ||
    isInitiatingEsewa ||
    isVerifyingEsewa;

  const activePlans = plans.filter((p) => p.isActive);

  const PricingContent = (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        "relative",
        isSubcomponent ? "py-20 md:py-28" : "pt-24 pb-20",
      )}
    >
      <PageShell className="relative z-10 space-y-10">
        <div className="max-w-2xl">
          <p
            data-reveal
            className="text-xs font-bold uppercase tracking-[0.22em] text-primary mb-3 leading-normal"
          >
            Pricing
          </p>
          <h2
            data-reveal
            className="text-3xl md:text-5xl font-extrabold font-[family-name:var(--font-headline)] leading-snug mb-4"
          >
            Plans that sponsor gas
          </h2>
          <p
            data-reveal
            className="text-muted-foreground text-base md:text-lg leading-relaxed"
          >
            Platform wallet mode needs an active subscription. Pick a plan that
            matches your transaction volume.
          </p>
        </div>

        <Bone name="pricing-plans" loading={isLoading} minHeight={320}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {activePlans.map((plan) => {
              const lifecycleStatus = subscriptionStatusByPlanScope.get(
                `${plan.scope}:${plan.code}`,
              );
              const isCurrent = lifecycleStatus === "BOUGHT";
              const featureItems = normalizeFeature((plan as any).features);

              return (
                <div
                  key={plan.id}
                  className="rounded-2xl border border-border/50 bg-card/80 p-5 md:p-6 flex flex-col"
                >
                  <div data-reveal className="flex flex-col h-full">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="text-xl font-bold capitalize text-foreground leading-snug">
                          {plan.name}
                        </h3>
                        <p className="text-xs font-bold uppercase tracking-wider text-primary mt-1.5 leading-normal">
                          {plan.scope}
                        </p>
                      </div>
                      {isCurrent && (
                        <Badge className="bg-primary/15 text-primary border-primary/20">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground min-h-[40px] mb-4 leading-relaxed">
                      {plan.description || "Scalable lending plan"}
                    </p>
                    <p className="text-3xl font-extrabold text-foreground font-[family-name:var(--font-headline)] mb-1 leading-snug">
                      {plan.price <= 0
                        ? "Free"
                        : `NPR ${Number(plan.price).toLocaleString("en-IN")}`}
                    </p>
                    <p className="text-xs text-muted-foreground mb-5">
                      {plan.billingCycle} · {plan.maxTransactions || "∞"} tx
                    </p>
                    <ul className="space-y-2 mb-6 flex-1">
                      {(featureItems.length
                        ? featureItems
                        : ["Platform gas", "Blockchain writes", "Support"]
                      )
                        .slice(0, 5)
                        .map((f) => (
                          <li
                            key={f}
                            className="flex items-start gap-2 text-xs text-foreground/80"
                          >
                            <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                            {f}
                          </li>
                        ))}
                    </ul>
                    <Button
                      disabled={isBusy || isCurrent}
                      className="w-full rounded-xl h-11 font-bold"
                      onClick={() =>
                        buyPlan(plan.code, plan.scope, Number(plan.price))
                      }
                    >
                      {isCurrent ? "Active" : "Choose plan"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Bone>
      </PageShell>

      {pendingPurchase && (
        <div className="fixed inset-0 z-[100] bg-background/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-foreground">
                Choose gateway
              </h3>
              <button
                type="button"
                onClick={() => setPendingPurchase(null)}
                className="p-2 rounded-lg hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Pay NPR {pendingPurchase.planPrice.toLocaleString("en-IN")} for{" "}
              {pendingPurchase.planCode}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(["KHALTI", "ESEWA"] as Gateway[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGateway(g)}
                  className={cn(
                    "rounded-xl border p-4 text-sm font-bold transition-colors",
                    gateway === g
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:bg-muted/40",
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
            <Button
              className="w-full rounded-xl h-11 font-bold"
              disabled={isBusy}
              onClick={confirmGatewayPurchase}
            >
              Continue to {gateway}
            </Button>
          </div>
        </div>
      )}

      <BlockchainProcessingModal
        open={isVerifyingKhalti || isVerifyingEsewa}
      />
    </div>
  );

  if (isSubcomponent) return PricingContent;
  return <PublicLayout showFooter={showFooter}>{PricingContent}</PublicLayout>;
}
