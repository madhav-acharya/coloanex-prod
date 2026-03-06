import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { spacing, typography, borderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { loansApi, walletsApi, paymentsApi } from "@/api";
import { useToast } from "@/components/ui";
import type { Loan } from "@/types";
import type { Wallet } from "@/api/walletsApi";
import type { PaymentGateway } from "@/api/paymentsApi";
import { formatCurrency } from "@/utils/currency";

const APP_SCHEME = "coloanexapp";
const SUCCESS_URL = `${APP_SCHEME}://payment/success`;
const FAILURE_URL = `${APP_SCHEME}://payment/failure`;

type GatewayOption = {
  id: PaymentGateway;
  name: string;
  tagline: string;
  bg: string;
  accent: string;
  icon: string;
};

const GATEWAYS: GatewayOption[] = [
  {
    id: "ESEWA",
    name: "eSewa",
    tagline: "Nepal's #1 digital wallet",
    bg: "#60BB46",
    accent: "#FFFFFF",
    icon: "e",
  },
  {
    id: "KHALTI",
    name: "Khalti",
    tagline: "Fast & secure payments",
    bg: "#5C2D91",
    accent: "#FFFFFF",
    icon: "k",
  },
];

export default function MakeRepaymentScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const params = useLocalSearchParams<{
    loanId: string;
    contractId: string;
    scheduleId: string;
    amount: string;
    gateway?: string;
  }>();
  const { showToast } = useToast();

  const [loan, setLoan] = useState<Loan | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(
    (params.gateway as PaymentGateway) ?? null,
  );
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const amount = parseFloat(params.amount ?? "0");

  const loadData = useCallback(async () => {
    try {
      const [loanData, walletData] = await Promise.all([
        loansApi.getById(params.loanId),
        walletsApi.getMyWallet(),
      ]);
      setLoan(loanData);
      setWallet(walletData);
    } catch {
      showToast("Failed to load payment details. Please try again.", "error");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [params.loanId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePay = async () => {
    if (!selectedGateway) {
      showToast("Please select a payment method to continue.", "warning");
      return;
    }
    if (!wallet) {
      showToast("Could not find your wallet. Please try again.", "error");
      return;
    }
    if (amount <= 0) {
      showToast("Payment amount is invalid.", "error");
      return;
    }

    setPaying(true);
    try {
      const result = await paymentsApi.initiatePayment({
        walletId: wallet.id,
        contractId: params.contractId || undefined,
        paymentScheduleId: params.scheduleId || undefined,
        amount,
        type: "INSTALLMENT_PAYMENT",
        gateway: selectedGateway,
        successUrl: SUCCESS_URL,
        failureUrl: FAILURE_URL,
      });

      let paymentUrl = result.paymentUrl;

      if (
        selectedGateway === "ESEWA" &&
        result.formData &&
        Object.keys(result.formData).length > 0
      ) {
        const queryString = Object.entries(result.formData)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join("&");
        paymentUrl = `${result.paymentUrl}?${queryString}`;
      }

      const browserResult = await WebBrowser.openAuthSessionAsync(
        paymentUrl,
        APP_SCHEME,
      );

      if (browserResult.type === "success") {
        const url = browserResult.url ?? "";
        if (url.includes("success")) {
          showToast("Payment processed successfully!", "success");
          router.back();
        } else {
          showToast("Payment was not completed. Please try again.", "error");
        }
      } else if (browserResult.type === "cancel") {
        showToast("Payment was cancelled.", "warning");
      }
    } catch {
      showToast(
        "An error occurred while processing your payment. Please try again.",
        "error",
      );
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!loan) return null;

  const lenderName = loan.borrower?.tenant?.name ?? "Lender";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.text }]}>
          Make Payment
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <View style={styles.summaryTop}>
            <View
              style={[
                styles.lenderAvatar,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Text style={[styles.lenderInitial, { color: colors.primary }]}>
                {lenderName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.summaryInfo}>
              <Text style={[styles.summaryLender, { color: colors.text }]}>
                {lenderName}
              </Text>
              <Text
                style={[styles.summaryPurpose, { color: colors.textSecondary }]}
              >
                {loan.purpose}
              </Text>
            </View>
          </View>

          <View
            style={[styles.summaryDivider, { backgroundColor: colors.border }]}
          />

          <View style={styles.amountSection}>
            <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
              Payment Amount
            </Text>
            <Text style={[styles.amountValue, { color: colors.primary }]}>
              {formatCurrency(amount)}
            </Text>
            {params.scheduleId ? (
              <View
                style={[
                  styles.installmentTag,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={13}
                  color={colors.primary}
                />
                <Text
                  style={[styles.installmentTagText, { color: colors.primary }]}
                >
                  Scheduled Installment
                </Text>
              </View>
            ) : null}
          </View>

          {wallet && (
            <View
              style={[
                styles.walletRow,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.walletLeft}>
                <Ionicons
                  name="wallet-outline"
                  size={18}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.walletLabel, { color: colors.textSecondary }]}
                >
                  Wallet Balance
                </Text>
              </View>
              <Text
                style={[
                  styles.walletBalance,
                  {
                    color:
                      wallet.balance >= amount ? colors.success : colors.error,
                  },
                ]}
              >
                {formatCurrency(wallet.balance)}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Select Payment Method
        </Text>

        <View style={styles.gatewayGrid}>
          {GATEWAYS.map((gateway) => {
            const isSelected = selectedGateway === gateway.id;
            return (
              <TouchableOpacity
                key={gateway.id}
                style={[
                  styles.gatewayCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedGateway(gateway.id)}
              >
                <View
                  style={[
                    styles.gatewayIconWrap,
                    { backgroundColor: gateway.bg },
                  ]}
                >
                  <Text
                    style={[styles.gatewayIconText, { color: gateway.accent }]}
                  >
                    {gateway.icon.toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.gatewayName, { color: colors.text }]}>
                  {gateway.name}
                </Text>
                <Text
                  style={[
                    styles.gatewayTagline,
                    { color: colors.textSecondary },
                  ]}
                >
                  {gateway.tagline}
                </Text>
                {isSelected && (
                  <View
                    style={[
                      styles.gatewayCheckmark,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Ionicons
                      name="checkmark"
                      size={12}
                      color={colors.buttonText}
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={18}
            color={colors.primary}
          />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Your payment is secured with 256-bit SSL encryption.
          </Text>
        </View>

        <View style={{ height: spacing.sm }} />
      </ScrollView>

      <View
        style={[
          styles.stickyFooter,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.payBtn,
            {
              backgroundColor: selectedGateway ? colors.primary : colors.border,
              opacity: paying ? 0.7 : 1,
            },
          ]}
          activeOpacity={0.85}
          onPress={handlePay}
          disabled={!selectedGateway || paying}
        >
          {paying ? (
            <ActivityIndicator size="small" color={colors.buttonText} />
          ) : (
            <>
              <Ionicons
                name="card-outline"
                size={20}
                color={
                  selectedGateway ? colors.buttonText : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.payBtnText,
                  {
                    color: selectedGateway
                      ? colors.buttonText
                      : colors.textSecondary,
                  },
                ]}
              >
                {selectedGateway
                  ? `Pay with ${GATEWAYS.find((g) => g.id === selectedGateway)?.name}`
                  : "Select a Payment Method"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
    },
    backBtn: { padding: 6, borderRadius: borderRadius.sm },
    topBarTitle: { ...typography.h3, fontWeight: "700" },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
    summaryCard: {
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 6,
      elevation: 3,
    },
    summaryTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    lenderAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    lenderInitial: { fontSize: 20, fontWeight: "700" },
    summaryInfo: { flex: 1 },
    summaryLender: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
    summaryPurpose: { fontSize: 12, fontWeight: "500" },
    summaryDivider: { height: 1, marginBottom: spacing.md },
    amountSection: { alignItems: "center", paddingVertical: spacing.md },
    amountLabel: {
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    amountValue: { fontSize: 38, fontWeight: "800", marginBottom: spacing.sm },
    installmentTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
    },
    installmentTagText: { fontSize: 11, fontWeight: "600" },
    walletRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: spacing.md,
      padding: spacing.sm,
      borderRadius: borderRadius.md,
      borderWidth: 1,
    },
    walletLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
    walletLabel: { fontSize: 13, fontWeight: "500" },
    walletBalance: { fontSize: 14, fontWeight: "700" },
    sectionLabel: {
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: spacing.sm,
    },
    gatewayGrid: {
      flexDirection: "row",
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    gatewayCard: {
      flex: 1,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      alignItems: "center",
      gap: 8,
      position: "relative",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    gatewayIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
    },
    gatewayIconText: { fontSize: 22, fontWeight: "900" },
    gatewayName: { fontSize: 15, fontWeight: "700" },
    gatewayTagline: { fontSize: 11, fontWeight: "500", textAlign: "center" },
    gatewayCheckmark: {
      position: "absolute",
      top: -6,
      right: -6,
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
    },
    infoCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderWidth: 1,
      marginBottom: spacing.lg,
    },
    infoText: { flex: 1, fontSize: 12, fontWeight: "500", lineHeight: 18 },
    payBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingVertical: 16,
      borderRadius: borderRadius.lg,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    payBtnText: { fontSize: 16, fontWeight: "700" },
    stickyFooter: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
      borderTopWidth: 1,
    },
  });
