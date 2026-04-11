import { Link, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import PublicLayout from "@/components/layouts/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useMemo, useState } from "react";
import {
  useListMySubscriptionsQuery,
  useListPlansQuery,
  usePurchaseSubscriptionMutation,
} from "@/apis/subscriptionsApi";
import { useToast } from "@/hooks/use-toast";
import { useEsewaPayment } from "@/hooks/useEsewaPayment";
import { useKhaltiPayment } from "@/hooks/useKhaltiPayment";
import { BlockchainProcessingModal } from "@/components/ui/blockchain-processing-modal";

type Gateway = "KHALTI" | "ESEWA";

type PendingPurchase = {
  planCode: string;
  scope: "USER" | "TENANT";
  planPrice: number;
};

const planStyles: Record<
  string,
  { ring: string; button: string; badge: string }
> = {
  free: {
    ring: "ring-1 ring-emerald-300/60",
    button: "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer",
    badge: "bg-emerald-100 text-emerald-700",
  },
  premium: {
    ring: "ring-1 ring-sky-300/60",
    button: "bg-sky-600 hover:bg-sky-700 text-white cursor-pointer",
    badge: "bg-sky-100 text-sky-700",
  },
  pro: {
    ring: "ring-1 ring-amber-300/60",
    button: "bg-amber-600 hover:bg-amber-700 text-white cursor-pointer",
    badge: "bg-amber-100 text-amber-700",
  },
  enterprise: {
    ring: "ring-1 ring-fuchsia-300/60",
    button: "bg-fuchsia-600 hover:bg-fuchsia-700 text-white cursor-pointer",
    badge: "bg-fuchsia-100 text-fuchsia-700",
  },
};

const normalizeFeature = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
};

