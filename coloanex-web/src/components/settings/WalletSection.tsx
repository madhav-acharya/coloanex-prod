import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type WalletSectionProps = {
  wallets: any[];
  isCreatingWallet: boolean;
  disconnectMetamask: () => Promise<void>;
  connectMetamask: () => Promise<string | undefined>;
  blockchainAccess: any;
  gasPaymentMode: "USER_WALLET" | "PLATFORM_WALLET";
  saveGasMode: (mode: "USER_WALLET" | "PLATFORM_WALLET") => Promise<void>;
  manualWalletAddress: string;
  setManualWalletAddress: (value: string) => void;
  addManualWebWallet: () => Promise<void>;
  setPrimaryWallet: (payload: { id: string }) => Promise<any>;
  deleteWallet: (payload: { id: string }) => Promise<any>;
  refetchWallets: () => Promise<any>;
  loadingWalletCoinBalances: boolean;
  walletCoinBalances: Record<string, { symbol: string; value: string }>;
};

export default function WalletSection({
  wallets,
  isCreatingWallet,
  disconnectMetamask,
  connectMetamask,
  blockchainAccess,
  gasPaymentMode,
  saveGasMode,
  manualWalletAddress,
  setManualWalletAddress,
  addManualWebWallet,
  setPrimaryWallet,
  deleteWallet,
  refetchWallets,
  loadingWalletCoinBalances,
  walletCoinBalances,
}: WalletSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>MetaMask Wallet Settings</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your MetaMask wallet and choose how blockchain gas is paid.
        </p>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {wallets.some((w) => w.provider === "METAMASK") ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <div className="flex items-start gap-3 sm:items-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center border border-white/20 shadow-sm">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                  MetaMask Connected
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground/80 font-medium break-all">
                  {wallets.find((wallet) => wallet.isPrimary)?.address ||
                    wallets.find((w) => w.provider === "METAMASK")?.address}
                </p>
              </div>
            </div>
            <Button
              onClick={() => void disconnectMetamask()}
              disabled={isCreatingWallet}
              size="sm"
              variant="outline"
              className="w-full sm:w-auto border-red-200 text-destructive hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 font-bold h-10 px-4 transition-all"
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
            <div className="flex items-start gap-3 sm:items-center">
              <div className="w-10 h-10 rounded-xl bg-destructive flex items-center justify-center border border-white/20 shadow-sm">
                <X className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-destructive text-base">
                  MetaMask Not Connected
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground/80 font-medium">
                  You are currently disconnected. Link your wallet to perform
                  on-chain operations.
                </p>
              </div>
            </div>
            <Button
              onClick={() => void connectMetamask()}
              disabled={isCreatingWallet}
              className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 text-white font-bold h-10 px-4 border border-white/10"
            >
              {isCreatingWallet ? "Connecting..." : "Connect Wallet"}
            </Button>
          </div>
        )}

        <div className="space-y-2">
          <Label>Gas Payment Mode</Label>
          <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Current Mode
            </p>
            <p className="mt-1 text-sm font-medium">
              {blockchainAccess.modeLabel}
            </p>
            {!blockchainAccess.canRunBlockchain && blockchainAccess.reason ? (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                {blockchainAccess.reason}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className={`cursor-pointer ${
                gasPaymentMode === "USER_WALLET"
                  ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                  : "bg-blue-100 text-blue-800 hover:bg-blue-200"
              }`}
              onClick={() => void saveGasMode("USER_WALLET")}
            >
              User Wallet
            </Button>
            <Button
              className={`cursor-pointer ${
                gasPaymentMode === "PLATFORM_WALLET"
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                  : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
              }`}
              onClick={() => void saveGasMode("PLATFORM_WALLET")}
            >
              Platform Sponsored
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            User Wallet mode requires MetaMask connection. Platform Sponsored
            mode requires an active subscription.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={manualWalletAddress}
              onChange={(e) => setManualWalletAddress(e.target.value)}
              placeholder="Add wallet manually (0x...)"
            />
            <Button
              variant="outline"
              onClick={() => void addManualWebWallet()}
              className="cursor-pointer bg-muted text-foreground hover:bg-muted/80 w-full sm:w-auto"
            >
              Add
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Connected Wallets</Label>
          <div className="space-y-2">
            {wallets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No wallets connected yet
              </p>
            ) : (
              wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className="border rounded-md p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {wallet.label || "Wallet"} • {wallet.purpose}
                    </p>
                    <p className="text-xs text-muted-foreground break-all">
                      {wallet.address}
                    </p>
                    {wallet.provider === "METAMASK" ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        {loadingWalletCoinBalances
                          ? "Loading balance..."
                          : walletCoinBalances[wallet.id]
                            ? `${walletCoinBalances[wallet.id].value} ${walletCoinBalances[wallet.id].symbol}`
                            : "Balance unavailable"}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {!wallet.isPrimary && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer bg-muted text-foreground hover:bg-muted/80 flex-1 sm:flex-none"
                        onClick={async () => {
                          await setPrimaryWallet({ id: wallet.id });
                          await refetchWallets();
                        }}
                      >
                        Set Primary
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="cursor-pointer flex-1 sm:flex-none"
                      onClick={async () => {
                        await deleteWallet({ id: wallet.id });
                        await refetchWallets();
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
