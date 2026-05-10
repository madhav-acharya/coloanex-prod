import { useEffect, useState } from "react";
import { ethers } from "ethers";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useUpdateUserMutation } from "@/apis/usersApi";
import {
  useCreateWalletMutation,
  useDeleteWalletMutation,
  useGetMyWalletsQuery,
  useSetPrimaryWalletMutation,
  useUpdateGasModeMutation,
} from "@/apis/walletsApi";
import {
  useListMySubscriptionsQuery,
  useListPlansQuery,
  usePurchaseSubscriptionMutation,
  useSelectSubscriptionMutation,
} from "@/apis/subscriptionsApi";
import {
  useDeletePaymentConfigMutation,
  useListMyPaymentConfigsQuery,
  useUpsertPaymentConfigMutation,
} from "@/apis/paymentConfigsApi";
import {
  formatGasPaymentMode,
  getBlockchainAccessSnapshot,
} from "@/utils/blockchainAccess";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Loader2,
  User,
  CreditCard,
  Wallet,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  ChevronRight,
  LogOut,
  Palette,
  Sun,
  Moon,
  Monitor,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  FileScan,
  FileCheck,
  FileBadge,
} from "lucide-react";
import WalletSection from "@/components/settings/WalletSection";
import SubscriptionsSection from "@/components/settings/SubscriptionsSection";
import PaymentConfigSection from "@/components/settings/PaymentConfigSection";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const gatewayLogoByType: Record<"ESEWA" | "KHALTI", string> = {
  ESEWA: "/images/esewa.png",
  KHALTI: "/images/khalti.png",
};

const planAccentByCode: Record<
  string,
  { card: string; button: string; chip: string }
> = {
  free: {
    card: "border-border bg-card",
    button:
      "bg-primary hover:bg-primary/90 text-primary-foreground border border-primary",
    chip: "bg-primary/15 text-primary",
  },
  premium: {
    card: "border-border bg-card",
    button: "bg-primary hover:bg-primary/90 text-white border border-primary",
    chip: "bg-primary/15 text-primary",
  },
  pro: {
    card: "border-border bg-card",
    button:
      "bg-primary hover:bg-primary/90 text-white border border-primary",
    chip: "bg-primary/15 text-primary",
  },
  enterprise: {
    card: "border-border bg-card",
    button:
      "bg-primary hover:bg-primary/90 text-white border border-primary",
    chip: "bg-primary/15 text-primary",
  },
};

const accountSections = new Set([
  "account",
  "password",
  "appearance",
  "wallet",
  "subscriptions",
  "payment-config",
  "notifications",
]);

