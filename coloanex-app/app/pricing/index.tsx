import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Buffer } from "buffer";
import { spacing, borderRadius } from "@/constants/theme";
import { subscriptionsApi } from "@/api";
import { paymentsApi } from "@/api/paymentsApi";
import { PaymentWebView } from "@/components/payments";
import AppHeader from "@/components/ui/AppHeader";
import { useTheme } from "@/hooks/useTheme";
import { useAppSelector } from "@/store/hooks";
import { useToast } from "@/components/ui";

type GatewayType = "ESEWA" | "KHALTI";

export default function PricingScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const styles = createStyles(colors);
  const user = useAppSelector((state) => state.auth.user);

  const [plans, setPlans] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showGatewayPicker, setShowGatewayPicker] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<{
    planCode: string;
    scope: "USER" | "TENANT";
    price: number;
  } | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [pendingGatewayPayment, setPendingGatewayPayment] = useState<{
    gateway: GatewayType;
    amount: number;
    transactionUuid: string;
    planCode: string;
    scope: "USER" | "TENANT";
  } | null>(null);

  const activeUserPlan =
    subscriptions.find(
      (s) => s.scope === "USER" && s.lifecycleStatus === "BOUGHT",
    )?.plan || null;
  const activeTenantPlan =
    subscriptions.find(
      (s) => s.scope === "TENANT" && s.lifecycleStatus === "BOUGHT",
    )?.plan || null;

  const statusByPlanScope = subscriptions.reduce(
    (acc, sub) => {
      const key = `${sub.scope}:${sub.plan}`;
      const status = sub.lifecycleStatus || "EXPIRED";
      if (!acc[key] || acc[key] !== "BOUGHT") {
        acc[key] = status;
      }
      if (status === "BOUGHT") {
        acc[key] = "BOUGHT";
      }
      return acc;
    },
    {} as Record<string, "BOUGHT" | "EXPIRED" | "LIMIT_EXCEEDED">,
  );

  const paletteByPlan = (code: string) => {
    const normalized = String(code || "").toLowerCase();
    if (normalized === "free") {
      return isDark
        ? { bg: "#113126", fg: "#6EE7B7", cta: "#16A34A", soft: "#0F2A22" }
        : { bg: "#ECFDF3", fg: "#15803D", cta: "#16A34A", soft: "#D1FAE5" };
    }
    if (normalized === "premium") {
      return isDark
        ? { bg: "#11243D", fg: "#93C5FD", cta: "#2563EB", soft: "#0D1E34" }
        : { bg: "#EFF6FF", fg: "#1D4ED8", cta: "#2563EB", soft: "#DBEAFE" };
    }
    if (normalized === "pro") {
      return isDark
        ? { bg: "#3D2A10", fg: "#FCD34D", cta: "#D97706", soft: "#33230D" }
        : { bg: "#FEF3C7", fg: "#B45309", cta: "#D97706", soft: "#FDE68A" };
    }
    if (normalized === "enterprise") {
      return isDark
        ? { bg: "#24173C", fg: "#C4B5FD", cta: "#7C3AED", soft: "#1F1433" }
        : { bg: "#F5F3FF", fg: "#7C3AED", cta: "#8B5CF6", soft: "#EDE9FE" };
    }
    return { bg: colors.surface, fg: colors.text, cta: colors.primary };
  };

  const subscriptionTone = (scope: string, status: string) => {
    const normalizedScope = String(scope || "").toUpperCase();
    const normalizedStatus = String(status || "").toUpperCase();
    const statusGreen = normalizedStatus === "ACTIVE";

    if (normalizedScope === "TENANT") {
      return {
        bg: isDark ? "#22173A" : "#F3E8FF",
        border: isDark ? "#4C1D95" : "#C084FC",
        chipBg: isDark ? "#4C1D95" : "#8B5CF6",
        chipText: "#FFFFFF",
        statusBg: statusGreen
          ? isDark
            ? "#14532D"
            : "#DCFCE7"
          : isDark
            ? "#7F1D1D"
            : "#FEE2E2",
        statusText: statusGreen
          ? isDark
            ? "#86EFAC"
            : "#166534"
          : isDark
            ? "#FCA5A5"
            : "#B91C1C",
      };
    }

    return {
      bg: isDark ? "#102337" : "#E0F2FE",
      border: isDark ? "#1D4ED8" : "#60A5FA",
      chipBg: isDark ? "#1D4ED8" : "#2563EB",
      chipText: "#FFFFFF",
      statusBg: statusGreen
        ? isDark
          ? "#14532D"
          : "#DCFCE7"
        : isDark
          ? "#7F1D1D"
          : "#FEE2E2",
      statusText: statusGreen
        ? isDark
          ? "#86EFAC"
          : "#166534"
        : isDark
          ? "#FCA5A5"
          : "#B91C1C",
    };
  };

  const loadData = useCallback(async () => {
    try {
      const [planData, subData] = await Promise.all([
        subscriptionsApi.listPlans().catch(() => []),
        subscriptionsApi.listMine().catch(() => []),
      ]);
      setPlans(planData);
      setSubscriptions(subData);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const buyPlan = async (
    planCode: string,
    scope: "USER" | "TENANT",
    price: number,
  ) => {
    const existingStatus = statusByPlanScope[`${scope}:${planCode}`];
    if (existingStatus === "BOUGHT") {
      showToast(
        `You already have an active ${planCode} subscription`,
        "warning",
      );
      return;
    }

    if (scope === "TENANT" && !user?.tenantId) {
      showToast("Tenant required to purchase this plan", "warning");
      return;
    }

    if (price > 0) {
      setPendingPlan({
        planCode,
        scope,
        price: Number(price || 0),
      });
      setShowGatewayPicker(true);
      return;
    }

    try {
      await subscriptionsApi.purchase({
        planCode,
        scope,
        tenantId: scope === "TENANT" ? user?.tenantId : undefined,
      });
      showToast("Subscription activated", "success");
      await loadData();
    } catch (error: any) {
      showToast(
        error?.response?.data?.message || "Unable to purchase plan",
        "error",
      );
    }
  };

  const startNativeGatewayPayment = async (gateway: GatewayType) => {
    if (!pendingPlan) return;
    setProcessingPayment(true);

    try {
      const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
      const apiUrl = `${apiBase}/api`;

      const successUrl =
        Platform.OS === "web"
          ? `${window.location.origin}/payment/callback?gateway=${gateway}`
          : "https://coloanex-intercept.app/payment/success";
      const failureUrl =
        Platform.OS === "web"
          ? `${window.location.origin}/payment/callback?gateway=${gateway}`
          : "https://coloanex-intercept.app/payment/failure";

      const result = await paymentsApi.initiatePayment({
        amount: pendingPlan.price,
        type: "FEE",
        gateway,
        gasPaymentMode: "PLATFORM_WALLET",
        successUrl,
        failureUrl,
        platform: "APP",
      });

      let finalPaymentUrl = result.paymentUrl;
      if (gateway === "ESEWA" && result.formData) {
        const encoded = Buffer.from(
          JSON.stringify({
            paymentUrl: result.paymentUrl,
            formData: result.formData,
          }),
        ).toString("base64");
        finalPaymentUrl = `${apiUrl}/payments/esewa-form?data=${encoded}`;
      }

      setPendingGatewayPayment({
        gateway,
        amount: pendingPlan.price,
        transactionUuid:
          gateway === "KHALTI"
            ? (result.formData?.pidx ?? result.transactionUuid)
            : result.transactionUuid,
        planCode: pendingPlan.planCode,
        scope: pendingPlan.scope,
      });

      if (Platform.OS === "web") {
        sessionStorage.setItem(
          "app_pending_payment",
          JSON.stringify({
            type: "SUBSCRIPTION_PAYMENT",
            gateway,
            amount: pendingPlan.price,
            transactionUuid:
              gateway === "KHALTI"
                ? (result.formData?.pidx ?? result.transactionUuid)
                : result.transactionUuid,
            planCode: pendingPlan.planCode,
            scope: pendingPlan.scope,
            tenantId:
              pendingPlan.scope === "TENANT" ? user?.tenantId : undefined,
          }),
        );
      }

      setShowGatewayPicker(false);
      setPaymentUrl(finalPaymentUrl);
      setShowPaymentWebView(true);
    } catch (error: any) {
      showToast(
        error?.response?.data?.message || "Unable to initiate payment",
        "error",
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const completeSubscriptionAfterPayment = async () => {
    if (!pendingGatewayPayment) return;

    const verifyResult = await paymentsApi.verifyPayment({
      transactionUuid: pendingGatewayPayment.transactionUuid,
      totalAmount: pendingGatewayPayment.amount,
      gateway: pendingGatewayPayment.gateway,
      type: "FEE",
      gasPaymentMode: "PLATFORM_WALLET",
      platform: "APP",
    });

    if (!verifyResult.success || !verifyResult.transactionId) {
      const lookup = await paymentsApi.lookupPayment({
        transactionUuid: pendingGatewayPayment.transactionUuid,
        totalAmount: pendingGatewayPayment.amount,
        gateway: pendingGatewayPayment.gateway,
      });
      if (lookup.status !== "COMPLETED" || !lookup.transactionId) {
        throw new Error("Payment not completed");
      }
      await subscriptionsApi.purchase({
        planCode: pendingGatewayPayment.planCode,
        scope: pendingGatewayPayment.scope,
        tenantId:
          pendingGatewayPayment.scope === "TENANT" ? user?.tenantId : undefined,
        paymentTransactionId: lookup.transactionId,
      });
      return;
    }

    await subscriptionsApi.purchase({
      planCode: pendingGatewayPayment.planCode,
      scope: pendingGatewayPayment.scope,
      tenantId:
        pendingGatewayPayment.scope === "TENANT" ? user?.tenantId : undefined,
      paymentTransactionId: verifyResult.transactionId,
    });
  };

  const handlePaymentSuccess = async () => {
    try {
      await completeSubscriptionAfterPayment();
      showToast("Subscription activated", "success");
      await loadData();
    } catch (error: any) {
      showToast(
        error?.response?.data?.message ||
          error?.message ||
          "Payment verification failed",
        "error",
      );
    } finally {
      setShowPaymentWebView(false);
      setPendingGatewayPayment(null);
      setPendingPlan(null);
      setPaymentUrl("");
    }
  };

  const handlePaymentFailure = () => {
    showToast("Payment failed or cancelled", "error");
    setShowPaymentWebView(false);
    setPendingGatewayPayment(null);
    setPendingPlan(null);
    setPaymentUrl("");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title="Pricing" showThemeToggle={false} />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Available Plans
          </Text>
          {plans
            .filter((plan) => plan.isActive)
            .map((plan) => (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  {
                    borderColor: colors.border,
                    backgroundColor: paletteByPlan(plan.code).bg,
                  },
                ]}
              >
                {(activeUserPlan === plan.code ||
                  activeTenantPlan === plan.code) && (
                  <View
                    style={[
                      styles.currentBadge,
                      { backgroundColor: paletteByPlan(plan.code).fg + "20" },
                    ]}
                  >
                    <Text
                      style={{
                        color: paletteByPlan(plan.code).fg,
                        fontSize: 11,
                        fontWeight: "700",
                      }}
                    >
                      Current
                    </Text>
                  </View>
                )}
                {statusByPlanScope[`${plan.scope}:${plan.code}`] &&
                  statusByPlanScope[`${plan.scope}:${plan.code}`] !==
                    "BOUGHT" && (
                    <View
                      style={[
                        styles.currentBadge,
                        {
                          top: 34,
                          backgroundColor:
                            statusByPlanScope[`${plan.scope}:${plan.code}`] ===
                            "LIMIT_EXCEEDED"
                              ? "#F59E0B33"
                              : "#EF444433",
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color:
                            statusByPlanScope[`${plan.scope}:${plan.code}`] ===
                            "LIMIT_EXCEEDED"
                              ? "#F59E0B"
                              : "#EF4444",
                          fontSize: 11,
                          fontWeight: "700",
                        }}
                      >
                        {statusByPlanScope[`${plan.scope}:${plan.code}`] ===
                        "LIMIT_EXCEEDED"
                          ? "Limit Exceeded"
                          : "Expired"}
                      </Text>
                    </View>
                  )}
                <Text style={{ color: colors.text, fontWeight: "700" }}>
                  {plan.name}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {plan.description || "No description"}
                </Text>
                <Text
                  style={{
                    color: paletteByPlan(plan.code).fg,
                    fontWeight: "800",
                    fontSize: 18,
                  }}
                >
                  {plan.currency} {Number(plan.price || 0).toLocaleString()} /
                  {String(plan.billingCycle || "MONTHLY").toLowerCase()}
                </Text>
                <View style={styles.row}>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      {
                        backgroundColor: paletteByPlan(plan.code).cta,
                        opacity:
                          activeUserPlan === plan.code ||
                          activeTenantPlan === plan.code
                            ? 0.45
                            : 1,
                      },
                    ]}
                    disabled={
                      activeUserPlan === plan.code ||
                      activeTenantPlan === plan.code
                    }
                    onPress={() =>
                      buyPlan(plan.code, plan.scope, Number(plan.price || 0))
                    }
                  >
                    <Text style={styles.buttonText}>
                      {activeUserPlan === plan.code ||
                      activeTenantPlan === plan.code
                        ? "Already Bought"
                        : Number(plan.price || 0) > 0
                          ? "Buy Now"
                          : "Activate"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            My Subscriptions
          </Text>
          {subscriptions.length === 0 && (
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              No subscription yet.
            </Text>
          )}
          {subscriptions.map((sub) =>
            (() => {
              const tone = subscriptionTone(sub.scope, sub.status);
              return (
                <View
                  key={sub.id}
                  style={[
                    styles.subscriptionRow,
                    {
                      borderColor: tone.border,
                      backgroundColor: tone.bg,
                    },
                  ]}
                >
                  <View style={styles.subscriptionTopRow}>
                    <View
                      style={[
                        styles.scopeChip,
                        { backgroundColor: tone.chipBg },
                      ]}
                    >
                      <Text
                        style={[styles.scopeChipText, { color: tone.chipText }]}
                      >
                        {sub.scope}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusChip,
                        { backgroundColor: tone.statusBg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          { color: tone.statusText },
                        ]}
                      >
                        {sub.status}
                        {sub.lifecycleStatus && sub.lifecycleStatus !== "BOUGHT"
                          ? ` • ${sub.lifecycleStatus === "LIMIT_EXCEEDED" ? "Limit Exceeded" : "Expired"}`
                          : ""}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.subscriptionPlanName,
                      { color: colors.text },
                    ]}
                  >
                    {sub.plan}
                  </Text>
                </View>
              );
            })(),
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showGatewayPicker}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!processingPayment) {
            setShowGatewayPicker(false);
            setPendingPlan(null);
          }
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Choose Payment Gateway
            </Text>
            <Text
              style={[styles.modalSubtitle, { color: colors.textSecondary }]}
            >
              Select eSewa or Khalti to complete your subscription purchase.
            </Text>

            <View style={styles.gatewayPickerRow}>
              <TouchableOpacity
                style={[
                  styles.gatewayPickerButton,
                  { borderColor: colors.border },
                ]}
                onPress={() => startNativeGatewayPayment("ESEWA")}
                disabled={processingPayment}
              >
                <Image
                  source={require("../../assets/images/esewa-logo.png")}
                  style={styles.gatewayPickerImage}
                />
                <Text
                  style={[styles.gatewayPickerText, { color: colors.text }]}
                >
                  eSewa
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.gatewayPickerButton,
                  { borderColor: colors.border },
                ]}
                onPress={() => startNativeGatewayPayment("KHALTI")}
                disabled={processingPayment}
              >
                <Image
                  source={require("../../assets/images/khalti-logo.png")}
                  style={styles.gatewayPickerImage}
                />
                <Text
                  style={[styles.gatewayPickerText, { color: colors.text }]}
                >
                  Khalti
                </Text>
              </TouchableOpacity>
            </View>

            {processingPayment && (
              <View style={styles.processingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text
                  style={[
                    styles.processingText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Preparing secure payment...
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={() => {
                if (!processingPayment) {
                  setShowGatewayPicker(false);
                  setPendingPlan(null);
                }
              }}
              disabled={processingPayment}
            >
              <Text style={[styles.cancelBtnText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <PaymentWebView
        visible={showPaymentWebView}
        paymentUrl={paymentUrl}
        successUrlPattern="payment/success"
        failureUrlPattern="payment/failure"
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
        onCancel={handlePaymentFailure}
        gateway={pendingGatewayPayment?.gateway || "KHALTI"}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1 },
    sectionCard: {
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: spacing.sm,
    },
    planCard: {
      borderWidth: 1,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      gap: 4,
      marginTop: spacing.xs,
      position: "relative",
    },
    currentBadge: {
      position: "absolute",
      top: 8,
      right: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    row: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    button: {
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    buttonText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
    },
    subscriptionRow: {
      borderWidth: 1,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      marginTop: spacing.xs,
    },
    subscriptionTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    scopeChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    scopeChipText: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    statusChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    statusChipText: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    subscriptionPlanName: {
      fontSize: 16,
      fontWeight: "800",
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      paddingHorizontal: spacing.md,
    },
    modalCard: {
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "800",
    },
    modalSubtitle: {
      fontSize: 13,
      lineHeight: 18,
      marginBottom: spacing.xs,
    },
    gatewayPickerRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    gatewayPickerButton: {
      flex: 1,
      borderWidth: 1,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    gatewayPickerImage: {
      width: 40,
      height: 40,
      resizeMode: "contain",
    },
    gatewayPickerText: {
      fontSize: 13,
      fontWeight: "700",
    },
    processingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 4,
    },
    processingText: {
      fontSize: 12,
      fontWeight: "500",
    },
    cancelBtn: {
      marginTop: spacing.xs,
      borderWidth: 1,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm,
      alignItems: "center",
    },
    cancelBtnText: {
      fontSize: 13,
      fontWeight: "700",
    },
  });
