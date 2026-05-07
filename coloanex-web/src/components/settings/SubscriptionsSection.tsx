import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { Crown, Zap, Clock, CheckCircle2, ChevronRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const activeSub = subscriptionStats.find((s) => s.isSelected) || subscriptionStats.find((s) => s.isBought);

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-border bg-card/30 backdrop-blur-sm overflow-hidden border-t-4 border-t-primary/20">
        <CardHeader className="pb-4 border-b border-border/40 bg-muted/5">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-bold">Plan Infrastructure</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className={cn(
            "p-5 rounded-2xl border transition-all duration-300",
            activeSub ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-muted/5 border-border"
          )}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black uppercase tracking-tight text-foreground">
                      {activeSub ? `${activeSub.plan} Tier` : "No Active Infrastructure"}
                    </p>
                    {activeSub && (
                       <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Active</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">
                    {activeSub 
                      ? `${activeSub.scope} capabilities enabled. Valid until ${activeSub.endsAt ? new Date(activeSub.endsAt).toLocaleDateString() : "Indefinite"}`
                      : "Upgrade to enable platform-sponsored blockchain execution."}
                  </p>
                </div>
              </div>
              <Button
                onClick={goToPricing}
                className="h-10 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold px-6 transition-all active:scale-95"
              >
                Refine Tier <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {activeSub && (
              <div className="mt-6 pt-6 border-t border-border/40 grid grid-cols-1 sm:grid-cols-3 gap-4">
                 {[
                   { label: "Execution Quota", value: activeSub.usedTransactions, icon: Activity },
                   { label: "Availability", value: activeSub.remainingTransactions === null ? "Unlimited" : activeSub.remainingTransactions, icon: Zap },
                   { label: "Temporal Validity", value: activeSub.endsAt ? "Standard" : "Permanent", icon: Clock }
                 ].map((stat, idx) => (
                   <div key={idx} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border border-border">
                         <stat.icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                         <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                         <p className="text-xs font-bold truncate leading-tight">{stat.value}</p>
                      </div>
                   </div>
                 ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
             <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Archive: Past Indices</Label>
             <div className="grid grid-cols-1 gap-2">
                {subscriptionStats.length === 0 ? (
                   <div className="p-8 rounded-2xl border border-dashed border-border/40 bg-muted/5 text-center text-muted-foreground">
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Zero historical records</p>
                   </div>
                ) : (
                  subscriptionStats.map((sub) => (
                    <div key={sub.id} className={cn(
                      "group p-3 rounded-xl border border-border/60 bg-background/50 flex items-center justify-between gap-4 transition-all hover:border-primary/20",
                      sub.isSelected && "ring-1 ring-primary/20 bg-primary/5 border-primary/20"
                    )}>
                      <div className="flex items-center gap-3 min-w-0">
                         <div className={cn(
                           "w-9 h-9 rounded-lg flex items-center justify-center border shrink-0",
                           sub.isSelected ? "bg-primary border-primary/20" : "bg-muted border-border"
                         )}>
                            <Activity className={cn("w-4 h-4", sub.isSelected ? "text-white" : "text-muted-foreground")} />
                         </div>
                         <div className="min-w-0">
                            <div className="flex items-center gap-2">
                               <p className="text-xs font-bold truncate">{sub.plan} Plan</p>
                               <span className={cn(
                                 "text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter",
                                 sub.lifecycleStatus === "EXPIRED" ? "bg-destructive/10 text-destructive" :
                                 sub.lifecycleStatus === "LIMIT_EXCEEDED" ? "bg-amber-500/10 text-amber-600" :
                                 "bg-emerald-500/10 text-emerald-600"
                               )}>{sub.lifecycleStatus}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground transition-colors group-hover:text-primary max-w-[200px] truncate">
                               {sub.usedTransactions} / {sub.remainingTransactions === null ? "∞" : sub.remainingTransactions} • {sub.scope}
                            </p>
                         </div>
                      </div>
                      <div className="shrink-0">
                         {(sub.isBought || sub.status === "ACTIVE" || sub.lifecycleStatus === "EXPIRED") && !sub.isSelected && (
                           <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-tighter hover:text-primary hover:bg-primary/10 transition-all"
                              onClick={() => void handleSelectSubscription(sub.id)}
                              disabled={isSelectingSubscription}
                           >
                              Switch Index
                           </Button>
                         )}
                         {sub.isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-2" />}
                      </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border bg-card/30 backdrop-blur-sm overflow-hidden border-t-4 border-t-primary/20">
        <CardHeader className="pb-4 border-b border-border/40 bg-muted/5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-bold">Standardized Indices</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans
                .filter((p) => p.isActive)
                .map((plan) => {
                   const accent = planAccentByCode[plan.code.toLowerCase()] || {
                     card: "border-border/60 bg-background/50",
                     button: "bg-primary hover:bg-primary/90 text-white",
                     chip: "bg-primary/10 text-primary"
                   };
                   const existing = subscriptionStats.find((s) => s.scope === plan.scope && s.plan === plan.code);
                   const status = existing?.lifecycleStatus || null;

                   return (
                     <div key={plan.id} className={cn(
                       "flex flex-col p-4 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:translate-y-[-2px]",
                       accent.card
                     )}>
                        <div className="flex items-center justify-between gap-2 mb-4">
                           <span className={cn("text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest", accent.chip)}>{plan.scope}</span>
                           {status && status === "BOUGHT" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                        </div>
                        <div className="mb-4">
                           <p className="text-sm font-bold truncate leading-tight">{plan.name}</p>
                           <p className="text-[10px] text-muted-foreground font-medium mt-1 leading-normal line-clamp-2 min-h-[30px]">{plan.description}</p>
                        </div>
                        <div className="mt-auto mb-4 border-t border-border/40 pt-4 flex items-baseline gap-1">
                           <span className="text-xs font-bold leading-none">
                              {plan.currency === "NPR" ? "Rs. " : plan.currency}
                           </span>
                           <span className="text-lg font-black tracking-tight leading-none">{Number(plan.price).toLocaleString()}</span>
                           <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter ml-1">/ {plan.billingCycle}</span>
                        </div>
                        <Button
                           className={cn("w-full h-9 rounded-xl font-bold text-xs transition-all active:scale-95", accent.button)}
                           disabled={isPurchasingSubscription || status === "BOUGHT"}
                           onClick={() => void handleBuyPlanFromSettings(plan)}
                        >
                           {isPurchasingSubscription ? "Querying..." : status === "BOUGHT" ? "Indexed" : Number(plan.price) > 0 ? "Commit" : "Activate"}
                        </Button>
                     </div>
                   );
              })}
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
