import { Link, useNavigate } from "react-router-dom";
import { X, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import PublicLayout from "@/components/layouts/PublicLayout";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Info } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Skeleton } from "@/components/ui/skeleton";
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

const planAccentByCode: Record<
  string,
  { card: string; button: string; chip: string }
> = {
  free: {
    card: "border-primary/40 bg-gradient-to-br from-emerald-500/10 to-transparent",
    button:
      "bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/80",
    chip: "bg-primary/10 text-emerald-600 dark:text-emerald-400 font-bold",
  },
  premium: {
    card: "border-sky-400/40 bg-gradient-to-br from-sky-500/10 to-transparent",
    button: "bg-sky-600 hover:bg-sky-700 text-white border border-sky-500/80",
    chip: "bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold",
  },
  pro: {
    card: "border-amber-400/40 bg-gradient-to-br from-amber-500/10 to-transparent",
    button:
      "bg-amber-600 hover:bg-amber-700 text-white border border-amber-500/80",
    chip: "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold",
  },
  enterprise: {
    card: "border-fuchsia-400/40 bg-gradient-to-br from-fuchsia-500/10 to-transparent",
    button:
      "bg-fuchsia-600 hover:bg-fuchsia-700 text-white border border-fuchsia-500/80",
    chip: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 font-bold",
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

  const PricingContent = (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans
          .filter((p) => p.isActive)
          .map((plan) => {
            const lifecycleStatus = subscriptionStatusByPlanScope.get(
              `${plan.scope}:${plan.code}`,
            );
            const isCurrent = lifecycleStatus === "BOUGHT";
            const featureItems = normalizeFeature((plan as any).features);
            const accent = planAccentByCode[plan.code.toLowerCase()] ||
              planAccentByCode.free;

            return (
              <Card
                key={plan.id}
                className={`flex flex-col relative overflow-hidden transition-all hover:shadow-lg ${accent.card}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="capitalize text-xl font-bold">
                          {plan.name}
                        </CardTitle>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${accent.chip}`}>
                          {plan.scope}
                        </span>
                      </div>
                      <CardDescription className="line-clamp-2 mt-1 min-h-[40px] text-foreground/70">
                        {plan.description || "Scalable lending plan"}
                      </CardDescription>
                    </div>
                    {isCurrent && (
                      <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/20 font-bold">
                        Current
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col pt-0">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">
                      {plan.currency} {Number(plan.price).toLocaleString()}
                    </span>
                    <span className="text-muted-foreground ml-1 text-sm">
                      /{plan.billingCycle.toLowerCase()}
                    </span>
                  </div>

                  <div className="space-y-3 mb-8 flex-1">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <Check className="w-4 h-4 text-primary" />
                      <span>{plan.maxTransactions} Max Tx/mo</span>
                    </div>
                    {featureItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-sm text-foreground/80"
                      >
                        <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary/70" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className={`w-full font-bold shadow-sm transition-all ${accent.button}`}
                    onClick={() =>
                      buyPlan(plan.code, plan.scope, Number(plan.price || 0))
                    }
                    disabled={isBusy || isCurrent}
                  >
                    {isCurrent
                      ? "Plan Active"
                      : Number(plan.price || 0) > 0
                        ? "Upgrade Now"
                        : "Connect & Activate"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
      </div>

      <Card className="border-border/60 overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle>Compare Features</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Requirement</th>
                  {plans
                    .filter((p) => p.isActive)
                    .map((p) => (
                      <th
                        key={p.id}
                        className="text-left p-4 font-semibold capitalize"
                      >
                        {p.name}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4 font-medium italic">Monthly Access</td>
                  {plans
                    .filter((p) => p.isActive)
                    .map((p) => (
                      <td key={p.id} className="p-4">
                        {p.currency} {Number(p.price).toLocaleString()}
                      </td>
                    ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium italic">Transaction Cap</td>
                  {plans
                    .filter((p) => p.isActive)
                    .map((p) => (
                      <td key={p.id} className="p-4">
                        {p.maxTransactions}
                      </td>
                    ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {pendingPurchase && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-2 border-primary/20 bg-card">
            <CardHeader className="relative">
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Select your preferred gateway</CardDescription>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={() => setPendingPurchase(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className={`h-24 flex flex-col gap-2 transition-all ${gateway === "KHALTI" ? "border-primary bg-primary/5" : ""}`}
                  onClick={() => setGateway("KHALTI")}
                >
                  <img src="./images/khalti.png" alt="Khalti" className="h-8" />
                  <span className="text-xs">Khalti</span>
                </Button>
                <Button
                  variant="outline"
                  className={`h-24 flex flex-col gap-2 transition-all ${gateway === "ESEWA" ? "border-primary bg-primary/5" : ""}`}
                  onClick={() => setGateway("ESEWA")}
                >
                  <img src="./images/esewa.png" alt="eSewa" className="h-8" />
                  <span className="text-xs">eSewa</span>
                </Button>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="ghost" onClick={() => setPendingPurchase(null)}>
                  Cancel
                </Button>
                <Button onClick={confirmGatewayPurchase} disabled={isBusy}>
                  {isBusy ? "Processing..." : "Complete Purchase"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  return (
    <PublicLayout>
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          {!isAuthenticated ? (
            <div className="text-center mb-16">
              <h1 className="text-4xl font-bold mb-4">
                Flexible Scaling for Lending
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Start free and scale your operations globally with our
                multi-tenant blockchain infrastructure.
              </p>
            </div>
          ) : (
            <div className="mb-10 text-center">
              <h1 className="text-3xl font-bold">Pricing & Plans</h1>
              <p className="text-muted-foreground">
                Manage your subscription and billing
              </p>
            </div>
          )}
          
          {plans.length === 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
               {[1, 2, 3, 4].map(idx => (
                 <div key={idx} className="h-[450px] rounded-xl border border-border/50 bg-card p-6 flex flex-col gap-4 shadow-sm">
                   <Skeleton className="h-6 w-3/4 mb-2" />
                   <Skeleton className="h-10 w-1/2 mb-8" />
                   <div className="space-y-4 flex-1">
                     <Skeleton className="h-4 w-full" />
                     <Skeleton className="h-4 w-full" />
                     <Skeleton className="h-4 w-full" />
                     <Skeleton className="h-4 w-3/4" />
                   </div>
                   <Skeleton className="h-12 w-full mt-auto" />
                 </div>
               ))}
            </div>
          ) : (
            PricingContent
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
