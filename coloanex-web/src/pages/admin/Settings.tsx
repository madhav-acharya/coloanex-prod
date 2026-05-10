import { useEffect, useState } from "react";
import { ethers } from "ethers";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useUpdateUserMutation } from "@/apis/usersApi";
import {
  useDisconnectMailMutation,
  useGetMailStatusQuery,
} from "@/apis/mailApi";
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
import WalletSection from "@/components/settings/WalletSection";
import SubscriptionsSection from "@/components/settings/SubscriptionsSection";
import PaymentConfigSection from "@/components/settings/PaymentConfigSection";

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

export default function Settings() {
  const settingsBasePath = "/settings";
  const pricingPath = "/pricing";
  const Layout = DashboardLayout;

  const navigate = useNavigate();
  const { user, updateUser: updateAuthUser } = useAuth();
  const { mode, setTheme } = useTheme();

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [updateUser, { isLoading }] = useUpdateUserMutation();
  const [disconnectMail, { isLoading: isDisconnecting }] =
    useDisconnectMailMutation();
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

  const {
    data: mailStatus,
    isLoading: isLoadingMailStatus,
    refetch: refetchMailStatus,
  } = useGetMailStatusQuery();
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
    const mailResult = params.get("mail");
    const section = params.get("section");

    if (section) {
      setActiveSection(section);
      params.delete("section");
      const remaining = params.toString();
      window.history.replaceState(
        {},
        "",
        remaining ? `${settingsBasePath}?${remaining}` : settingsBasePath,
      );
    }

    if (mailResult === "success") {
      toast.success("Mail service connected successfully");
      void refetchMailStatus();
      window.history.replaceState({}, "", settingsBasePath);
    } else if (mailResult === "error") {
      toast.error("Failed to connect mail service");
      window.history.replaceState({}, "", settingsBasePath);
    }
  }, [refetchMailStatus, settingsBasePath]);

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

  const handleMailConnect = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL!;
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/mail/connect`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.authUrl) window.location.href = data.authUrl;
      else toast.error("Failed to get authorization URL");
    } catch {
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
                ? `Connected: ${connectedGatewayTypes.map((gateway) => (gateway === "ESEWA" ? "eSewa" : "Khalti")).join(" + ")}`
                : "Configure receive credentials for user and tenant payment flows",
          },
        ]
      : []),
    {
      id: "mail",
      icon: Mail,
      title: "Mail Service",
      description: mailStatus?.isConnected ? "Connected" : "Not connected",
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
      <Layout
        title="Settings"
        description="Manage your account settings and preferences"
      >
        <div className="settings-shell space-y-6">
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
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${mode === "light" ? "border-primary bg-primary/10" : "border-border"}`}
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
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${mode === "dark" ? "border-primary bg-primary/10" : "border-border"}`}
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
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${mode === "system" ? "border-primary bg-primary/10" : "border-border"}`}
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
              setPrimaryWallet={(payload) => setPrimaryWallet(payload).unwrap()}
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
                      onClick={() => void handleMailDisconnect()}
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
                      onClick={() => void handleMailConnect()}
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
      </Layout>
    );
  }

  return (
    <Layout
      title="Settings"
      description="Manage your account preferences, security, and wallet connections"
    >
      <Card className="settings-shell shadow-none">
        <CardContent className="p-0">
          <div className="divide-y">
            {settingsOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div
                  key={option.id}
                  onClick={() => setActiveSection(option.id)}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      {option.title}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {option.description}
                    </p>
                  </div>
                  {option.badge && (
                    <div className="flex-shrink-0">{option.badge}</div>
                  )}
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
