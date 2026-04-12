import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Card, Button, useToast } from "@/components/ui";
import AppHeader from "@/components/ui/AppHeader";
import { spacing, borderRadius } from "@/constants/theme";
import { subscriptionsApi } from "@/api";
import type { SubscriptionPlan } from "@/api/subscriptionsApi";
import { useTheme } from "@/hooks/useTheme";
import { useAppSelector } from "@/store/hooks";
import { paymentsApi } from "@/api/paymentsApi";
import { PaymentWebView } from "@/components/payments";

type GatewayType = "ESEWA" | "KHALTI";

export default function ProfileSubscriptionsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const user = useAppSelector((state) => state.auth.user);
  const styles = createStyles(colors);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showGatewayPicker, setShowGatewayPicker] = useState(false);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [pendingPlan, setPendingPlan] = useState<{
    planCode: string;
    scope: "USER" | "TENANT";
    price: number;
  } | null>(null);
  const [pendingGatewayPayment, setPendingGatewayPayment] = useState<{
    gateway: GatewayType;
    amount: number;
    transactionUuid: string;
    planCode: string;
    scope: "USER" | "TENANT";
  } | null>(null);

  const toneBySubscription = (scope: string, status: string) => {
    const normalizedScope = String(scope || "").toUpperCase();
    const normalizedStatus = String(status || "").toUpperCase();
    const active = normalizedStatus === "ACTIVE";

    if (normalizedScope === "TENANT") {
      return {
        backgroundColor: isDark ? "#281842" : "#F3E8FF",
        borderColor: isDark ? "#7C3AED" : "#A855F7",
        scopeChipBg: isDark ? "#7C3AED" : "#8B5CF6",
        scopeChipText: "#FFFFFF",
        statusChipBg: active
          ? isDark
            ? "#14532D"
            : "#DCFCE7"
          : isDark
            ? "#7F1D1D"
            : "#FEE2E2",
        statusChipText: active
          ? isDark
            ? "#86EFAC"
            : "#166534"
          : isDark
            ? "#FCA5A5"
            : "#B91C1C",
      };
    }

    return {
      backgroundColor: isDark ? "#10263B" : "#E0F2FE",
      borderColor: isDark ? "#2563EB" : "#60A5FA",
      scopeChipBg: isDark ? "#2563EB" : "#1D4ED8",
      scopeChipText: "#FFFFFF",
      statusChipBg: active
        ? isDark
          ? "#14532D"
          : "#DCFCE7"
        : isDark
          ? "#7F1D1D"
          : "#FEE2E2",
      statusChipText: active
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
      const [data, plansData] = await Promise.all([
        subscriptionsApi.listMine().catch(() => []),
        subscriptionsApi.listPlans().catch(() => []),
      ]);
      setSubscriptions(data);
      setPlans(plansData);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const selectSubscription = async (id: string) => {
    try {
      setSelectingId(id);
      await subscriptionsApi.select(id);
      await loadData();
    } finally {
      setSelectingId(null);
    }
  };

  const buyPlan = async (
    planCode: string,
    scope: "USER" | "TENANT",
    price: number,
  ) => {
    const existing = subscriptions.find(
      (sub) =>
        sub.plan === planCode &&
        sub.scope === scope &&
        sub.lifecycleStatus === "BOUGHT",
    );

    if (existing) {
      showToast(
        `You already have an active ${planCode} subscription`,
        "warning",
      );
      return;
    }

    if (scope === "TENANT" && !user?.tenantId) {
      showToast("Tenant account required for this plan", "warning");
      return;
    }

    if (Number(price || 0) > 0) {
      setPendingPlan({ planCode, scope, price: Number(price || 0) });
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

  const startGatewayPayment = async (gateway: GatewayType) => {
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
        const encoded = btoa(
          JSON.stringify({
            paymentUrl: result.paymentUrl,
            formData: result.formData,
          }),
        );
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

    const transactionId = verifyResult.success
      ? verifyResult.transactionId
      : null;

    if (!transactionId) {
      throw new Error("Payment verification failed");
    }

    await subscriptionsApi.purchase({
      planCode: pendingGatewayPayment.planCode,
      scope: pendingGatewayPayment.scope,
      tenantId:
        pendingGatewayPayment.scope === "TENANT" ? user?.tenantId : undefined,
      paymentTransactionId: transactionId,
    });
  };

  const handlePaymentSuccess = async () => {
    try {
      await completeSubscriptionAfterPayment();
      showToast("Subscription activated", "success");
      await loadData();
    } catch (error: any) {
      showToast(error?.message || "Payment verification failed", "error");
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

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.surface }]}
    >
      <AppHeader title="Subscriptions" showThemeToggle={false} />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
          />
        }
      >
        <Card style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            My Subscriptions
          </Text>
          {subscriptions.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No subscriptions yet.
            </Text>
          ) : (
            subscriptions.map((sub) => {
              const tone = toneBySubscription(sub.scope, sub.status);
              const maxTransactions = Number(sub.planRef?.maxTransactions || 0);
              const usedTransactions = Number(sub.usageCount || 0);
              const remainingTransactions =
                maxTransactions > 0
                  ? Math.max(maxTransactions - usedTransactions, 0)
                  : null;
              const lifecycleStatus = sub.lifecycleStatus || "EXPIRED";
              const isExpired = lifecycleStatus === "EXPIRED";
              const isLimitExceeded = lifecycleStatus === "LIMIT_EXCEEDED";
              const isBought = lifecycleStatus === "BOUGHT";

              return (
                <View
                  key={sub.id}
                  style={[
                    styles.item,
                    {
                      borderColor: tone.borderColor,
                      backgroundColor: tone.backgroundColor,
                    },
                  ]}
                >
                  <View style={styles.itemTopRow}>
                    <View
                      style={[
                        styles.scopeChip,
                        { backgroundColor: tone.scopeChipBg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.scopeChipText,
                          { color: tone.scopeChipText },
                        ]}
                      >
                        {sub.scope}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusChip,
                        { backgroundColor: tone.statusChipBg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          { color: tone.statusChipText },
                        ]}
                      >
                        {isBought
                          ? "BOUGHT"
                          : isLimitExceeded
                            ? "LIMIT EXCEEDED"
                            : "EXPIRED"}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.planName, { color: colors.text }]}>
                    {sub.plan}
                  </Text>
                  {sub.isSelected ? (
                    <Text
                      style={[styles.detailText, { color: colors.primary }]}
                    >
                      Selected for transactions
                    </Text>
                  ) : null}

                  <View style={styles.metricsRow}>
                    <View
                      style={[styles.metricBox, { borderColor: colors.border }]}
                    >
                      <Text
                        style={[
                          styles.metricLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Used
                      </Text>
                      <Text
                        style={[styles.metricValue, { color: colors.text }]}
                      >
                        {usedTransactions}
                      </Text>
                    </View>
                    <View
                      style={[styles.metricBox, { borderColor: colors.border }]}
                    >
                      <Text
                        style={[
                          styles.metricLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Remaining
                      </Text>
                      <Text
                        style={[styles.metricValue, { color: colors.text }]}
                      >
                        {remainingTransactions === null
                          ? "Unlimited"
                          : remainingTransactions}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text
                      style={[
                        styles.detailText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Max: {maxTransactions > 0 ? maxTransactions : "Unlimited"}
                    </Text>
                    <Text
                      style={[
                        styles.detailText,
                        {
                          color: isExpired
                            ? colors.error
                            : isLimitExceeded
                              ? "#D97706"
                              : colors.success,
                        },
                      ]}
                    >
                      {isExpired
                        ? "Expired"
                        : isLimitExceeded
                          ? "Limit Exceeded"
                          : sub.endsAt
                            ? `Valid till ${new Date(sub.endsAt).toLocaleDateString()}`
                            : "No expiry"}
                    </Text>
                  </View>
                  {isBought && !sub.isSelected ? (
                    <Button
                      title={
                        selectingId === sub.id
                          ? "Selecting..."
                          : "Use This Subscription"
                      }
                      onPress={() => selectSubscription(sub.id)}
                      style={styles.manageButton}
                    />
                  ) : null}
                </View>
              );
            })
          )}
        </Card>

        <Card style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Available Plans
          </Text>
          {plans
            .filter((plan) => plan.isActive)
            .map((plan) => {
              const maxTx = Number(plan.maxTransactions || 0);
              const boughtSubscription = subscriptions.find(
                (sub) =>
                  sub.plan === plan.code &&
                  sub.scope === plan.scope &&
                  sub.lifecycleStatus === "BOUGHT",
              );
              const isBought = Boolean(boughtSubscription);
              const isSelected = Boolean(boughtSubscription?.isSelected);

              return (
                <View
                  key={plan.id}
                  style={[
                    styles.item,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                    },
                  ]}
                >
                  <View style={styles.itemTopRow}>
                    <Text style={[styles.planName, { color: colors.text }]}>
                      {plan.name}
                    </Text>
                    <Text
                      style={[
                        styles.detailText,
                        { color: isBought ? colors.success : colors.primary },
                      ]}
                    >
                      {isBought ? "Current" : plan.scope}
                    </Text>
                  </View>
                  {plan.description ? (
                    <Text
                      style={[
                        styles.detailText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {plan.description}
                    </Text>
                  ) : null}
                  <Text
                    style={[
                      styles.metricValue,
                      { color: colors.text, marginTop: spacing.xs },
                    ]}
                  >
                    {plan.currency} {Number(plan.price || 0).toFixed(2)} /{" "}
                    {plan.billingCycle}
                  </Text>
                  <Text
                    style={[styles.detailText, { color: colors.textSecondary }]}
                  >
                    Transactions: {maxTx > 0 ? maxTx : "Unlimited"}
                  </Text>
                  {isBought && !isSelected ? (
                    <Button
                      title={
                        selectingId === boughtSubscription?.id
                          ? "Selecting..."
                          : "Use This Subscription"
                      }
                      onPress={() =>
                        boughtSubscription?.id &&
                        selectSubscription(boughtSubscription.id)
                      }
                      style={styles.manageButton}
                    />
                  ) : null}
                  {!isBought ? (
                    <Button
                      title="Buy"
                      onPress={() =>
                        buyPlan(plan.code, plan.scope, Number(plan.price || 0))
                      }
                      style={styles.manageButton}
                    />
                  ) : null}
                </View>
              );
            })}
        </Card>
      </ScrollView>

      <Modal
        visible={showGatewayPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGatewayPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select Payment Gateway
            </Text>
            <View style={styles.gatewayRow}>
              <TouchableOpacity
                style={[styles.gatewayButton, { borderColor: colors.border }]}
                onPress={() => startGatewayPayment("ESEWA")}
                disabled={processingPayment}
              >
                <Text style={[styles.gatewayText, { color: colors.text }]}>
                  eSewa
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.gatewayButton, { borderColor: colors.border }]}
                onPress={() => startGatewayPayment("KHALTI")}
                disabled={processingPayment}
              >
                <Text style={[styles.gatewayText, { color: colors.text }]}>
                  Khalti
                </Text>
              </TouchableOpacity>
            </View>
            {processingPayment ? (
              <View style={styles.processingRow}>
                <ActivityIndicator color={colors.primary} />
                <Text
                  style={[styles.detailText, { color: colors.textSecondary }]}
                >
                  Processing...
                </Text>
              </View>
            ) : null}
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setShowGatewayPicker(false)}
              style={styles.manageButton}
            />
          </View>
        </View>
      </Modal>

      <PaymentWebView
        visible={showPaymentWebView}
        paymentUrl={paymentUrl}
        successUrlPattern="/payment/success"
        failureUrlPattern="/payment/failure"
        onSuccess={() => handlePaymentSuccess()}
        onFailure={() => handlePaymentFailure()}
        onCancel={handlePaymentFailure}
        gateway={pendingGatewayPayment?.gateway || "ESEWA"}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, padding: spacing.md },
    card: { padding: spacing.md },
    sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: spacing.sm },
    emptyText: {
      fontSize: 13,
      lineHeight: 18,
    },
    item: {
      borderWidth: 1,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginTop: spacing.sm,
    },
    itemTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.xs,
    },
    scopeChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
    },
    scopeChipText: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    statusChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
    },
    statusChipText: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    planName: {
      fontSize: 16,
      fontWeight: "800",
    },
    metricsRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    metricBox: {
      flex: 1,
      borderWidth: 1,
      borderRadius: borderRadius.sm,
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    metricLabel: {
      fontSize: 11,
      fontWeight: "600",
    },
    metricValue: {
      fontSize: 16,
      fontWeight: "800",
      marginTop: 2,
    },
    detailRow: {
      marginTop: spacing.xs,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    detailText: {
      fontSize: 12,
      fontWeight: "600",
    },
    manageButton: {
      marginTop: spacing.md,
      backgroundColor: colors.primary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      padding: spacing.md,
    },
    modalCard: {
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      gap: spacing.md,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      textAlign: "center",
    },
    gatewayRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    gatewayButton: {
      flex: 1,
      borderWidth: 1,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      alignItems: "center",
      justifyContent: "center",
    },
    gatewayText: {
      fontSize: 13,
      fontWeight: "700",
    },
    processingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
  });
