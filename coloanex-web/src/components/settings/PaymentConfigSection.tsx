import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Plus, Trash2, Settings2, Globe, ShieldCheck, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentConfigSectionProps = {
  paymentConfigs: any[];
  connectedGatewayTypes: Array<"ESEWA" | "KHALTI">;
  gatewayLogoByType: Record<"ESEWA" | "KHALTI", string>;
  showAddPaymentConfig: boolean;
  setShowAddPaymentConfig: (value: boolean) => void;
  configScope: "USER" | "TENANT";
  setConfigScope: (value: "USER" | "TENANT") => void;
  configGateway: "ESEWA" | "KHALTI";
  setConfigGateway: (value: "ESEWA" | "KHALTI") => void;
  configEnvironment: "sandbox" | "production";
  setConfigEnvironment: (value: "sandbox" | "production") => void;
  paymentConfigPlaceholders: {
    merchantId: string;
    publicKey: string;
    secretKey: string;
    webhookUrl: string;
  };
  configMerchantId: string;
  setConfigMerchantId: (value: string) => void;
  configPublicKey: string;
  setConfigPublicKey: (value: string) => void;
  configSecretKey: string;
  setConfigSecretKey: (value: string) => void;
  configWebhookUrl: string;
  setConfigWebhookUrl: (value: string) => void;
  isSavingConfig: boolean;
  savePaymentConfig: () => Promise<void>;
  deletePaymentConfig: (payload: { id: string }) => Promise<any>;
  refetchConfigs: () => Promise<any>;
};

