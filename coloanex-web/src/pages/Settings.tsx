import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useUpdateUserMutation } from "@/apis/usersApi";
import {
  useGetMailAuthUrlQuery,
  useDisconnectMailMutation,
  useGetMailStatusQuery,
} from "@/apis/mailApi";
import { toast } from "sonner";
import {
  Loader2,
  User,
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

const Settings = () => {
  const { user } = useAuth();
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

  const {
    data: mailStatus,
    isLoading: isLoadingMailStatus,
    refetch: refetchMailStatus,
  } = useGetMailStatusQuery();
  const [disconnectMail, { isLoading: isDisconnecting }] =
    useDisconnectMailMutation();

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
    const params = new URLSearchParams(window.location.search);
    const mailStatus = params.get("mail");

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
