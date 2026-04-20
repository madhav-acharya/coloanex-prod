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
  FileText,
  Wallet,
  CreditCard,
  Lock,
  Bell,
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
} from "lucide-react";
import WalletSection from "@/components/settings/WalletSection";
import SubscriptionsSection from "@/components/settings/SubscriptionsSection";
import PaymentConfigSection from "@/components/settings/PaymentConfigSection";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { useGetLoansQuery } from "@/apis/loansApi";
import { LoanStatus } from "@/types/loan";

const gatewayLogoByType: Record<"ESEWA" | "KHALTI", string> = {
  ESEWA: "/images/esewa.png",
  KHALTI: "/images/khalti.png",
};

const planAccentByCode: Record<
  string,
  { card: string; button: string; chip: string }
> = {
  free: {
    card: "border-border/70 bg-card/80",
    button:
      "bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/80",
    chip: "bg-primary/15 text-emerald-300",
  },
  premium: {
    card: "border-sky-400/40 bg-gradient-to-br from-sky-500/10 to-transparent",
    button: "bg-sky-600 hover:bg-sky-700 text-white border border-sky-500/80",
    chip: "bg-sky-500/15 text-sky-300",
  },
  pro: {
    card: "border-amber-400/40 bg-gradient-to-br from-amber-500/10 to-transparent",
    button:
      "bg-amber-600 hover:bg-amber-700 text-white border border-amber-500/80",
    chip: "bg-amber-500/15 text-amber-300",
  },
  enterprise: {
    card: "border-fuchsia-400/40 bg-gradient-to-br from-fuchsia-500/10 to-transparent",
    button:
      "bg-fuchsia-600 hover:bg-fuchsia-700 text-white border border-fuchsia-500/80",
    chip: "bg-fuchsia-500/15 text-fuchsia-300",
  },
};