export default function Pricing() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const isAuthenticated = Boolean(localStorage.getItem("token"));
  const [gateway, setGateway] = useState<Gateway>("KHALTI");
  const [pendingPurchase, setPendingPurchase] =
    useState<PendingPurchase | null>(null);
  const { data: plans = [] } = useListPlansQuery();
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
    // Hide selector before redirect/start so processing modal is not obscured.
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

  return (
    <PublicLayout>
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-hero dark:bg-gradient-dark text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Simple Pricing for Every Lending Team
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Start free and upgrade as your lending workflows scale across
            wallets, gas sponsorship, and tenant-managed payment rails.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Available Plans</h3>
                <span className="text-xs px-3 py-1 rounded-full bg-primary/15 text-primary font-semibold">
                  Choose what fits your lending scale
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {plans
                  .filter((p) => p.isActive)
                  .map((plan) => {
                    const lifecycleStatus = subscriptionStatusByPlanScope.get(
                      `${plan.scope}:${plan.code}`,
                    );
                    const isCurrent = lifecycleStatus === "BOUGHT";
                    const featureItems = normalizeFeature(
                      (plan as any).features,
                    );

                    return (
                      <div
                        key={plan.id}
                        className={`relative rounded-2xl p-5 space-y-4 border bg-gradient-to-b from-card to-muted/30 text-card-foreground shadow-sm ${planStyles[plan.code]?.ring || "ring-1 ring-slate-300/50"}`}
                      >
                        {lifecycleStatus && (
                          <span
                            className={`absolute top-3 right-3 text-xs font-semibold px-2 py-1 rounded-full ${planStyles[plan.code]?.badge || "bg-slate-100 text-slate-700"}`}
                          >
                            {lifecycleStatus === "BOUGHT"
                              ? "Bought"
                              : lifecycleStatus === "LIMIT_EXCEEDED"
                                ? "Limit Exceeded"
                                : "Expired"}
                          </span>
                        )}

                        <p className="font-semibold capitalize text-base">
                          {plan.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {plan.description || "No description"}
                        </p>
                        <p className="text-2xl font-extrabold tracking-tight">
                          {plan.currency} {Number(plan.price).toLocaleString()}
                          <span className="text-xs font-normal text-muted-foreground">
                            /{plan.billingCycle.toLowerCase()}
                          </span>
                        </p>
                        <p className="text-xs font-semibold text-primary/90 bg-primary/10 rounded-md px-2 py-1 inline-block">
                          Max Transactions: {plan.maxTransactions ?? 0}
                        </p>
                        <div className="space-y-1.5 min-h-24">
                          {featureItems.length > 0 ? (
                            featureItems.map((item, idx) => (
                              <p
                                key={`${plan.id}-feature-${idx}`}
                                className="text-xs text-muted-foreground"
                              >
                                • {item}
                              </p>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              • Includes core lending features
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            className={`w-full ${
                              isCurrent
                                ? "bg-muted text-foreground border cursor-not-allowed"
                                : planStyles[plan.code]?.button ||
                                  "bg-primary hover:bg-primary/90 text-primary-foreground"
                            }`}
                            onClick={() =>
                              buyPlan(
                                plan.code,
                                plan.scope,
                                Number(plan.price || 0),
                              )
                            }
                            disabled={isBusy || isCurrent}
                          >
                            {isCurrent
                              ? "Already Bought"
                              : Number(plan.price || 0) > 0
                                ? isAuthenticated
                                  ? "Buy Now"
                                  : "Login to Buy"
                                : isAuthenticated
                                  ? "Activate Now"
                                  : "Login to Activate"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-bold">Plan Comparison</h3>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">
                        Feature
                      </th>
                      {plans
                        .filter((p) => p.isActive)
                        .map((plan) => (
                          <th
                            key={`head-${plan.id}`}
                            className="text-left px-4 py-3 font-semibold capitalize"
                          >
                            {plan.name}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="px-4 py-3 font-medium">Price</td>
                      {plans
                        .filter((p) => p.isActive)
                        .map((plan) => (
                          <td key={`price-${plan.id}`} className="px-4 py-3">
                            {plan.currency}{" "}
                            {Number(plan.price).toLocaleString()} /{" "}
                            {plan.billingCycle.toLowerCase()}
                          </td>
                        ))}
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-3 font-medium">
                        Max Transactions
                      </td>
                      {plans
                        .filter((p) => p.isActive)
                        .map((plan) => (
                          <td key={`tx-${plan.id}`} className="px-4 py-3">
                            {plan.maxTransactions}
                          </td>
                        ))}
                    </tr>
                    {[0, 1, 2, 3].map((idx) => (
                      <tr className="border-t" key={`feat-row-${idx}`}>
                        <td className="px-4 py-3 font-medium">
                          Feature {idx + 1}
                        </td>
                        {plans
                          .filter((p) => p.isActive)
                          .map((plan) => {
                            const feats = normalizeFeature(
                              (plan as any).features,
                            );
                            return (
                              <td
                                key={`feat-${plan.id}-${idx}`}
                                className="px-4 py-3 text-muted-foreground"
                              >
                                {feats[idx] || "-"}
                              </td>
                            );
                          })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {!isAuthenticated && (
            <div className="text-center">
              <Link to="/signup">
                <Button variant="hero" size="lg">
                  Create Account to Subscribe
                </Button>
              </Link>
            </div>
          )}

          {pendingPurchase && (
            <div className="fixed inset-0 z-50 bg-gradient-to-br from-black/80 via-slate-950/75 to-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="relative w-full max-w-md rounded-2xl border border-sky-400/30 bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100 p-5 space-y-4 shadow-2xl">
                <button
                  className="absolute right-3 top-3 rounded-md p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                  onClick={() => setPendingPurchase(null)}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
                <h3 className="text-lg font-semibold">
                  Choose Payment Gateway
                </h3>
                <p className="text-sm text-slate-300">
                  Select how you want to pay for this subscription.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setGateway("KHALTI")}
                    className={`rounded-xl border p-3 flex flex-col items-center gap-2 transition cursor-pointer ${
                      gateway === "KHALTI"
                        ? "border-violet-400 bg-violet-500/15 ring-2 ring-violet-400/25"
                        : "border-slate-700 bg-slate-900/70 hover:border-violet-400/60"
                    }`}
                  >
                    <img
                      src="/khalti-logo.png"
                      alt="Khalti"
                      className="h-10 object-contain"
                    />
                    <span className="text-xs font-semibold text-slate-100">
                      Khalti
                    </span>
                  </button>

                  <button
                    onClick={() => setGateway("ESEWA")}
                    className={`rounded-xl border p-3 flex flex-col items-center gap-2 transition cursor-pointer ${
                      gateway === "ESEWA"
                        ? "border-emerald-400 bg-emerald-500/15 ring-2 ring-emerald-400/25"
                        : "border-slate-700 bg-slate-900/70 hover:border-emerald-400/60"
                    }`}
                  >
                    <img
                      src="/esewa-logo.png"
                      alt="eSewa"
                      className="h-10 object-contain"
                    />
                    <span className="text-xs font-semibold text-slate-100">
                      eSewa
                    </span>
                  </button>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="cursor-pointer border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800"
                    onClick={() => setPendingPurchase(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="cursor-pointer bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:from-sky-600 hover:to-indigo-600"
                    onClick={confirmGatewayPurchase}
                    disabled={isBusy}
                  >
                    Buy Now
                  </Button>
                </div>
              </div>
            </div>
          )}

          <BlockchainProcessingModal
            open={isInitiatingKhalti || isInitiatingEsewa}
            currentStep="blockchain"
            message="Preparing secure payment and recording blockchain request..."
          />
        </div>
      </section>
    </PublicLayout>
  );
}
