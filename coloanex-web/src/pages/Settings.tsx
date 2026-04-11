import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateUserMutation } from "@/apis/usersApi";
import {
  useDisconnectMailMutation,
  useGetMailStatusQuery,
} from "@/apis/mailApi";
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

const gatewayLogoByType: Record<"ESEWA" | "KHALTI", string> = {
  ESEWA: "/images/esewa-logo.png",
  KHALTI: "/images/khalti-logo.png",
};

const planAccentByCode: Record<
  string,
  { card: string; button: string; chip: string }
> = {
  free: {
    card: "border-emerald-400/40 bg-gradient-to-br from-emerald-500/10 to-transparent",
    button:
      "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500/80",
    chip: "bg-emerald-500/15 text-emerald-300",
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

const Settings = () => {
  const { user, updateUser: updateAuthUser } = useAuth();
  const navigate = useNavigate();
  const { mode, setTheme } = useTheme();
  const [updateUser, { isLoading }] = useUpdateUserMutation();
  const [activeSection, setActiveSection] = useState<string | null>(null);

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
  const hasLimitReached = subscriptionStats.some(
    (subscription) =>
      subscription.remainingTransactions !== null &&
      subscription.remainingTransactions <= 0,
  );

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

  useEffect(() => {
    const currentMode = (user as any)?.gasPaymentMode;
    if (currentMode === "USER_WALLET" || currentMode === "PLATFORM_WALLET") {
      setGasPaymentMode(currentMode);
    }
  }, [user]);

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
      <DashboardLayout title="Settings" description="Manage your settings">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
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
            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
              Connected
            </span>
          ) : (
            <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">
              Not Connected
            </span>
          )
        ) : (
          <span className="text-xs px-2 py-1 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 font-medium">
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
        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">
          Limit Reached
        </span>
      ) : hasActiveSubscription ? (
        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
          Active
        </span>
      ) : (
        <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-medium">
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
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2 py-1">
                  {connectedGatewayTypes.map((gateway) => (
                    <img
                      key={gateway}
                      src={gatewayLogoByType[gateway]}
                      alt={gateway}
                      className="h-4 w-4 rounded-sm object-cover"
                    />
                  ))}
                  <span className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wide">
                    Connected
                  </span>
                </div>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">
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
        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
          Connected
        </span>
      ) : (
        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">
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
      <DashboardLayout
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
                      className="bg-green-600 hover:bg-green-700 text-white"
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
                      className="bg-green-600 hover:bg-green-700 text-white"
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
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                        mode === "light"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          mode === "light" ? "bg-primary" : "bg-muted"
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
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                        mode === "dark"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          mode === "dark" ? "bg-primary" : "bg-muted"
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
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                        mode === "system"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          mode === "system" ? "bg-primary" : "bg-muted"
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
                {wallets.length > 0 ? (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800/40 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-green-900 dark:text-green-100">
                        MetaMask Connected
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300 break-all">
                        {wallets.find((wallet) => wallet.isPrimary)?.address ||
                          wallets[0]?.address}
                      </p>
                    </div>
                    <Button
                      onClick={disconnectMetamask}
                      disabled={isCreatingWallet}
                      size="sm"
                      className="cursor-pointer bg-red-600 hover:bg-red-700 text-white"
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800/40 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                        <X className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-red-900 dark:text-red-100">
                        MetaMask Not Connected
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        You are not connected to any MetaMask wallet.
                      </p>
                    </div>
                    <Button
                      onClick={connectMetamask}
                      disabled={isCreatingWallet}
                      size="sm"
                      className="cursor-pointer bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isCreatingWallet ? "Connecting..." : "Connect"}
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
                      className={`cursor-pointer ${
                        gasPaymentMode === "USER_WALLET"
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                      }`}
                      onClick={() => saveGasMode("USER_WALLET")}
                    >
                      User Wallet
                    </Button>
                    <Button
                      className={`cursor-pointer ${
                        gasPaymentMode === "PLATFORM_WALLET"
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
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
                    <Button
                      variant="outline"
                      onClick={() => refetchWallets()}
                      className="cursor-pointer bg-muted text-foreground hover:bg-muted/80"
                    >
                      Refresh Wallets
                    </Button>
                  </div>
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
                    <div className="grid gap-3 md:grid-cols-2">
                      {subscriptionStats.map((subscription) => (
                        <div
                          key={subscription.id}
                          className="rounded-lg border border-border/70 bg-card p-4"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-sm">
                              {subscription.plan}
                            </p>
                            <Badge
                              variant={
                                subscription.lifecycleStatus === "EXPIRED"
                                  ? "destructive"
                                  : subscription.lifecycleStatus ===
                                      "LIMIT_EXCEEDED"
                                    ? "outline"
                                    : "secondary"
                              }
                            >
                              {subscription.lifecycleStatus === "BOUGHT"
                                ? "Bought"
                                : subscription.lifecycleStatus ===
                                    "LIMIT_EXCEEDED"
                                  ? "Limit Exceeded"
                                  : "Expired"}
                            </Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>Scope: {subscription.scope}</span>
                            <span>Used: {subscription.usedTransactions}</span>
                            <span>
                              Remaining:{" "}
                              {subscription.remainingTransactions === null
                                ? "Unlimited"
                                : subscription.remainingTransactions}
                            </span>
                            <span>
                              Max:{" "}
                              {subscription.maxTransactions > 0
                                ? subscription.maxTransactions
                                : "Unlimited"}
                            </span>
                          </div>

                          <p
                            className={`text-xs mt-1 ${
                              subscription.lifecycleStatus === "EXPIRED"
                                ? "text-red-500"
                                : subscription.lifecycleStatus ===
                                    "LIMIT_EXCEEDED"
                                  ? "text-amber-500"
                                  : "text-emerald-500"
                            }`}
                          >
                            {subscription.endsAt
                              ? `Valid till ${new Date(subscription.endsAt).toLocaleDateString()}`
                              : "No expiry date"}
                          </p>
                          {subscription.isBought && (
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
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
                    <Button
                      variant="outline"
                      onClick={() => refetchConfigs()}
                      className="border-sky-500/60 text-sky-300 hover:bg-sky-500/10"
                    >
                      Refresh
                    </Button>
                    {!showAddPaymentConfig ? (
                      <Button
                        onClick={() => setShowAddPaymentConfig(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
                  <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300 mb-2">
                      Connected Gateways
                    </p>
                    <div className="flex items-center gap-2">
                      {connectedGatewayTypes.map((gateway) => (
                        <div
                          key={gateway}
                          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 px-2 py-1"
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
                  <div className="rounded-lg border bg-card p-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>
                          Scope <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={configScope}
                          onValueChange={(value) =>
                            setConfigScope(value as "USER" | "TENANT")
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select scope" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USER">User</SelectItem>
                            <SelectItem value="TENANT">Tenant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Gateway <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={configGateway}
                          onValueChange={(value) =>
                            setConfigGateway(value as "ESEWA" | "KHALTI")
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gateway" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ESEWA">
                              <div className="flex items-center gap-2">
                                <img
                                  src={gatewayLogoByType.ESEWA}
                                  alt="eSewa"
                                  className="h-4 w-4 rounded-sm object-cover"
                                />
                                <span>eSewa</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="KHALTI">
                              <div className="flex items-center gap-2">
                                <img
                                  src={gatewayLogoByType.KHALTI}
                                  alt="Khalti"
                                  className="h-4 w-4 rounded-sm object-cover"
                                />
                                <span>Khalti</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Environment <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={configEnvironment}
                          onValueChange={(value) =>
                            setConfigEnvironment(
                              value as "sandbox" | "production",
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select environment" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sandbox">Sandbox</SelectItem>
                            <SelectItem value="production">
                              Production
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {configGateway === "ESEWA" ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>
                            Merchant ID <span className="text-red-500">*</span>
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
                            Public Key <span className="text-red-500">*</span>
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
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
                          className="bg-red-600 hover:bg-red-700 text-white"
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
                      <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
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
                      className="cursor-pointer bg-red-600 hover:bg-red-700 text-white"
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
                      <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
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
                      className="cursor-pointer bg-green-600 hover:bg-green-700 text-white"
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
                      className="data-[state=checked]:bg-green-600"
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
                      className="data-[state=checked]:bg-green-600"
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
                      className="data-[state=checked]:bg-green-600"
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
                      className="data-[state=checked]:bg-green-600"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Settings"
      description="Manage your account settings and preferences"
    >
      <Card>
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
    </DashboardLayout>
  );
};

export default Settings;
