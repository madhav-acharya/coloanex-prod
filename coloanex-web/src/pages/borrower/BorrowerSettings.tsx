import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAuth } from "@/hooks/useAuth";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useUpdateUserMutation } from "@/apis/usersApi";
import {
  useDisconnectMailMutation,
  useGetMailStatusQuery,
} from "@/apis/mailApi";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Activity,
  Loader2,
  User,
  Wallet,
  CreditCard,
  Lock,
  Bell,
  Eye,
  EyeOff,
  Mail,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Palette,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
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
  formatGasPaymentMode,
  getBlockchainAccessSnapshot,
} from "@/utils/blockchainAccess";
import {
  useDeletePaymentConfigMutation,
  useListMyPaymentConfigsQuery,
  useUpsertPaymentConfigMutation,
} from "@/apis/paymentConfigsApi";
import { useNavigate } from "react-router-dom";
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
    card: "border-primary/40 bg-gradient-to-br from-emerald-500/10 to-transparent",
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

const BorrowerSettings = () => {
  const { user, updateUser: updateAuthUser } = useAuth();
  const navigate = useNavigate();
  const { mode, setTheme } = useTheme();
  const [updateUser, { isLoading }] = useUpdateUserMutation();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    pushNotifications: true,
    loanUpdates: true,
    kycUpdates: true,
    systemUpdates: false,
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

  const {
    data: mailStatus,
    isLoading: isLoadingMailStatus,
    refetch: refetchMailStatus,
  } = useGetMailStatusQuery();
  const [disconnectMail, { isLoading: isDisconnecting }] =
    useDisconnectMailMutation();
  const { data: wallets = [], refetch: refetchWallets } =
    useGetMyWalletsQuery();
  const [createWallet, { isLoading: isCreatingWallet }] =
    useCreateWalletMutation();
  const [updateGasMode] = useUpdateGasModeMutation();
  const [setPrimaryWallet] = useSetPrimaryWalletMutation();
  const [deleteWallet] = useDeleteWalletMutation();
  const { data: mySubscriptions = [], refetch: refetchMySubscriptions } =
    useListMySubscriptionsQuery();
  const { data: plans = [] } = useListPlansQuery();
  const [purchaseSubscription, { isLoading: isPurchasingSubscription }] =
    usePurchaseSubscriptionMutation();
  const [selectSubscription, { isLoading: isSelectingSubscription }] =
    useSelectSubscriptionMutation();
  const blockchainAccess = getBlockchainAccessSnapshot({
    gasPaymentMode,
    wallets,
    subscriptions: mySubscriptions,
  });

  const showPaymentConfig = Boolean(user);

  const { data: paymentConfigs = [], refetch: refetchConfigs } =
    useListMyPaymentConfigsQuery(undefined, {
      skip: !showPaymentConfig,
    });
  const [upsertPaymentConfig, { isLoading: isSavingConfig }] =
    useUpsertPaymentConfigMutation();
  const [deletePaymentConfig] = useDeletePaymentConfigMutation();
  const connectedGatewayTypes = Array.from(
    new Set(
      paymentConfigs
        .filter((cfg) => cfg.isActive)
        .map((cfg) => cfg.gateway as "ESEWA" | "KHALTI"),
    ),
  );

  const subscriptionStats = mySubscriptions.map((subscription) => {
    const maxTransactions = Number(subscription.planRef?.maxTransactions || 0);
    const usedTransactions = Number(subscription.usageCount || 0);
    const remainingTransactions =
      maxTransactions > 0
        ? Math.max(maxTransactions - usedTransactions, 0)
        : null;
    const endsAtDate = subscription.endsAt
      ? new Date(subscription.endsAt)
      : null;
    const lifecycleStatus = subscription.lifecycleStatus || "EXPIRED";
    const isExpired = lifecycleStatus === "EXPIRED";
    const isLimitExceeded = lifecycleStatus === "LIMIT_EXCEEDED";
    const isBought = lifecycleStatus === "BOUGHT";

    return {
      ...subscription,
      maxTransactions,
      usedTransactions,
      remainingTransactions,
      isExpired,
      isLimitExceeded,
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

  useEffect(() => {
    const boughtSubscriptions = subscriptionStats.filter(
      (subscription) => subscription.isBought,
    );
    if (boughtSubscriptions.length !== 1) return;

    const onlySubscription = boughtSubscriptions[0];
    if (onlySubscription.isSelected || isSelectingSubscription) return;

    selectSubscription({ id: onlySubscription.id })
      .unwrap()
      .then(() => refetchMySubscriptions())
      .catch(() => {
        // keep settings usable even if auto-select fails
      });
  }, [
    subscriptionStats,
    isSelectingSubscription,
    selectSubscription,
    refetchMySubscriptions,
  ]);

  const handleBuyPlanFromSettings = async (plan: (typeof plans)[number]) => {
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
      navigate(`/pricing?planCode=${encodeURIComponent(plan.code)}`);
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
    }
  }, [user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchWallets(),
        refetchMailStatus(),
        refetchMySubscriptions(),
        refetchConfigs(),
        refreshWalletCoinBalances(),
      ]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mailStatus = params.get("mail");
    const section = params.get("section");

    if (section) {
      setActiveSection(section);
      params.delete("section");
      const remaining = params.toString();
      window.history.replaceState(
        {},
        "",
        remaining ? `/settings?${remaining}` : "/settings",
      );
    }

    if (mailStatus === "success") {
      toast.success("Mail service connected successfully");
      refetchMailStatus();
      window.history.replaceState({}, "", "/settings");
    } else if (mailStatus === "error") {
      toast.error("Failed to connect mail service");
      window.history.replaceState({}, "", "/settings");
    }
  }, [refetchMailStatus]);

  const handleAccountUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      const updateData: any = {};
      if (accountForm.fullName !== user.fullName) {
        updateData.fullName = accountForm.fullName;
      }
      if (accountForm.email && accountForm.email !== user.email) {
        updateData.email = accountForm.email;
      }
      if (accountForm.phone && accountForm.phone !== user.phone) {
        updateData.phone = accountForm.phone;
      }

      if (Object.keys(updateData).length === 0) {
        toast.info("No changes to save");
        return;
      }

      await updateUser({
        id: user.id,
        data: updateData,
      }).unwrap();
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
        data: {
          password: passwordForm.newPassword,
        },
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
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    toast.success("Notification preferences updated");
  };

  const handleMailConnect = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL!;
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/mail/connect`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast.error("Failed to get authorization URL");
      }
    } catch (error) {
      toast.error("Failed to connect mail service");
    }
  };

  const handleMailDisconnect = async () => {
    try {
      await disconnectMail().unwrap();
      toast.success("Mail service disconnected successfully");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to disconnect mail service");
    }
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
      if (error?.code === 4001) {
        toast.error("MetaMask connection request was cancelled");
      } else {
        toast.error(
          error?.data?.message || error?.message || "Failed to connect wallet",
        );
      }
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

      const ethereum = (window as any).ethereum;
      if (ethereum?.request) {
        try {
          await ethereum.request({
            method: "wallet_revokePermissions",
            params: [{ eth_accounts: {} }],
          });
        } catch {
          // Some providers do not support revoke permissions.
        }
      }

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

  useEffect(() => {
    if (activeSection === "wallet") {
      void refreshWalletCoinBalances();
    }
  }, [activeSection, wallets]);

  const saveGasMode = async (mode: "USER_WALLET" | "PLATFORM_WALLET") => {
    if (mode === gasPaymentMode) {
      toast.info("Gas mode already selected");
      return;
    }

    const hasActiveSubscription = mySubscriptions.some(
      (subscription) => subscription.status === "ACTIVE",
    );

    if (mode === "PLATFORM_WALLET" && !hasActiveSubscription) {
      toast.error(
        "Platform gas mode requires an active subscription. Please buy a plan.",
      );
      navigate("/pricing");
      return;
    }

    if (mode === "USER_WALLET" && wallets.length === 0) {
      const address = await connectMetamask();
      if (!address) {
        return;
      }
    }

    const previousMode = gasPaymentMode;
    setGasPaymentMode(mode);
    try {
      await updateGasMode({ gasPaymentMode: mode }).unwrap();
      if (user) {
        updateAuthUser({ ...(user as any), gasPaymentMode: mode } as any);
      }
      toast.success("Gas mode updated");
    } catch (error: any) {
      setGasPaymentMode(previousMode);
      toast.error(error?.data?.message || "Failed to update gas mode");
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
      toast.success("Payment config saved", {
        description: `${configScope} ${configGateway} ${configEnvironment} config is now active.`,
      });
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save payment config");
    }
  };

  if (!user) {
    return (
      <BorrowerLayout title="Settings" description="Manage your settings">
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
      icon: CreditCard,
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
              ? `Connected: ${connectedGatewayTypes
                .map((gateway) =>
                  gateway === "ESEWA" ? "eSewa" : "Khalti",
                )
                .join(" + ")}`
              : "Configure receive credentials for user and tenant payment flows",
          badge:
            connectedGatewayTypes.length > 0 ? (
              <div className="flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5">
                {connectedGatewayTypes.map((gateway) => (
                  <img
                    key={gateway}
                    src={gatewayLogoByType[gateway]}
                    alt={gateway}
                    className="h-3 w-3 rounded-sm object-cover"
                  />
                ))}
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  Connected
                </span>
              </div>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-md bg-destructive/10 text-destructive border border-destructive/20 font-bold uppercase tracking-wider">
                Not Connected
              </span>
            ),
        },
      ]
      : []),
    {
      id: "mail",
      icon: Mail,
      title: "Mail Service",
      description: mailStatus?.isConnected ? "Connected" : "Not connected",
      badge: mailStatus?.isConnected ? (
        <span className="text-xs px-2 py-0.5 rounded-md bg-green-500/10 text-green-500 border border-green-500/20 font-bold uppercase tracking-wider">
          Connected
        </span>
      ) : (
        <span className="text-xs px-2 py-0.5 rounded-md bg-destructive/10 text-destructive border border-destructive/20 font-bold uppercase tracking-wider">
          Not Connected
        </span>
      ),
    },
    {
      id: "notifications",
      icon: Bell,
      title: "Notifications",
      description: "Manage notification preferences",
    },
  ];

  if (activeSection) {
    return (
      <BorrowerLayout
        title="Settings"
        description="Manage your account settings and preferences"
      >
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={() => setActiveSection(null)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Button>

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
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters long
                    </p>
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
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-base">Theme</Label>
                    <p className="text-sm text-muted-foreground">
                      Select your preferred theme or sync with your system
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <button
                      onClick={() => setTheme("light")}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${mode === "light"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                        }`}
                    >
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${mode === "light" ? "bg-primary" : "bg-muted"
                          }`}
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
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${mode === "dark"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                        }`}
                    >
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${mode === "dark" ? "bg-primary" : "bg-muted"
                          }`}
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
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${mode === "system"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                        }`}
                    >
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${mode === "system" ? "bg-primary" : "bg-muted"
                          }`}
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
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "wallet" && (
            <Card>
              <CardHeader>
                <CardTitle>MetaMask Wallet Settings</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect your MetaMask wallet and choose how blockchain gas is
                  paid.
                </p>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-6">
                {wallets.some((w) => w.provider === "METAMASK") ? (
                  <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center border border-white/20 shadow-sm">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                          MetaMask Connected
                        </p>
                        <p className="text-sm text-muted-foreground/80 font-medium break-all">
                          {wallets.find((wallet) => wallet.isPrimary)?.address ||
                            wallets.find((w) => w.provider === "METAMASK")?.address}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={disconnectMetamask}
                      disabled={isCreatingWallet}
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-destructive hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 font-bold h-11 px-6 transition-all"
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-destructive flex items-center justify-center border border-white/20 shadow-sm">
                        <X className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-destructive text-lg">
                          MetaMask Not Connected
                        </p>
                        <p className="text-sm text-muted-foreground/80 font-medium">
                          You are currently disconnected. Link your wallet to perform on-chain operations.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={connectMetamask}
                      disabled={isCreatingWallet}
                      className="bg-destructive hover:bg-destructive/90 text-white font-bold h-11 px-6 border border-white/10"
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
                    {!blockchainAccess.canRunBlockchain &&
                      blockchainAccess.reason ? (
                      <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                        {blockchainAccess.reason}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className={`cursor-pointer ${gasPaymentMode === "USER_WALLET"
                        ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                        : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                        }`}
                      onClick={() => saveGasMode("USER_WALLET")}
                    >
                      User Wallet
                    </Button>
                    <Button
                      className={`cursor-pointer ${gasPaymentMode === "PLATFORM_WALLET"
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                        : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        }`}
                      onClick={() => saveGasMode("PLATFORM_WALLET")}
                    >
                      Platform Sponsored
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    User Wallet mode requires MetaMask connection. Platform
                    Sponsored mode requires an active subscription.
                  </p>
                </div>

                <div className="space-y-3">

                  <div className="flex gap-2">
                    <Input
                      value={manualWalletAddress}
                      onChange={(e) => setManualWalletAddress(e.target.value)}
                      placeholder="Add wallet manually (0x...)"
                    />
                    <Button
                      variant="outline"
                      onClick={addManualWebWallet}
                      className="cursor-pointer bg-muted text-foreground hover:bg-muted/80"
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
                          className="border rounded-md p-3 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {wallet.label || "Wallet"} • {wallet.purpose}
                            </p>
                            <p className="text-xs text-muted-foreground">
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
                          <div className="flex gap-2">
                            {!wallet.isPrimary && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="cursor-pointer bg-muted text-foreground hover:bg-muted/80"
                                onClick={async () => {
                                  await setPrimaryWallet({ id: wallet.id });
                                  refetchWallets();
                                }}
                              >
                                Set Primary
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              className="cursor-pointer"
                              onClick={async () => {
                                await deleteWallet({ id: wallet.id });
                                refetchWallets();
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
          )}

          {activeSection === "subscriptions" && (
            <Card>
              <CardHeader className="border-b border-border/60 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-cyan-500/10">
                <CardTitle>Subscriptions</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Pick your gas sponsorship tier and upgrade instantly.
                </p>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-5">
                <div className="rounded-xl border border-border/70 bg-gradient-to-br from-background via-muted/20 to-background p-4">
                  {(() => {
                    const activeSub = subscriptionStats.find(
                      (subscription) => subscription.isBought,
                    );
                    return (
                      <>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Active Subscription
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <p className="text-lg font-semibold">
                            {activeSub?.plan || "No Active Plan"}
                          </p>
                          {activeSub ? (
                            <span className="text-xs text-muted-foreground">
                              Used {activeSub.usedTransactions} • Remaining{" "}
                              {activeSub.remainingTransactions === null
                                ? "Unlimited"
                                : activeSub.remainingTransactions}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Platform Sponsored gas requires an active
                          subscription.
                        </p>
                      </>
                    );
                  })()}
                </div>

                <div className="space-y-2">
                  <Label>My Subscription Usage</Label>
                  {subscriptionStats.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      No subscriptions yet. Buy a plan to enable sponsored gas
                      and blockchain workflows.
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {subscriptionStats.map((subscription) => (
                        <div
                          key={subscription.id}
                          className="rounded-xl border border-border/70 bg-card/60 p-4 hover:shadow-md transition-all"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold text-sm">
                                {subscription.plan} Plan
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {subscription.scope} scope • Valid till{" "}
                                {subscription.endsAt
                                  ? new Date(
                                    subscription.endsAt,
                                  ).toLocaleDateString()
                                  : "Indefinitely"}
                              </p>
                            </div>
                            <Badge
                              variant={
                                subscription.lifecycleStatus === "EXPIRED"
                                  ? "destructive"
                                  : subscription.lifecycleStatus ===
                                    "LIMIT_EXCEEDED"
                                    ? "outline"
                                    : "secondary"
                              }
                              className="text-[10px] font-bold uppercase"
                            >
                              {subscription.lifecycleStatus}
                            </Badge>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] uppercase tracking-wider font-semibold">
                            <div className="bg-muted/50 p-1.5 rounded-lg text-center">
                              <p className="text-muted-foreground">Used</p>
                              <p className="text-foreground">
                                {subscription.usedTransactions}
                              </p>
                            </div>
                            <div className="bg-muted/50 p-1.5 rounded-lg text-center">
                              <p className="text-muted-foreground">Remaining</p>
                              <p className="text-foreground">
                                {subscription.remainingTransactions === null
                                  ? "∞"
                                  : subscription.remainingTransactions}
                              </p>
                            </div>
                          </div>

                          <p
                            className={`text-xs mt-1 ${subscription.lifecycleStatus === "EXPIRED"
                              ? "text-destructive"
                              : subscription.lifecycleStatus ===
                                "LIMIT_EXCEEDED"
                                ? "text-amber-500"
                                : "text-primary"
                              }`}
                          >
                            {subscription.endsAt
                              ? `Valid till ${new Date(subscription.endsAt).toLocaleDateString()}`
                              : "No expiry date"}
                          </p>
                          {(subscription.isBought ||
                            subscription.status === "ACTIVE") && (
                              <div className="mt-3 flex justify-end">
                                <Button
                                  size="sm"
                                  variant={
                                    subscription.isSelected
                                      ? "secondary"
                                      : "outline"
                                  }
                                  disabled={
                                    subscription.isSelected ||
                                    isSelectingSubscription
                                  }
                                  onClick={() =>
                                    handleSelectSubscription(subscription.id)
                                  }
                                >
                                  {subscription.isSelected
                                    ? "Selected"
                                    : "Use This Subscription"}
                                </Button>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Available Plans</Label>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {plans
                      .filter((plan) => plan.isActive)
                      .map((plan) =>
                        (() => {
                          const accent = planAccentByCode[
                            plan.code.toLowerCase()
                          ] || {
                            card: "border-border/70 bg-gradient-to-br from-card to-muted/20",
                            button:
                              "bg-primary hover:bg-primary/90 text-primary-foreground",
                            chip: "bg-primary/10 text-primary",
                          };

                          const existing = subscriptionStats.find(
                            (subscription) =>
                              subscription.scope === plan.scope &&
                              subscription.plan === plan.code,
                          );
                          const lifecycleStatus =
                            existing?.lifecycleStatus || null;

                          return (
                            <div
                              key={plan.id}
                              className={`rounded-xl border p-4 shadow-sm transition-all hover:shadow-lg ${accent.card}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-semibold text-base">
                                  {plan.name}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${accent.chip}`}
                                  >
                                    {plan.scope}
                                  </span>
                                  {lifecycleStatus ? (
                                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-muted text-muted-foreground">
                                      {lifecycleStatus === "BOUGHT"
                                        ? "Bought"
                                        : lifecycleStatus === "LIMIT_EXCEEDED"
                                          ? "Limit Exceeded"
                                          : "Expired"}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {plan.description || "No description"}
                              </p>
                              <p className="text-sm font-semibold mt-2">
                                {plan.currency}{" "}
                                {Number(plan.price).toLocaleString()}/
                                {plan.billingCycle.toLowerCase()}
                              </p>
                              <Button
                                className={`mt-3 w-full ${accent.button}`}
                                disabled={
                                  isPurchasingSubscription ||
                                  lifecycleStatus === "BOUGHT"
                                }
                                onClick={() => handleBuyPlanFromSettings(plan)}
                              >
                                {isPurchasingSubscription
                                  ? "Processing..."
                                  : lifecycleStatus === "BOUGHT"
                                    ? "Already Bought"
                                    : Number(plan.price || 0) > 0
                                      ? `Buy ${plan.name}`
                                      : `Activate ${plan.name}`}
                              </Button>
                            </div>
                          );
                        })(),
                      )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => navigate("/pricing")}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Buy / Upgrade Subscription
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "payment-config" && showPaymentConfig && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Config</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Borrower user configs are used to receive loan disbursement.
                  Tenant or lender configs are used to receive borrower
                  repayments.
                </p>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">
                      Saved Configurations
                    </p>
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
                            Merchant ID{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            placeholder={paymentConfigPlaceholders.merchantId}
                            value={configMerchantId}
                            onChange={(e) =>
                              setConfigMerchantId(e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Webhook URL</Label>
                          <Input
                            placeholder={paymentConfigPlaceholders.webhookUrl}
                            value={configWebhookUrl}
                            onChange={(e) =>
                              setConfigWebhookUrl(e.target.value)
                            }
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
                            Public Key{" "}
                            <span className="text-destructive">*</span>
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
                            onChange={(e) =>
                              setConfigWebhookUrl(e.target.value)
                            }
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button
                        onClick={savePaymentConfig}
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
                      No payment configs found. Click "Add Payment Config" to
                      create one.
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
                            <p className="text-sm font-semibold">
                              {cfg.gateway}
                            </p>
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
                            toast.success("Payment config deleted");
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
          )}

          {activeSection === "mail" && (
            <Card>
              <CardHeader>
                <CardTitle>Mail Service Configuration</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect your email account to send notifications
                </p>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                {isLoadingMailStatus ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : mailStatus?.isConnected ? (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800/40 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-green-900 dark:text-green-100">
                        Mail Service Connected
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {mailStatus.email}
                      </p>
                    </div>
                    <Button
                      onClick={handleMailDisconnect}
                      disabled={isDisconnecting}
                      size="sm"
                      className="cursor-pointer bg-destructive hover:bg-red-700 text-white"
                    >
                      {isDisconnecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        <>
                          <X className="mr-2 h-4 w-4" />
                          Disconnect
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800/40 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center">
                        <X className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-red-900 dark:text-red-100">
                        Mail Service Not Connected
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Connect your Google account to enable email
                        notifications
                      </p>
                    </div>
                    <Button
                      onClick={handleMailConnect}
                      size="sm"
                      className="cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Connect
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
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
                      <Label htmlFor="loan-updates" className="cursor-pointer">
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
      </BorrowerLayout>
    );
  }

  if (activeSection) {
    const activeOption = settingsOptions.find(o => o.id === activeSection);
    const Icon = activeOption?.icon || ArrowLeft;

    return (
      <BorrowerLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 animate-fade-in px-4">
            <div className="space-y-2">
              <Button
                variant="ghost"
                onClick={() => setActiveSection(null)}
                className="group -ml-4 mb-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                Back to Controls
              </Button>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                  <Icon className="w-6 h-6" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-foreground font-headline leading-none">
                  {activeOption?.title}
                </h1>
              </div>
              <p className="text-muted-foreground text-lg font-medium max-w-2xl pl-1">
                {activeOption?.description}
              </p>
            </div>
          </div>

          <div className="animate-fade-up">
            <Card className="bg-surface/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <CardContent className="p-8 sm:p-12">
                {activeSection === "account" && (
                  <form onSubmit={handleAccountUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4 col-span-full">
                       <h3 className="text-xl font-bold tracking-tight border-b border-border/20 pb-4 mb-4">Identity Details</h3>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account-fullName" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Full Name</Label>
                      <Input
                        id="account-fullName"
                        value={accountForm.fullName}
                        onChange={(e) => setAccountForm((prev) => ({ ...prev, fullName: e.target.value }))}
                        className="h-14 rounded-2xl bg-surface/20 border-border/40 focus:ring-primary/20"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account-email" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email Address</Label>
                      <Input
                        id="account-email"
                        type="email"
                        value={accountForm.email}
                        onChange={(e) => setAccountForm((prev) => ({ ...prev, email: e.target.value }))}
                        className="h-14 rounded-2xl bg-surface/20 border-border/40 focus:ring-primary/20"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account-phone" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Contact Number</Label>
                      <Input
                        id="account-phone"
                        value={accountForm.phone}
                        onChange={(e) => setAccountForm((prev) => ({ ...prev, phone: e.target.value }))}
                        className="h-14 rounded-2xl bg-surface/20 border-border/40 focus:ring-primary/20"
                        placeholder="+1 234 567 890"
                      />
                    </div>
                    <div className="col-span-full flex justify-end pt-8 border-t border-border/20 mt-8">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20"
                      >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Commit Identity"}
                      </Button>
                    </div>
                  </form>
                )}

                {activeSection === "wallet" && (
                  <div className="space-y-12">
                    <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                       <div className="space-y-2 text-center sm:text-left">
                          <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                             {walletConfigs.connectedAddress ? (
                                <>Address Linked <ShieldCheck className="text-emerald-500 w-6 h-6" /></>
                             ) : (
                                <>Link Crypto Wallet <Wallet className="text-primary w-6 h-6" /></>
                             )}
                          </h3>
                          <p className="text-muted-foreground font-medium max-w-sm">
                             Authorize your blockchain identity to participate in on-chain lending protocols.
                          </p>
                       </div>
                       {walletConfigs.connectedAddress ? (
                          <div className="flex flex-col items-end gap-3">
                             <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-4 py-2 rounded-xl font-black text-[10px] tracking-widest uppercase">
                                Verified Connection
                             </Badge>
                             <div className="font-mono text-xs bg-surface/40 p-3 rounded-xl border border-border/20">
                                {walletConfigs.connectedAddress}
                             </div>
                             <Button variant="ghost" onClick={handleDisconnectWallet} className="text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl font-bold text-xs">
                                Disconnect Session
                             </Button>
                          </div>
                       ) : (
                          <Button 
                            onClick={handleConnectWallet} 
                            disabled={isWalletBusy}
                            className="h-14 px-8 rounded-2xl bg-primary hover:scale-105 transition-transform shadow-xl shadow-primary/20 font-black text-xs uppercase tracking-widest"
                          >
                             Link Institutional Wallet
                          </Button>
                       )}
                    </div>

                    {walletConfigs.connectedAddress && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                         <div className="space-y-6">
                            <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground pl-1">Gas Processing Mode</h4>
                            <div className="grid gap-4">
                               <button 
                                 onClick={() => handleUpdateGasMode("WALLET_PAYMENT")}
                                 className={cn(
                                   "p-6 text-left rounded-3xl border-2 transition-all flex items-start gap-4 group",
                                   walletConfigs.gasPaymentMode === "WALLET_PAYMENT" ? "border-primary bg-primary/5" : "border-border/20 hover:border-primary/50"
                                 )}
                               >
                                  <div className={cn("p-2 rounded-lg", walletConfigs.gasPaymentMode === "WALLET_PAYMENT" ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                                     <Zap className="w-5 h-5" />
                                  </div>
                                  <div className="space-y-1">
                                     <p className="font-black text-sm uppercase tracking-tight">Standard Mode</p>
                                     <p className="text-xs text-muted-foreground font-medium leading-relaxed">Execute operations directly from your linked wallet balance.</p>
                                  </div>
                               </button>
                               <button 
                                 onClick={() => handleUpdateGasMode("PLATFORM_WALLET")}
                                 className={cn(
                                   "p-6 text-left rounded-3xl border-2 transition-all flex items-start gap-4 group",
                                   walletConfigs.gasPaymentMode === "PLATFORM_WALLET" ? "border-primary bg-primary/5" : "border-border/20 hover:border-primary/50"
                                 )}
                               >
                                  <div className={cn("p-2 rounded-lg", walletConfigs.gasPaymentMode === "PLATFORM_WALLET" ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                                     <ShieldCheck className="w-5 h-5" />
                                  </div>
                                  <div className="space-y-1">
                                     <p className="font-black text-sm uppercase tracking-tight">Institutional Sponsorship</p>
                                     <p className="text-xs text-muted-foreground font-medium leading-relaxed">Transactions are sponsored by the platform for zero gas frictions.</p>
                                  </div>
                               </button>
                            </div>
                         </div>

                         <div className="bg-surface-container-low/20 rounded-[2rem] p-8 border border-border/20 space-y-6">
                            <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Digital Assets Summary</h4>
                            <div className="space-y-4">
                               <div className="flex justify-between items-center bg-surface/40 p-4 rounded-2xl border border-border/10">
                                  <span className="text-sm font-bold">Base Token Balance</span>
                                  <span className="font-black text-primary">0.00 ETH</span>
                               </div>
                               <div className="flex justify-between items-center bg-surface/40 p-4 rounded-2xl border border-border/10">
                                  <span className="text-sm font-bold">Authorized for Lending</span>
                                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[10px]">Verified</Badge>
                               </div>
                            </div>
                         </div>
                      </div>
                    )}
                  </div>
                )}

                {activeSection === "notifications" && (
                   <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         {[
                            { id: "emailNotifications", title: "Global Intel", desc: "Institutional reports and market updates via secure email." },
                            { id: "loanUpdates", title: "Commitment Alerts", desc: "Real-time verification of loan status and smart contract events." },
                            { id: "kycUpdates", title: "Identity Tracking", desc: "Notification of KYC processing and periodic re-verification." },
                            { id: "securityAlerts", title: "Threat Detection", desc: "Critical security notifications regarding institutional access." }
                         ].map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-6 bg-surface-container-low/20 rounded-3xl border border-border/20 group hover:border-primary/30 transition-colors">
                               <div className="space-y-1">
                                  <Label className="text-base font-black tracking-tight cursor-pointer" htmlFor={item.id}>{item.title}</Label>
                                  <p className="text-xs text-muted-foreground font-medium">{item.desc}</p>
                               </div>
                               <Switch
                                  id={item.id}
                                  checked={notificationSettings[item.id as keyof typeof notificationSettings]}
                                  onCheckedChange={() => handleNotificationToggle(item.id as keyof typeof notificationSettings)}
                                  className="data-[state=checked]:bg-primary"
                               />
                            </div>
                         ))}
                      </div>
                   </div>
                )}

                {!["account", "wallet", "notifications"].includes(activeSection) && (
                   <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
                      <div className="p-6 rounded-full bg-primary/10 text-primary">
                         <Icon className="w-12 h-12" />
                      </div>
                      <div className="space-y-2">
                         <h3 className="text-2xl font-black tracking-tight">{activeOption?.title} Configuration</h3>
                         <p className="text-muted-foreground max-w-sm font-medium">This module is currently undergoing institutional optimization for the new portal ecosystem.</p>
                      </div>
                      <Button variant="outline" onClick={() => setActiveSection(null)} className="rounded-2xl px-8 h-12 font-black text-xs uppercase tracking-widest">
                         Return to Control Center
                      </Button>
                   </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </BorrowerLayout>
    );
  }

  return (
    <BorrowerLayout
      title="System Configurations"
      description="Manage your institutional account settings, security, and global preferences."
    >
      <div className="space-y-16 animate-fade-up">
        {/* Simplified Header / Actions */}
        <div className="flex justify-start">
           <Button
             variant="ghost"
             size="sm"
             onClick={handleRefresh}
             disabled={isRefreshing}
             className="rounded-full px-6 bg-surface/40 backdrop-blur-md border border-border/40 hover:bg-primary/10 hover:text-primary transition-all font-black text-[10px] uppercase tracking-widest gap-2"
           >
             {isRefreshing ? (
               <Loader2 className="w-3.5 h-3.5 animate-spin" />
             ) : (
               <Activity className="w-3.5 h-3.5" />
             )}
             Synchronize Session
           </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsOptions.map((option, idx) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => setActiveSection(option.id)}
                className="group relative flex flex-col items-start text-left p-8 bg-surface/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] hover:bg-surface/60 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 shadow-sm hover:shadow-2xl hover:shadow-primary/10"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="mb-6 p-4 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                  <Icon className="w-6 h-6" />
                </div>
                
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between w-full">
                    <h3 className="text-xl font-black tracking-tight">{option.title}</h3>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors translate-x-0 group-hover:translate-x-1 duration-300" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    {option.description}
                  </p>
                </div>

                {option.badge && (
                  <div className="mt-6 w-full pt-6 border-t border-border/20">
                    {option.badge}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </BorrowerLayout>
  );
};

export default BorrowerSettings;