export default function PaymentConfigSection({
  paymentConfigs,
  connectedGatewayTypes,
  gatewayLogoByType,
  showAddPaymentConfig,
  setShowAddPaymentConfig,
  configScope,
  setConfigScope,
  configGateway,
  setConfigGateway,
  configEnvironment,
  setConfigEnvironment,
  paymentConfigPlaceholders,
  configMerchantId,
  setConfigMerchantId,
  configPublicKey,
  setConfigPublicKey,
  configSecretKey,
  setConfigSecretKey,
  configWebhookUrl,
  setConfigWebhookUrl,
  isSavingConfig,
  savePaymentConfig,
  deletePaymentConfig,
  refetchConfigs,
}: PaymentConfigSectionProps) {
  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-border bg-card/30 backdrop-blur-sm overflow-hidden border-t-4 border-t-primary/20">
        <CardHeader className="pb-4 border-b border-border/40 bg-muted/5 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-bold">Transaction Infrastructure</CardTitle>
          </div>
          {!showAddPaymentConfig && (
            <Button
              onClick={() => setShowAddPaymentConfig(true)}
              className="h-8 rounded-lg bg-primary hover:bg-primary/90 text-[10px] font-black uppercase tracking-widest px-4 transition-all active:scale-95 shadow-lg shadow-primary/10"
            >
              New Endpoint <Plus className="w-3 h-3 ml-1" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {showAddPaymentConfig ? (
            <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Scope</Label>
                     <div className="flex gap-1 bg-background p-1 rounded-xl border border-border/60">
                        {["USER", "TENANT"].map((s) => (
                           <button
                              key={s}
                              onClick={() => setConfigScope(s as any)}
                              className={cn(
                                "flex-1 h-8 rounded-lg text-[10px] font-bold uppercase transition-all",
                                configScope === s ? "bg-primary text-white shadow-sm" : "hover:bg-muted text-muted-foreground"
                              )}
                           >
                              {s}
                           </button>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Environment</Label>
                     <div className="flex gap-1 bg-background p-1 rounded-xl border border-border/60">
                        {["sandbox", "production"].map((e) => (
                           <button
                              key={e}
                              onClick={() => setConfigEnvironment(e as any)}
                              className={cn(
                                "flex-1 h-8 rounded-lg text-[10px] font-bold uppercase transition-all",
                                configEnvironment === e ? "bg-primary text-white shadow-sm" : "hover:bg-muted text-muted-foreground"
                              )}
                           >
                              {e}
                           </button>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Gateway</Label>
                     <div className="flex gap-1 bg-background p-1 rounded-xl border border-border/60">
                        {["ESEWA", "KHALTI"].map((g) => (
                           <button
                              key={g}
                              onClick={() => setConfigGateway(g as any)}
                              className={cn(
                                "flex-1 h-8 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5",
                                configGateway === g ? "bg-primary text-white shadow-sm" : "hover:bg-muted text-muted-foreground"
                              )}
                           >
                              <img src={gatewayLogoByType[g as any]} alt={g} className="w-3.5 h-3.5 rounded-sm object-cover" />
                              {g}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {configGateway === "ESEWA" ? (
                    <>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Merchant ID</Label>
                          <Input
                             value={configMerchantId}
                             onChange={(e) => setConfigMerchantId(e.target.value)}
                             placeholder={paymentConfigPlaceholders.merchantId}
                             className="h-10 rounded-xl bg-background border-border/60 text-xs font-medium"
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Webhook URL</Label>
                          <Input
                             value={configWebhookUrl}
                             onChange={(e) => setConfigWebhookUrl(e.target.value)}
                             placeholder={paymentConfigPlaceholders.webhookUrl}
                             className="h-10 rounded-xl bg-background border-border/60 text-xs font-medium"
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Public Key</Label>
                          <Input
                             value={configPublicKey}
                             onChange={(e) => setConfigPublicKey(e.target.value)}
                             placeholder={paymentConfigPlaceholders.publicKey}
                             className="h-10 rounded-xl bg-background border-border/60 text-xs font-medium"
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Secret Key</Label>
                          <Input
                             type="password"
                             value={configSecretKey}
                             onChange={(e) => setConfigSecretKey(e.target.value)}
                             placeholder={paymentConfigPlaceholders.secretKey}
                             className="h-10 rounded-xl bg-background border-border/60 text-xs font-medium"
                          />
                       </div>
                    </>
                  ) : (
                    <>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Public Key</Label>
                          <Input
                             value={configPublicKey}
                             onChange={(e) => setConfigPublicKey(e.target.value)}
                             placeholder={paymentConfigPlaceholders.publicKey}
                             className="h-10 rounded-xl bg-background border-border/60 text-xs font-medium"
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Secret Key</Label>
                          <Input
                             type="password"
                             value={configSecretKey}
                             onChange={(e) => setConfigSecretKey(e.target.value)}
                             placeholder={paymentConfigPlaceholders.secretKey}
                             className="h-10 rounded-xl bg-background border-border/60 text-xs font-medium"
                          />
                       </div>
                       <div className="space-y-2 md:col-span-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Webhook URL</Label>
                          <Input
                             value={configWebhookUrl}
                             onChange={(e) => setConfigWebhookUrl(e.target.value)}
                             placeholder={paymentConfigPlaceholders.webhookUrl}
                             className="h-10 rounded-xl bg-background border-border/60 text-xs font-medium"
                          />
                       </div>
                    </>
                  )}
               </div>

               <div className="flex gap-2 justify-end pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddPaymentConfig(false)}
                    className="h-9 rounded-lg border-border bg-background text-[10px] font-bold uppercase tracking-widest px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => void savePaymentConfig()}
                    disabled={isSavingConfig}
                    className="h-9 rounded-lg bg-primary text-[10px] font-bold uppercase tracking-widest px-6 shadow-lg shadow-primary/20"
                  >
                    {isSavingConfig ? "Syncing..." : "Initialize Config"}
                  </Button>
               </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                {paymentConfigs.length === 0 ? (
                  <div className="p-12 rounded-2xl border border-dashed border-border/40 bg-muted/5 text-center text-muted-foreground">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">No localized configurations Indexed</p>
                  </div>
                ) : (
                  paymentConfigs.map((cfg) => (
                    <div key={cfg.id} className="group p-4 rounded-xl border border-border/60 bg-background/50 flex items-center justify-between gap-4 transition-all hover:border-primary/20">
                      <div className="flex items-center gap-4 min-w-0">
                         <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center border border-border shrink-0">
                            <img src={gatewayLogoByType[cfg.gateway as any]} alt={cfg.gateway} className="w-6 h-6 rounded-sm object-cover" />
                         </div>
                         <div className="min-w-0">
                            <div className="flex items-center gap-2">
                               <p className="text-xs font-bold truncate">{cfg.gateway} Index</p>
                               <span className={cn(
                                 "text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter",
                                 cfg.environment === "production" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                               )}>{cfg.environment}</span>
                               <span className="text-[8px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-black uppercase tracking-tighter">{cfg.ownerScope}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground transition-colors group-hover:text-primary max-w-[250px] truncate mt-0.5">
                               Merchant: {cfg.merchantId || "Indexed Key"} • API v2.1
                            </p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                         <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                            onClick={async () => {
                              await deletePaymentConfig({ id: cfg.id });
                              await refetchConfigs();
                            }}
                         >
                            <Trash2 className="w-4 h-4" />
                         </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {connectedGatewayTypes.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border/40">
               <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Live Gateway Nodes</Label>
               <div className="flex flex-wrap gap-2">
                  {connectedGatewayTypes.map((gateway) => (
                    <div key={gateway} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 transition-all hover:bg-emerald-500/10">
                       <img src={gatewayLogoByType[gateway]} alt={gateway} className="w-3.5 h-3.5 rounded-sm object-cover" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                          {gateway} Active
                       </span>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
          <Settings2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-tight">Configuration Governance</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
            User-level configurations are utilized for automated loan disbursements, while Tenant-level configurations manage borrower repayments. Ensure all production credentials are encrypted before synchronization.
          </p>
        </div>
      </div>
    </div>
  );
}