export default function Settings() {
  const settingsBasePath = "/borrower/profile";
  const pricingPath = "/borrower/pricing";
  const Layout = BorrowerLayout;

  const navigate = useNavigate();
  const { user, updateUser: updateAuthUser, logout } = useAuth();
  const { mode, setTheme } = useTheme();

  const [activeSection, setActiveSection] = useState<string>("account");
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [updateUser, { isLoading }] = useUpdateUserMutation();
  const [createWallet, { isLoading: isCreatingWallet }] =
    useCreateWalletMutation();
  const [updateGasMode] = useUpdateGasModeMutation();
  const [setPrimaryWallet] = useSetPrimaryWalletMutation();
  const [deleteWallet] = useDeleteWalletMutation();
  const [purchaseSubscription, { isLoading: isPurchasingSubscription }] =
    usePurchaseSubscriptionMutation();
  const [selectSubscription, { isLoading: isSelectingSubscription }] =
    useSelectSubscriptionMutation();
  const [upsertPaymentConfig, { isLoading: isSavingConfig }] =
    useUpsertPaymentConfigMutation();
  const [deletePaymentConfig] = useDeletePaymentConfigMutation();

  const { data: wallets = [], refetch: refetchWallets } =
    useGetMyWalletsQuery();
  const { data: mySubscriptions = [], refetch: refetchMySubscriptions } =
    useListMySubscriptionsQuery();
  const { data: plans = [] } = useListPlansQuery();
  const showPaymentConfig = Boolean(user);
  const { data: paymentConfigs = [], refetch: refetchConfigs } =
    useListMyPaymentConfigsQuery(undefined, { skip: !showPaymentConfig });

  const connectedGatewayTypes = Array.from(
    new Set(
      paymentConfigs
        .filter((cfg) => cfg.isActive)
        .map((cfg) => cfg.gateway as "ESEWA" | "KHALTI"),
    ),
  );

  const [accountForm, setAccountForm] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    loanUpdates: true,
    kycUpdates: true,
    securityAlerts: true,
  });

  const [gasPaymentMode, setGasPaymentMode] = useState<
    "USER_WALLET" | "PLATFORM_WALLET"
  >("PLATFORM_WALLET");
  const [manualWalletAddress, setManualWalletAddress] = useState("");
  const [walletCoinBalances, setWalletCoinBalances] = useState<
    Record<string, { symbol: string; value: string }>
  >({});
  const [loadingWalletCoinBalances, setLoadingWalletCoinBalances] =
    useState(false);

  const [showAddPaymentConfig, setShowAddPaymentConfig] = useState(false);
  const [configScope, setConfigScope] = useState<"USER" | "TENANT">("USER");
  const [configGateway, setConfigGateway] = useState<"ESEWA" | "KHALTI">(
    "ESEWA",
  );
  const [configEnvironment, setConfigEnvironment] = useState<
    "sandbox" | "production"
  >("sandbox");
  const [configPublicKey, setConfigPublicKey] = useState("");
  const [configSecretKey, setConfigSecretKey] = useState("");
  const [configMerchantId, setConfigMerchantId] = useState("");
  const [configWebhookUrl, setConfigWebhookUrl] = useState("");

  const blockchainAccess = getBlockchainAccessSnapshot({
    gasPaymentMode,
    wallets,
    subscriptions: mySubscriptions,
  });

  const subscriptionStats = mySubscriptions.map((subscription) => {
    const maxTransactions = Number(subscription.planRef?.maxTransactions || 0);
    const usedTransactions = Number(subscription.usageCount || 0);
    const remainingTransactions =
      maxTransactions > 0
        ? Math.max(maxTransactions - usedTransactions, 0)
        : null;
    const lifecycleStatus = subscription.lifecycleStatus || "EXPIRED";
    const isBought = lifecycleStatus === "BOUGHT";

    return {
      ...subscription,
      maxTransactions,
      usedTransactions,
      remainingTransactions,
      isBought,
      lifecycleStatus,
    };
  });

  const hasActiveSubscription = subscriptionStats.some(
    (subscription) => subscription.isBought,
  );
  const selectedSubscription =
    subscriptionStats.find((subscription) => subscription.isSelected) ||
    subscriptionStats.find((subscription) => subscription.isBought) ||
    null;
  const hasLimitReached =
    !!selectedSubscription &&
    selectedSubscription.remainingTransactions !== null &&
    selectedSubscription.remainingTransactions <= 0;

  const paymentConfigPlaceholders =
    configGateway === "ESEWA"
      ? {
          merchantId: "EPAYTEST",
          publicKey: "EPAYTEST",
          secretKey: "8gBm/:&EnhH.1/q",
          webhookUrl: "https://rc.esewa.com.np/api/epay/transaction/status/",
        }
      : {
          merchantId: "498dfcacd2b8400699dc8cfd98a0f077",
          publicKey: "498dfcacd2b8400699dc8cfd98a0f077",
          secretKey: "69ceb560028345dba3b25f9fdbea8e8a",
          webhookUrl: "https://dev.khalti.com/api/v2/epayment/lookup/",
        };

  useEffect(() => {
    if (user) {
      setAccountForm({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      setGasPaymentMode(
        ((user as any)?.gasPaymentMode as any) || "PLATFORM_WALLET",
      );
    }
  }, [user]);

  useEffect(() => {
    const boughtSubscriptions = subscriptionStats.filter(
      (subscription) => subscription.isBought,
    );
    if (boughtSubscriptions.length !== 1) return;

    const onlySubscription = boughtSubscriptions[0];
    if (onlySubscription.isSelected || isSelectingSubscription) return;

    void selectSubscription({ id: onlySubscription.id })
      .unwrap()
      .then(() => refetchMySubscriptions())
      .catch(() => undefined);
  }, [
    subscriptionStats,
    isSelectingSubscription,
    selectSubscription,
    refetchMySubscriptions,
  ]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get("section");
    const modal = params.get("modal");

    if (section) {
      if (accountSections.has(section)) {
        setActiveSection(section);
      } else {
        setActiveDialog(section);
      }
      params.delete("section");
      const remaining = params.toString();
      window.history.replaceState(
        {},
        "",
        remaining ? `${settingsBasePath}?${remaining}` : settingsBasePath,
      );
    }

    if (modal) {
      setActiveDialog(modal);
      params.delete("modal");
      const remaining = params.toString();
      window.history.replaceState(
        {},
        "",
        remaining ? `${settingsBasePath}?${remaining}` : settingsBasePath,
      );
    }
  }, [settingsBasePath]);

  useEffect(() => {
    if (activeSection === "wallet") {
      void refreshWalletCoinBalances();
    }
  }, [activeSection, wallets]);

  const handleAccountUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      const updateData: any = {};
      if (accountForm.fullName !== user.fullName)
        updateData.fullName = accountForm.fullName;
      if (accountForm.email && accountForm.email !== user.email)
        updateData.email = accountForm.email;
      if (accountForm.phone && accountForm.phone !== user.phone)
        updateData.phone = accountForm.phone;

      if (Object.keys(updateData).length === 0) {
        toast.info("No changes to save");
        return;
      }

      await updateUser({ id: user.id, data: updateData }).unwrap();
      toast.success("Account settings updated successfully");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update account settings");
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    try {
      await updateUser({
        id: user.id,
        data: { password: passwordForm.newPassword },
      }).unwrap();
      toast.success("Password updated successfully");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update password");
    }
  };

  const handleNotificationToggle = (key: keyof typeof notificationSettings) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success("Notification preferences updated");
  };

  const connectMetamask = async (): Promise<string | undefined> => {
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        toast.error("Install MetaMask extension to connect wallet");
        return undefined;
      }

      await ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const address = accounts?.[0];
      if (!address) {
        toast.error("No MetaMask account selected");
        return undefined;
      }

      const alreadyLinked = wallets.find(w => w.address.toLowerCase() === address.toLowerCase());
      if (alreadyLinked) {
        await refetchWallets();
        toast.success("Wallet synchronized");
        return address;
      }

      await createWallet({
        provider: "METAMASK",
        purpose: "PRIMARY",
        platform: "WEB",
        address,
        label: "MetaMask",
      }).unwrap();
      await refetchWallets();
      toast.success("Wallet connected");
      return address;
    } catch (error: any) {
      if (error?.code === 4001)
        toast.error("MetaMask connection request was cancelled");
      else
        toast.error(
          error?.data?.message || error?.message || "Failed to connect wallet",
        );
      return undefined;
    }
  };

  const addManualWebWallet = async () => {
    if (!manualWalletAddress.trim()) {
      toast.error("Wallet address is required");
      return;
    }
    try {
      await createWallet({
        provider: "METAMASK",
        purpose: "PRIMARY",
        platform: "WEB",
        address: manualWalletAddress.trim(),
        label: "Manual Wallet",
      }).unwrap();
      setManualWalletAddress("");
      await refetchWallets();
      toast.success("Wallet added");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to add wallet");
    }
  };

  const disconnectMetamask = async () => {
    const metamaskWallets = wallets.filter(
      (wallet) => wallet.provider === "METAMASK",
    );
    if (metamaskWallets.length === 0) {
      toast.info("No MetaMask wallet is connected");
      return;
    }

    try {
      await Promise.all(
        metamaskWallets.map((wallet) =>
          deleteWallet({ id: wallet.id }).unwrap(),
        ),
      );
      await refetchWallets();
      toast.success("MetaMask disconnected");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to disconnect MetaMask");
    }
  };

  const getNativeCoinSymbol = (chainId: string) => {
    const normalized = String(chainId || "").toLowerCase();
    if (normalized === "0x1" || normalized === "0xaa36a7") return "ETH";
    if (normalized === "0x89") return "MATIC";
    if (normalized === "0x38") return "BNB";
    return "ETH";
  };

  const refreshWalletCoinBalances = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      setWalletCoinBalances({});
      return;
    }

    const metamaskWallets = wallets.filter(
      (wallet) => wallet.provider === "METAMASK",
    );
    if (metamaskWallets.length === 0) {
      setWalletCoinBalances({});
      return;
    }

    try {
      setLoadingWalletCoinBalances(true);
      const chainId = (await ethereum.request({
        method: "eth_chainId",
      })) as string;
      const symbol = getNativeCoinSymbol(chainId);

      const balances = await Promise.all(
        metamaskWallets.map(async (wallet) => {
          const raw = (await ethereum.request({
            method: "eth_getBalance",
            params: [wallet.address, "latest"],
          })) as string;
          const formatted = Number(ethers.formatEther(raw)).toFixed(6);
          return [wallet.id, { symbol, value: formatted }] as const;
        }),
      );
      setWalletCoinBalances(Object.fromEntries(balances));
    } catch {
      setWalletCoinBalances({});
    } finally {
      setLoadingWalletCoinBalances(false);
    }
  };

  const saveGasMode = async (modeToSet: "USER_WALLET" | "PLATFORM_WALLET") => {
    if (modeToSet === gasPaymentMode) {
      toast.info("Gas mode already selected");
      return;
    }

    const hasSubscription = mySubscriptions.some(
      (subscription) => subscription.status === "ACTIVE",
    );

    if (modeToSet === "PLATFORM_WALLET" && !hasSubscription) {
      toast.error(
        "Platform gas mode requires an active subscription. Please buy a plan.",
      );
      navigate(pricingPath);
      return;
    }

    if (modeToSet === "USER_WALLET" && wallets.length === 0) {
      const address = await connectMetamask();
      if (!address) return;
    }

    const previousMode = gasPaymentMode;
    setGasPaymentMode(modeToSet);
    try {
      await updateGasMode({ gasPaymentMode: modeToSet }).unwrap();
      if (user)
        updateAuthUser({ ...(user as any), gasPaymentMode: modeToSet } as any);
      toast.success("Gas mode updated");
    } catch (error: any) {
      setGasPaymentMode(previousMode);
      toast.error(error?.data?.message || "Failed to update gas mode");
    }
  };

  const handleBuyPlanFromSettings = async (plan: any) => {
    const existing = subscriptionStats.find(
      (subscription) =>
        subscription.scope === plan.scope && subscription.plan === plan.code,
    );
    if (existing?.isBought) {
      toast.warning(`You already have an active ${plan.code} subscription`);
      return;
    }

    try {
      const payload: {
        planCode: string;
        scope: "USER" | "TENANT";
        tenantId?: string;
      } = {
        planCode: plan.code,
        scope: plan.scope,
        tenantId: plan.scope === "TENANT" ? user?.tenantId : undefined,
      };
      await purchaseSubscription(payload).unwrap();
      await refetchMySubscriptions();
      toast.success(`${plan.name} activated successfully`);
    } catch (error: any) {
      const message =
        error?.data?.message ||
        "This plan requires checkout. Opening pricing for secure payment.";
      toast.warning(message);
      navigate(`${pricingPath}?planCode=${encodeURIComponent(plan.code)}`);
    }
  };

  const handleSelectSubscription = async (subscriptionId: string) => {
    try {
      await selectSubscription({ id: subscriptionId }).unwrap();
      await refetchMySubscriptions();
      toast.success("Subscription selected successfully");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to select subscription");
    }
  };

  const savePaymentConfig = async () => {
    if (configScope === "TENANT" && !user?.tenantId) {
      toast.warning("Tenant scope requires a tenant account");
      return;
    }
    if (configGateway === "ESEWA" && !configMerchantId.trim()) {
      toast.warning("Merchant ID is required for eSewa config");
      return;
    }
    if (configGateway === "KHALTI" && !configPublicKey.trim()) {
      toast.warning("Public Key is required for Khalti config");
      return;
    }

    try {
      await upsertPaymentConfig({
        scope: configScope,
        tenantId: configScope === "TENANT" ? user?.tenantId : undefined,
        gateway: configGateway,
        environment: configEnvironment,
        isActive: true,
        publicKey: configPublicKey.trim() || undefined,
        secretKey: configSecretKey.trim() || undefined,
        merchantId: configMerchantId.trim() || undefined,
        webhookUrl: configWebhookUrl.trim() || undefined,
      }).unwrap();
      await refetchConfigs();
      setShowAddPaymentConfig(false);
      setConfigMerchantId("");
      setConfigPublicKey("");
      setConfigSecretKey("");
      setConfigWebhookUrl("");
      toast.success("Payment config saved");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save payment config");
    }
  };

  if (!user) {
    return (
      <BorrowerLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </BorrowerLayout>
    );
  }

  const settingsOptions = [
    {
      id: "account",
      icon: User,
      title: "Account Profile",
      description: "Manage personal details",
    },
    {
      id: "password",
      icon: Lock,
      title: "Security & Login",
      description: "Password and protection",
    },
    {
      id: "appearance",
      icon: Palette,
      title: "Display Theme",
      description: `Active: ${mode === "system" ? "System" : mode === "dark" ? "Dark" : "Light"}`,
    },
    {
      id: "subscriptions",
      icon: IconCurrencyRupeeNepalese,
      title: "Billing & Plans",
      description: "Usage and limits",
      badge: hasLimitReached ? (
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 font-bold tracking-tighter">
          Exceeded
        </span>
      ) : hasActiveSubscription ? (
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold tracking-tighter">
          Active
        </span>
      ) : (
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold tracking-tighter">
          Upgrade
        </span>
      ),
    },
    {
      id: "wallet",
      icon: Wallet,
      title: "Capital & Wallets",
      description: "Manage digital assets",
    },
    ...(showPaymentConfig
      ? [
          {
            id: "payment-config",
            icon: CreditCard,
            title: "Merchant API",
            description: "Gateway credentials",
          },
        ]
      : []),
  ];

  const accountNavSections = settingsOptions;

  const inputClass = "h-10 rounded-xl bg-background border-border/60 font-medium text-xs transition-all focus:ring-1 focus:ring-primary/20 focus:border-primary";

  if (accountSections.has(activeSection)) {
    return (
      <BorrowerLayout>
        <div className="settings-shell shadow-none grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <Card className="hidden lg:block rounded-2xl border-border bg-card/50 backdrop-blur-sm lg:sticky lg:top-24 lg:h-[calc(100vh-140px)] flex flex-col ">
            <CardContent className="p-4 flex-1 h-full flex flex-col space-y-5 custom-scrollbar">
              <div className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-background/50 shrink-0">
                <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                  <AvatarImage src={user?.profileImage} alt={user?.fullName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate tracking-tight">{user?.fullName}</p>
                  <p className="text-[11px] text-muted-foreground truncate font-medium  tracking-wider">{user?.isActive ? "Verified" : "Pending"}</p>
                </div>
              </div>

              <div className="space-y-1 flex-1">
                {accountNavSections.map((option) => {
                  const Icon = option.icon;
                  const isActive = activeSection === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setActiveSection(option.id)}
                      className={cn(
                        "group w-full flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 cursor-pointer border",
                        isActive 
                          ? "bg-primary/10 border-primary/20 " 
                          : "bg-transparent border-transparent hover:bg-muted/50 hover:border-border/50"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-colors border ",
                          isActive ? "bg-primary text-primary-foreground border-primary/20" : "bg-background border-border group-hover:bg-muted"
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="text-left min-w-0">
                           <p className={cn("text-[11px] font-bold truncate tracking-wider", isActive ? "text-primary" : "text-foreground/80")}>{option.title}</p>
                           <p className="text-[11px] font-bold text-muted-foreground/60 truncate leading-none mt-1 tracking-tighter">{option.description}</p>
                        </div>
                      </div>
                      {option.badge}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-border/40 mt-auto shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="w-full justify-start rounded-xl h-10 px-3 font-bold text-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
                >
                  <LogOut className="w-4 h-4 mr-2.5" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeSection === "account" && (
              <Card className="rounded-2xl border-border bg-card/30 backdrop-blur-sm overflow-hidden  border-t border-t-border/60">
                <CardHeader className="pb-4 border-b border-border/40 bg-muted/5">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-bold">Profile Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleAccountUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="account-fullName" className="text-[11px] font-bold tracking-wider text-muted-foreground ml-1">Full Identity Name</Label>
                        <Input
                          id="account-fullName"
                          value={accountForm.fullName}
                          className={inputClass}
                          onChange={(e) => setAccountForm(prev => ({ ...prev, fullName: e.target.value }))}
                          placeholder="e.g. John Doe"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="account-email" className="text-[11px] font-bold tracking-wider text-muted-foreground ml-1">Business Contact Email</Label>
                        <Input
                          id="account-email"
                          type="email"
                          value={accountForm.email}
                          className={inputClass}
                          onChange={(e) => setAccountForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="johndoe@example.com"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="account-phone" className="text-[11px] font-bold tracking-wider text-muted-foreground ml-1">Verified Phone Line</Label>
                        <Input
                          id="account-phone"
                          value={accountForm.phone}
                          className={inputClass}
                          onChange={(e) => setAccountForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+977-XXXXXXXXXX"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border/40">
                      <p className="text-[11px] text-muted-foreground font-medium italic">All changes are subject to system verification.</p>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="h-10 rounded-xl px-6 font-bold bg-primary hover:bg-primary/90   transition-all active:scale-95"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeSection === "password" && (
              <Card className="rounded-2xl border-border bg-card/30 backdrop-blur-sm overflow-hidden  border-t border-t-border/60">
                <CardHeader className="pb-4 border-b border-border/40 bg-muted/5">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-bold">Security Credentials</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handlePasswordUpdate} className="space-y-6">
                    <div className="space-y-4 max-w-md">
                      <div className="space-y-1.5">
                        <Label htmlFor="current-password" className="text-[11px] font-bold tracking-wider text-muted-foreground ml-1">Established Password</Label>
                        <div className="relative">
                          <Input
                            id="current-password"
                            type={showPasswords.current ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            className={cn(inputClass, "pr-10")}
                            placeholder="Current secret key"
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                            required
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          >
                            {showPasswords.current ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="new-password" className="text-[11px] font-bold tracking-wider text-muted-foreground ml-1">New Secure Password</Label>
                          <div className="relative">
                            <Input
                              id="new-password"
                              type={showPasswords.new ? "text" : "password"}
                              value={passwordForm.newPassword}
                              className={cn(inputClass, "pr-10")}
                              placeholder="Min 8 characters"
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                              required
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                              onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                            >
                              {showPasswords.new ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="confirm-password" className="text-[11px] font-bold tracking-wider text-muted-foreground ml-1">Confirm Identity Key</Label>
                          <div className="relative">
                            <Input
                              id="confirm-password"
                              type={showPasswords.confirm ? "text" : "password"}
                              value={passwordForm.confirmPassword}
                              className={cn(inputClass, "pr-10")}
                              placeholder="Retype new password"
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              required
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                              onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                            >
                              {showPasswords.confirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border/40">
                      <p className="text-[11px] text-muted-foreground font-medium italic">Regular password rotations are recommended.</p>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="h-10 rounded-xl px-6 font-bold bg-primary hover:bg-primary/90   transition-all active:scale-95"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh Security"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeSection === "appearance" && (
              <Card className="rounded-2xl border-border bg-card/30 backdrop-blur-sm overflow-hidden  border-t border-t-border/60">
                <CardHeader className="pb-4 border-b border-border/40 bg-muted/5">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-bold">Display Interface</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { id: "light", icon: Sun, label: "Light Mode", desc: "Classic clarity" },
                      { id: "dark", icon: Moon, label: "Deep Space", desc: "Power efficient" },
                      { id: "system", icon: Monitor, label: "System Sync", desc: "Auto adjustment" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id as any)}
                        className={cn(
                          "group flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden relative ",
                          mode === t.id
                            ? "border-primary bg-primary/5 "
                            : "border-border/60 bg-background/50 hover:border-primary/40 hover:bg-muted/30"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-2xl mb-4 flex items-center justify-center transition-all duration-300 border ",
                          mode === t.id ? "bg-primary text-primary-foreground border-primary/20 scale-110" : "bg-muted/80 text-muted-foreground border-border"
                        )}>
                          <t.icon className="w-5 h-5" />
                        </div>
                        <p className={cn("text-xs font-bold tracking-tight", mode === t.id ? "text-primary" : "text-foreground/70")}>{t.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 font-medium">{t.desc}</p>
                        {mode === t.id && (
                          <div className="absolute top-3 right-3">
                             <CheckCircle2 className="w-4 h-4 text-primary" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "wallet" && (
              <WalletSection
                wallets={wallets}
                isCreatingWallet={isCreatingWallet}
                disconnectMetamask={disconnectMetamask}
                connectMetamask={connectMetamask}
                blockchainAccess={blockchainAccess}
                gasPaymentMode={gasPaymentMode}
                saveGasMode={saveGasMode}
                manualWalletAddress={manualWalletAddress}
                setManualWalletAddress={setManualWalletAddress}
                addManualWebWallet={addManualWebWallet}
                setPrimaryWallet={(payload) =>
                  setPrimaryWallet(payload).unwrap()
                }
                deleteWallet={(payload) => deleteWallet(payload).unwrap()}
                refetchWallets={refetchWallets}
                loadingWalletCoinBalances={loadingWalletCoinBalances}
                walletCoinBalances={walletCoinBalances}
              />
            )}

            {activeSection === "subscriptions" && (
              <SubscriptionsSection
                subscriptionStats={subscriptionStats}
                plans={plans}
                planAccentByCode={planAccentByCode}
                isSelectingSubscription={isSelectingSubscription}
                isPurchasingSubscription={isPurchasingSubscription}
                handleSelectSubscription={handleSelectSubscription}
                handleBuyPlanFromSettings={handleBuyPlanFromSettings}
                goToPricing={() => navigate(pricingPath)}
              />
            )}

            {activeSection === "payment-config" && showPaymentConfig && (
              <PaymentConfigSection
                paymentConfigs={paymentConfigs}
                connectedGatewayTypes={connectedGatewayTypes}
                gatewayLogoByType={gatewayLogoByType}
                showAddPaymentConfig={showAddPaymentConfig}
                setShowAddPaymentConfig={setShowAddPaymentConfig}
                configScope={configScope}
                setConfigScope={setConfigScope}
                configGateway={configGateway}
                setConfigGateway={setConfigGateway}
                configEnvironment={configEnvironment}
                setConfigEnvironment={setConfigEnvironment}
                paymentConfigPlaceholders={paymentConfigPlaceholders}
                configMerchantId={configMerchantId}
                setConfigMerchantId={setConfigMerchantId}
                configPublicKey={configPublicKey}
                setConfigPublicKey={setConfigPublicKey}
                configSecretKey={configSecretKey}
                setConfigSecretKey={setConfigSecretKey}
                configWebhookUrl={configWebhookUrl}
                setConfigWebhookUrl={setConfigWebhookUrl}
                isSavingConfig={isSavingConfig}
                savePaymentConfig={savePaymentConfig}
                deletePaymentConfig={(payload) =>
                  deletePaymentConfig(payload).unwrap()
                }
                refetchConfigs={refetchConfigs}
              />
            )}

            {activeSection === "notifications" && (
              <Card className="rounded-2xl border-border bg-card/30 backdrop-blur-sm overflow-hidden  border-t border-border/60">
                <CardHeader className="pb-4 border-b border-border/40 bg-muted/5">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-bold">Transmission Settings</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: "emailNotifications", label: "Email Alerts", desc: "Critical system transmissions" },
                      { id: "loanUpdates", label: "Loan Pulse", desc: "Status & lifecycle changes" },
                      { id: "kycUpdates", label: "Identity Sync", desc: "Verification milestones" },
                      { id: "securityAlerts", label: "Threat Matrix", desc: "Account security pings" },
                    ].map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/40">
                        <div className="min-w-0">
                          <Label htmlFor={s.id} className="text-xs font-bold text-foreground/80 block">{s.label}</Label>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</p>
                        </div>
                        <Switch
                          id={s.id}
                          checked={(notificationSettings as any)[s.id]}
                          onCheckedChange={() => handleNotificationToggle(s.id as any)}
                          className="data-[state=checked]:bg-primary scale-90"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </BorrowerLayout>
    );
  }

  return (
    <BorrowerLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="settings-shell shadow-none rounded-xl border-border bg-card/75">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 ring-2 ring-primary/25">
                <AvatarImage src={user?.profileImage} alt={user?.fullName} />
                <AvatarFallback className="bg-primary/15 text-primary font-semibold">
                  {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold leading-none truncate">
                  {user?.fullName}
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {user?.email}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge
                    className={`rounded-full border text-[11px] ${
                      user?.isActive
                        ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/20"
                        : "bg-destructive/15 text-destructive border-destructive/20"
                    }`}
                  >
                    {user?.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {settingsOptions.length} settings available
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="settings-shell shadow-none rounded-xl border-border bg-card/75">
          <CardContent className="p-6">
            <div className="mb-4">
              <h1 className="text-2xl sm:text-2xl font-bold tracking-tight">
                Profile Settings
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a section to manage account, security, wallet, and
                payment preferences.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {settingsOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.id}
                    onClick={() => {
                      if (accountSections.has(option.id)) {
                        setActiveSection(option.id);
                        return;
                      }
                      setActiveDialog(option.id);
                    }}
                    className="group rounded-xl border border-border bg-background/30 p-4 hover:bg-primary/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">
                            {option.title}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {option.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </div>
                    {option.badge ? (
                      <div className="mt-3 flex justify-start">
                        {option.badge}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={activeDialog === "account"}
        onOpenChange={(open) => setActiveDialog(open ? "account" : null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Account Information</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAccountUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="borrower-account-fullName">Full Name</Label>
              <Input
                id="borrower-account-fullName"
                value={accountForm.fullName}
                onChange={(e) =>
                  setAccountForm((prev) => ({
                    ...prev,
                    fullName: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="borrower-account-email">Email</Label>
              <Input
                id="borrower-account-email"
                type="email"
                value={accountForm.email}
                onChange={(e) =>
                  setAccountForm((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="borrower-account-phone">Phone</Label>
              <Input
                id="borrower-account-phone"
                value={accountForm.phone}
                onChange={(e) =>
                  setAccountForm((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={activeDialog === "password"}
        onOpenChange={(open) => setActiveDialog(open ? "password" : null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="borrower-current-password">
                Current Password
              </Label>
              <div className="relative">
                <Input
                  id="borrower-current-password"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  placeholder="Enter current password"
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() =>
                    setShowPasswords((prev) => ({
                      ...prev,
                      current: !prev.current,
                    }))
                  }
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="borrower-new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="borrower-new-password"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordForm.newPassword}
                  placeholder="Enter new password"
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() =>
                    setShowPasswords((prev) => ({ ...prev, new: !prev.new }))
                  }
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="borrower-confirm-password">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="borrower-confirm-password"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  placeholder="Confirm new password"
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() =>
                    setShowPasswords((prev) => ({
                      ...prev,
                      confirm: !prev.confirm,
                    }))
                  }
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={activeDialog === "appearance"}
        onOpenChange={(open) => setActiveDialog(open ? "appearance" : null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Appearance</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <button
              onClick={() => setTheme("light")}
              className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${mode === "light" ? "border-primary bg-primary/10" : "border-border"}`}
            >
              <Sun className="w-5 h-5" />
              <span className="font-medium">Light</span>
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${mode === "dark" ? "border-primary bg-primary/10" : "border-border"}`}
            >
              <Moon className="w-5 h-5" />
              <span className="font-medium">Dark</span>
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${mode === "system" ? "border-primary bg-primary/10" : "border-border"}`}
            >
              <Monitor className="w-5 h-5" />
              <span className="font-medium">System</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={activeDialog === "notifications"}
        onOpenChange={(open) => setActiveDialog(open ? "notifications" : null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Notification Preferences</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="dialog-email-notifications"
                  className="cursor-pointer"
                >
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                id="dialog-email-notifications"
                checked={notificationSettings.emailNotifications}
                onCheckedChange={() =>
                  handleNotificationToggle("emailNotifications")
                }
                className="data-[state=checked]:bg-primary"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dialog-loan-updates" className="cursor-pointer">
                  Loan Updates
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about loan application updates
                </p>
              </div>
              <Switch
                id="dialog-loan-updates"
                checked={notificationSettings.loanUpdates}
                onCheckedChange={() => handleNotificationToggle("loanUpdates")}
                className="data-[state=checked]:bg-primary"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dialog-kyc-updates" className="cursor-pointer">
                  KYC Updates
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notifications for KYC verification status
                </p>
              </div>
              <Switch
                id="dialog-kyc-updates"
                checked={notificationSettings.kycUpdates}
                onCheckedChange={() => handleNotificationToggle("kycUpdates")}
                className="data-[state=checked]:bg-primary"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="dialog-security-alerts"
                  className="cursor-pointer"
                >
                  Security Alerts
                </Label>
                <p className="text-sm text-muted-foreground">
                  Important security notifications
                </p>
              </div>
              <Switch
                id="dialog-security-alerts"
                checked={notificationSettings.securityAlerts}
                onCheckedChange={() =>
                  handleNotificationToggle("securityAlerts")
                }
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </BorrowerLayout>
  );
}