const accountSections = new Set([
  "my-loans",
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
  const {
    data: accountLoansData,
    isLoading: isLoadingAccountLoans,
    isFetching: isFetchingAccountLoans,
  } = useGetLoansQuery({
    page: 1,
    limit: 100,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

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
  const accountLoans = accountLoansData?.data || [];

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
      <Layout title="Settings" description="Manage your settings">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  const settingsOptions = [
    {
      id: "account",
      icon: User,
      title: "Account Information",
      description: "Update your account details",
    },
    {
      id: "password",
      icon: Lock,
      title: "Change Password",
      description: "Update your password",
    },
    {
      id: "appearance",
      icon: Palette,
      title: "Appearance",
      description: `Theme: ${mode === "system" ? "System" : mode === "dark" ? "Dark" : "Light"}`,
    },
    {
      id: "wallet",
      icon: Wallet,
      title: "Wallet",
      description: `Gas mode: ${formatGasPaymentMode(gasPaymentMode)}`,
      badge:
        blockchainAccess.mode === "USER_WALLET" ? (
          blockchainAccess.hasWallet ? (
            <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Check className="w-3 h-3" />
              Connected
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-md bg-destructive/10 text-destructive border border-destructive/20 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <X className="w-3 h-3" />
              Not Connected
            </span>
          )
        ) : (
          <span className="text-xs px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-500 border border-sky-500/20 font-bold uppercase tracking-wider">
            Platform Mode
          </span>
        ),
    },
    {
      id: "subscriptions",
      icon: IconCurrencyRupeeNepalese,
      title: "Subscriptions",
      description: "View active plan and upgrade options",
      badge: hasLimitReached ? (
        <span className="text-xs px-2 py-0.5 rounded-md bg-destructive/10 text-destructive border border-destructive/20 font-bold uppercase tracking-wider">
          Limit Reached
        </span>
      ) : hasActiveSubscription ? (
        <span className="text-xs px-2 py-0.5 rounded-md bg-green-500/10 text-green-500 border border-green-500/20 font-bold uppercase tracking-wider">
          Active
        </span>
      ) : (
        <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold uppercase tracking-wider">
          Inactive
        </span>
      ),
    },
    ...(showPaymentConfig
      ? [
          {
            id: "payment-config",
            icon: CreditCard,
            title: "Payment Config",
            description:
              connectedGatewayTypes.length > 0
                ? `Connected: ${connectedGatewayTypes.map((gateway) => (gateway === "ESEWA" ? "eSewa" : "Khalti")).join(" + ")}`
                : "Configure receive credentials for user and tenant payment flows",
          },
        ]
      : []),
    {
      id: "notifications",
      icon: Bell,
      title: "Notifications",
      description: "Manage notification preferences",
    },
  ];

  const accountNavSections = [
    {
      id: "account",
      icon: User,
      title: "Account Information",
      description: "Update your profile details",
    },
    {
      id: "my-loans",
      icon: FileText,
      title: "My Loans",
      description: "Open and track loan requests",
    },
    {
      id: "password",
      icon: Lock,
      title: "Change Password",
      description: "Secure your account access",
    },
    {
      id: "appearance",
      icon: Palette,
      title: "Appearance",
      description: "Choose app theme",
    },
    {
      id: "wallet",
      icon: Wallet,
      title: "Wallet",
      description: "Manage blockchain wallet",
    },
    {
      id: "subscriptions",
      icon: IconCurrencyRupeeNepalese,
      title: "Subscriptions",
      description: "Plans and usage limits",
    },
    ...(showPaymentConfig
      ? [
          {
            id: "payment-config",
            icon: CreditCard,
            title: "Payment Config",
            description: "Gateway credentials",
          },
        ]
      : []),
    {
      id: "notifications",
      icon: Bell,
      title: "Notifications",
      description: "Alerts and preferences",
    },
  ];

  if (accountSections.has(activeSection)) {
    return (
      <Layout
        title="Account"
        description="Manage settings and review your loans from one workspace"
      >
        <div className="settings-shell grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr] lg:gap-6">
          <Card className="hidden lg:block rounded-2xl border-border/70 bg-card/75 lg:sticky lg:top-28 lg:max-h-[calc(100vh-7.5rem)] lg:overflow-hidden">
            <CardContent className="p-4 space-y-4 h-full overflow-y-auto">
              <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/40 p-3">
                <Avatar className="h-10 w-10 ring-1 ring-primary/25">
                  <AvatarImage src={user?.profileImage} alt={user?.fullName} />
                  <AvatarFallback className="bg-primary/15 text-primary font-semibold">
                    {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-none truncate">
                    {user?.fullName}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                {accountNavSections.map((option) => {
                  const Icon = option.icon;
                  const isActive = activeSection === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setActiveSection(option.id)}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors cursor-pointer ${
                        isActive
                          ? "border-primary/40 bg-primary/10"
                          : "border-border/40 bg-background/30 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {option.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                Logout
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="lg:hidden rounded-2xl border-border/70 bg-card/80">
              <CardContent className="p-0">
                <div className="px-4 pt-4 pb-5 text-center border-b border-border/40 bg-muted/10">
                  <Avatar className="h-16 w-16 ring-2 ring-primary/25 mx-auto">
                    <AvatarImage
                      src={user?.profileImage}
                      alt={user?.fullName}
                    />
                    <AvatarFallback className="bg-primary/15 text-primary font-semibold text-lg">
                      {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-lg font-semibold mt-3">{user?.fullName}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {user?.email}
                  </p>
                </div>
                <div className="px-3 py-3 overflow-x-auto">
                  <div className="flex items-center gap-2 min-w-max">
                    {accountNavSections.map((option) => {
                      const Icon = option.icon;
                      const isActive = activeSection === option.id;
                      return (
                        <button
                          key={`mobile-${option.id}`}
                          type="button"
                          onClick={() => setActiveSection(option.id)}
                          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border transition-colors ${
                            isActive
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted/40 text-muted-foreground border-border/50"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{option.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
            {activeSection === "my-loans" && (
              <Card>
                <CardHeader>
                  <CardTitle>My Loans</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Open a specific loan to review details and status
                  </p>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6 space-y-3">
                  {isLoadingAccountLoans || isFetchingAccountLoans ? (
                    <div className="space-y-2.5">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : accountLoans.length === 0 ? (
                    <div className="rounded-lg border border-border/30 bg-muted/10 p-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        No loans found in your account.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {accountLoans.map((loan) => (
                        <button
                          key={loan.id}
                          type="button"
                          onClick={() =>
                            navigate(`/borrower/my-loans/${loan.id}`)
                          }
                          className="w-full rounded-lg border border-border/30 bg-muted/10 px-3.5 py-3 text-left hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {loan.purpose || "Loan facility"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Applied{" "}
                                {new Date(loan.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="outline" className="capitalize">
                              {String(loan.status || "draft")
                                .toLowerCase()
                                .replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              NPR{" "}
                              {Number(loan.requestedAmount || 0).toLocaleString(
                                "en-IN",
                              )}
                            </span>
                            <span>{loan.requestedTermMonths || 0} months</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeSection === "account" && (
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Update your account details and contact information
                  </p>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6">
                  <form onSubmit={handleAccountUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="account-fullName">Full Name</Label>
                      <Input
                        id="account-fullName"
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
                      <Label htmlFor="account-email">Email</Label>
                      <Input
                        id="account-email"
                        type="email"
                        value={accountForm.email}
                        onChange={(e) =>
                          setAccountForm((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account-phone">Phone</Label>
                      <Input
                        id="account-phone"
                        value={accountForm.phone}
                        onChange={(e) =>
                          setAccountForm((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeSection === "password" && (
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Update your password to keep your account secure
                  </p>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6">
                  <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordForm.currentPassword}
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
                      <Label htmlFor="new-password">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordForm.newPassword}
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
                            setShowPasswords((prev) => ({
                              ...prev,
                              new: !prev.new,
                            }))
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
                      <Label htmlFor="confirm-password">
                        Confirm New Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordForm.confirmPassword}
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
                    <div className="flex justify-end pt-4">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update Password"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeSection === "appearance" && (
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Customize how Coloanex looks on your device
                  </p>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6">
                  <div className="grid gap-3">
                    <button
                      onClick={() => setTheme("light")}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer ${mode === "light" ? "border-primary bg-primary/10" : "border-border"}`}
                    >
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${mode === "light" ? "bg-primary" : "bg-muted"}`}
                      >
                        <Sun
                          className={`w-5 h-5 ${mode === "light" ? "text-white" : "text-muted-foreground"}`}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">Light</p>
                        <p className="text-sm text-muted-foreground">
                          Bright and clean appearance
                        </p>
                      </div>
                      {mode === "light" && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </button>

                    <button
                      onClick={() => setTheme("dark")}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer ${mode === "dark" ? "border-primary bg-primary/10" : "border-border"}`}
                    >
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${mode === "dark" ? "bg-primary" : "bg-muted"}`}
                      >
                        <Moon
                          className={`w-5 h-5 ${mode === "dark" ? "text-white" : "text-muted-foreground"}`}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">Dark</p>
                        <p className="text-sm text-muted-foreground">
                          Easy on the eyes in low light
                        </p>
                      </div>
                      {mode === "dark" && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </button>

                    <button
                      onClick={() => setTheme("system")}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer ${mode === "system" ? "border-primary bg-primary/10" : "border-border"}`}
                    >
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${mode === "system" ? "bg-primary" : "bg-muted"}`}
                      >
                        <Monitor
                          className={`w-5 h-5 ${mode === "system" ? "text-white" : "text-muted-foreground"}`}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">System</p>
                        <p className="text-sm text-muted-foreground">
                          Follows your device settings
                        </p>
                      </div>
                      {mode === "system" && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </button>
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
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage your notification preferences
                  </p>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label
                          htmlFor="email-notifications"
                          className="cursor-pointer"
                        >
                          Email Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch
                        id="email-notifications"
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
                        <Label
                          htmlFor="loan-updates"
                          className="cursor-pointer"
                        >
                          Loan Updates
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified about loan application updates
                        </p>
                      </div>
                      <Switch
                        id="loan-updates"
                        checked={notificationSettings.loanUpdates}
                        onCheckedChange={() =>
                          handleNotificationToggle("loanUpdates")
                        }
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="kyc-updates" className="cursor-pointer">
                          KYC Updates
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Notifications for KYC verification status
                        </p>
                      </div>
                      <Switch
                        id="kyc-updates"
                        checked={notificationSettings.kycUpdates}
                        onCheckedChange={() =>
                          handleNotificationToggle("kycUpdates")
                        }
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label
                          htmlFor="security-alerts"
                          className="cursor-pointer"
                        >
                          Security Alerts
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Important security notifications
                        </p>
                      </div>
                      <Switch
                        id="security-alerts"
                        checked={notificationSettings.securityAlerts}
                        onCheckedChange={() =>
                          handleNotificationToggle("securityAlerts")
                        }
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="settings-shell rounded-3xl border-border/70 bg-card/75">
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
                    className={`rounded-full border text-[10px] ${
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

        <Card className="settings-shell rounded-3xl border-border/70 bg-card/75">
          <CardContent className="p-6">
            <div className="mb-4">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
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
                    className="group rounded-2xl border border-border/60 bg-background/30 p-4 hover:bg-primary/5 cursor-pointer transition-colors"
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
    </Layout>
  );
}
