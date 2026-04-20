import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <Card>
      <CardHeader>
        <CardTitle>Payment Config</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          User configs receive loan disbursement while tenant/lender configs
          receive borrower repayments.
        </p>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Saved Configurations</p>
            <p className="text-xs text-muted-foreground">
              Use one-click add flow and keep your gateway credentials
              organized.
            </p>
          </div>
          <div className="flex gap-2">
            {!showAddPaymentConfig ? (
              <Button
                onClick={() => setShowAddPaymentConfig(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Add Payment Config
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowAddPaymentConfig(false)}
                className="border-amber-500/60 text-amber-300 hover:bg-amber-500/10"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>

        {connectedGatewayTypes.length > 0 && (
          <div className="rounded-lg border border-primary/40 bg-primary/5 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300 mb-2">
              Connected Gateways
            </p>
            <div className="flex items-center gap-2">
              {connectedGatewayTypes.map((gateway) => (
                <div
                  key={gateway}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 px-2 py-1"
                >
                  <img
                    src={gatewayLogoByType[gateway]}
                    alt={gateway}
                    className="h-4 w-4 rounded-sm object-cover"
                  />
                  <span className="text-xs font-medium text-emerald-300">
                    {gateway === "ESEWA" ? "eSewa" : "Khalti"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showAddPaymentConfig && (
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-emerald-500/10 via-background to-background p-5 space-y-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-border/80 bg-card/60 p-3">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Scope
                </Label>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfigScope("USER")}
                    className={
                      configScope === "USER"
                        ? "border-primary bg-primary/20 text-emerald-300"
                        : "border-border/70"
                    }
                  >
                    User
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfigScope("TENANT")}
                    className={
                      configScope === "TENANT"
                        ? "border-primary bg-primary/20 text-emerald-300"
                        : "border-border/70"
                    }
                  >
                    Tenant
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border/80 bg-card/60 p-3">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Gateway
                </Label>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfigGateway("ESEWA")}
                    className={
                      configGateway === "ESEWA"
                        ? "h-12 border-primary bg-primary/20 text-emerald-300"
                        : "h-12 border-border/70"
                    }
                  >
                    <img
                      src={gatewayLogoByType.ESEWA}
                      alt="eSewa"
                      className="mr-2 h-5 w-5 rounded-sm object-cover"
                    />
                    eSewa
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfigGateway("KHALTI")}
                    className={
                      configGateway === "KHALTI"
                        ? "h-12 border-primary bg-primary/20 text-emerald-300"
                        : "h-12 border-border/70"
                    }
                  >
                    <img
                      src={gatewayLogoByType.KHALTI}
                      alt="Khalti"
                      className="mr-2 h-5 w-5 rounded-sm object-cover"
                    />
                    Khalti
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border/80 bg-card/60 p-3">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Environment
                </Label>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfigEnvironment("sandbox")}
                    className={
                      configEnvironment === "sandbox"
                        ? "border-primary bg-primary/20 text-emerald-300"
                        : "border-border/70"
                    }
                  >
                    Sandbox
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfigEnvironment("production")}
                    className={
                      configEnvironment === "production"
                        ? "border-primary bg-primary/20 text-emerald-300"
                        : "border-border/70"
                    }
                  >
                    Production
                  </Button>
                </div>
              </div>
            </div>

            {configGateway === "ESEWA" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    Merchant ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder={paymentConfigPlaceholders.merchantId}
                    value={configMerchantId}
                    onChange={(e) => setConfigMerchantId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <Input
                    placeholder={paymentConfigPlaceholders.webhookUrl}
                    value={configWebhookUrl}
                    onChange={(e) => setConfigWebhookUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Public Key</Label>
                  <Input
                    placeholder={paymentConfigPlaceholders.publicKey}
                    value={configPublicKey}
                    onChange={(e) => setConfigPublicKey(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secret Key</Label>
                  <Input
                    placeholder={paymentConfigPlaceholders.secretKey}
                    value={configSecretKey}
                    onChange={(e) => setConfigSecretKey(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    Public Key <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder={paymentConfigPlaceholders.publicKey}
                    value={configPublicKey}
                    onChange={(e) => setConfigPublicKey(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secret Key</Label>
                  <Input
                    placeholder={paymentConfigPlaceholders.secretKey}
                    value={configSecretKey}
                    onChange={(e) => setConfigSecretKey(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Webhook URL</Label>
                  <Input
                    placeholder={paymentConfigPlaceholders.webhookUrl}
                    value={configWebhookUrl}
                    onChange={(e) => setConfigWebhookUrl(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => void savePaymentConfig()}
                disabled={isSavingConfig}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSavingConfig ? "Saving..." : "Save Config"}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {paymentConfigs.length === 0 ? (
            <div className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
              No payment configs found. Click "Add Payment Config" to create
              one.
            </div>
          ) : (
            paymentConfigs.map((cfg) => (
              <div
                key={cfg.id}
                className="border rounded-md p-3 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <img
                      src={gatewayLogoByType[cfg.gateway]}
                      alt={cfg.gateway}
                      className="h-4 w-4 rounded-sm object-cover"
                    />
                    <p className="text-sm font-semibold">{cfg.gateway}</p>
                    <Badge variant="outline">{cfg.environment}</Badge>
                    <Badge variant="secondary">{cfg.ownerScope}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Merchant: {cfg.merchantId || "Not set"}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  className="bg-destructive hover:bg-red-700 text-white"
                  onClick={async () => {
                    await deletePaymentConfig({ id: cfg.id });
                    await refetchConfigs();
                  }}
                >
                  Delete
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
