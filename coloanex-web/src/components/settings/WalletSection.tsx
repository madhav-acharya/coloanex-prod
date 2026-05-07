import { Check, X, ShieldCheck, Wallet, Plus, Trash2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
  const isMetaConnected = wallets.some((w) => w.provider === "METAMASK");
  const primaryWallet = wallets.find((w) => w.isPrimary) || wallets.find((w) => w.provider === "METAMASK");

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-border bg-card/30 backdrop-blur-sm overflow-hidden border-t-4 border-t-primary/20">
        <CardHeader className="pb-4 border-b border-border/40 bg-muted/5">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-bold">Web3 Infrastructure</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className={cn(
            "p-5 rounded-2xl border transition-all duration-300",
            isMetaConnected 
              ? "bg-emerald-500/5 border-emerald-500/20" 
              : "bg-destructive/5 border-destructive/20"
          )}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border",
                  isMetaConnected ? "bg-emerald-500 text-white border-emerald-400" : "bg-destructive text-white border-destructive/40"
                )}>
                  {isMetaConnected ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                </div>
                <div>
                  <p className={cn("text-sm font-bold uppercase tracking-tight", isMetaConnected ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                    {isMetaConnected ? "MetaMask Active" : "MetaMask Disconnected"}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">
                    {isMetaConnected ? primaryWallet?.address : "On-chain capabilities are currently restricted."}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => (isMetaConnected ? void disconnectMetamask() : void connectMetamask())}
                disabled={isCreatingWallet}
                variant={isMetaConnected ? "outline" : "default"}
                className={cn(
                  "h-10 rounded-xl font-bold px-6 transition-all active:scale-95",
                  isMetaConnected 
                    ? "border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive" 
                    : "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                )}
              >
                {isCreatingWallet ? "Processing..." : isMetaConnected ? "Terminate Session" : "Link MetaMask"}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
             <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Gas Execution Strategy</Label>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { id: "PLATFORM_WALLET", label: "Sponsored execution", desc: "Platform covers gas fees", active: gasPaymentMode === "PLATFORM_WALLET" },
                  { id: "USER_WALLET", label: "Self-Execution", desc: "User pays network gas", active: gasPaymentMode === "USER_WALLET" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => void saveGasMode(m.id as any)}
                    className={cn(
                      "group flex flex-col text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer",
                      m.active ? "bg-primary/10 border-primary/20 shadow-sm" : "bg-background border-border/60 hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                       <span className={cn("text-xs font-bold", m.active ? "text-primary" : "text-foreground/80")}>{m.label}</span>
                       {m.active && <Check className="w-3.5 h-3.5 text-primary" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium leading-none">{m.desc}</p>
                  </button>
                ))}
             </div>
             {!blockchainAccess.canRunBlockchain && (
               <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-tighter uppercase">{blockchainAccess.reason}</p>
               </div>
             )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border bg-card/30 backdrop-blur-sm overflow-hidden border-t-4 border-t-primary/20">
        <CardHeader className="pb-4 border-b border-border/40 bg-muted/5">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-bold">Wallet Directory</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex gap-2">
             <Input
                value={manualWalletAddress}
                className="h-10 rounded-xl bg-background border-border/60 font-medium text-xs transition-all focus:ring-1 focus:ring-primary/20"
                onChange={(e) => setManualWalletAddress(e.target.value)}
                placeholder="Secure Wallet (0x...)"
              />
              <Button
                variant="outline"
                onClick={() => void addManualWebWallet()}
                className="h-10 rounded-xl border-primary/30 text-primary hover:bg-primary/5 font-bold px-5"
              >
                Register
              </Button>
          </div>

          <div className="space-y-2">
             <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Connected Identities</Label>
             <div className="grid grid-cols-1 gap-2">
                {wallets.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-border/40 bg-muted/5 text-center text-muted-foreground">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">No wallets indexed yet</p>
                  </div>
                ) : (
                  wallets.map((wallet) => (
                    <div key={wallet.id} className="group p-3 rounded-xl border border-border/60 bg-background/50 flex items-center justify-between gap-4 transition-all hover:border-primary/20">
                      <div className="flex items-center gap-3 min-w-0">
                         <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center border border-border shrink-0">
                            <Wallet className="w-4 h-4 text-muted-foreground" />
                         </div>
                         <div className="min-w-0">
                            <div className="flex items-center gap-2">
                               <p className="text-xs font-bold truncate">{wallet.label || "Secure Asset"}</p>
                               {wallet.isPrimary ? (
                                 <span className="text-[8px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-black uppercase tracking-tighter">Primary</span>
                               ) : (
                                 <span className="text-[8px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-black uppercase tracking-tighter">{wallet.purpose}</span>
                               )}
                            </div>
                            <p className="text-[10px] text-muted-foreground transition-colors group-hover:text-primary max-w-[200px] truncate">{wallet.address}</p>
                            {wallet.provider === "METAMASK" && (
                              <p className="text-[9px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest mt-0.5">
                                {loadingWalletCoinBalances ? "Querying Chain..." : walletCoinBalances[wallet.id] ? `${walletCoinBalances[wallet.id].value} ${walletCoinBalances[wallet.id].symbol}` : "Balance Offline"}
                              </p>
                            )}
                         </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                         {!wallet.isPrimary && (
                           <Button
                              size="icon"
                              variant="ghost"
                              className="w-8 h-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={async () => {
                                await setPrimaryWallet({ id: wallet.id });
                                await refetchWallets();
                              }}
                           >
                              <ShieldCheck className="w-4 h-4" />
                           </Button>
                         )}
                         <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={async () => {
                              await deleteWallet({ id: wallet.id });
                              await refetchWallets();
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
        </CardContent>
      </Card>
    </div>
  );
}
