import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import AppHeader from "@/components/ui/AppHeader";
import * as WebBrowser from "expo-web-browser";
import { spacing, typography, borderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { loansApi, walletsApi, paymentsApi, contractsApi } from "@/api";
import { useToast } from "@/components/ui";
import type { Loan } from "@/types";
import type { Wallet } from "@/api/walletsApi";
import type { Contract } from "@/api/contractsApi";
import type { PaymentGateway } from "@/api/paymentsApi";
import { formatCurrency } from "@/utils/currency";

const SUCCESS_URL = "http://localhost:8081/payment/success";
const FAILURE_URL = "http://localhost:8081/payment/failure";

type GatewayOption = {
  id: PaymentGateway;
  name: string;
};

const GATEWAYS: GatewayOption[] = [
  {
    id: "ESEWA",
    name: "eSewa",
  },
  {
    id: "KHALTI",
    name: "Khalti",
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
    outstandingBalance?: string;
    gateway?: string;
  }>();
  const { showToast } = useToast();

  const [loan, setLoan] = useState<Loan | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(
    (params.gateway as PaymentGateway) ?? null,
  );
  const [paymentMode, setPaymentMode] = useState<"installment" | "full">(
    "installment",
  );
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const installmentAmount = parseFloat(params.amount ?? "0");
  const outstandingBalance = contract
    ? Number(contract.outstandingBalance) ||
      Number(contract.totalAmountDue) - Number(contract.totalAmountPaid)
    : parseFloat(params.outstandingBalance ?? "0");
  const amount =
    paymentMode === "full" && outstandingBalance > 0
      ? outstandingBalance
      : installmentAmount;

  const loadData = useCallback(async () => {
    try {
      const [loanData, walletData, contractData] = await Promise.all([
        loansApi.getById(params.loanId),
        walletsApi.getMyWallet(),
        params.contractId
          ? contractsApi.getById(params.contractId)
          : Promise.resolve(null),
      ]);
      setLoan(loanData);
      setWallet(walletData);
      setContract(contractData);
    } catch {
      showToast("Failed to load payment details. Please try again.", "error");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [params.loanId, params.contractId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePay = async () => {
    if (!selectedGateway) {
      showToast("Please select a payment method to continue.", "warning");
      return;
    }
    if (amount <= 0) {
      showToast("Payment amount is invalid.", "error");
      return;
    }

    setPaying(true);
    try {
      const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
      const resolvedSuccessUrl =
        selectedGateway === "KHALTI"
          ? `${apiBase}/payments/khalti/success?target=${encodeURIComponent(SUCCESS_URL)}`
          : `${apiBase}/payments/esewa/success?target=${encodeURIComponent(SUCCESS_URL)}`;
      const resolvedFailureUrl =
        selectedGateway === "KHALTI"
          ? `${apiBase}/payments/khalti/failure?target=${encodeURIComponent(FAILURE_URL)}`
          : `${apiBase}/payments/esewa/failure?target=${encodeURIComponent(FAILURE_URL)}`;

      const result = await paymentsApi.initiatePayment({
        walletId: wallet?.id,
        contractId: params.contractId || undefined,
        paymentScheduleId:
          paymentMode === "installment"
            ? params.scheduleId || undefined
            : undefined,
        amount,
        type: "INSTALLMENT_PAYMENT",
        gateway: selectedGateway,
        successUrl: resolvedSuccessUrl,
        failureUrl: resolvedFailureUrl,
      });

      let paymentUrl = result.paymentUrl;

      if (
        selectedGateway === "ESEWA" &&
        result.formData &&
        Object.keys(result.formData).length > 0
      ) {
        const encoded = btoa(
          unescape(
            encodeURIComponent(
              JSON.stringify({
                paymentUrl: result.paymentUrl,
                formData: result.formData,
              }),
            ),
          ),
        );
        paymentUrl = `${process.env.EXPO_PUBLIC_API_BASE_URL}/payments/esewa-form?data=${encoded}`;
      }

      const browserResult = await WebBrowser.openAuthSessionAsync(
        paymentUrl,
        "http://localhost:8081",
      );

      if (browserResult.type === "success") {
        const url = browserResult.url ?? "";
        if (url.includes("success")) {
          const verifyUuid =
            selectedGateway === "KHALTI"
              ? (result.formData?.pidx ?? result.transactionUuid)
              : result.transactionUuid;
          const verifyResult = await paymentsApi.verifyPayment({
            transactionUuid: verifyUuid,
            totalAmount: amount,
            gateway: selectedGateway,
            walletId: result.walletId ?? wallet?.id ?? "",
            type: "INSTALLMENT_PAYMENT",
            contractId: params.contractId || undefined,
            paymentScheduleId:
              paymentMode === "installment"
                ? params.scheduleId || undefined
                : undefined,
          });
          if (verifyResult.success) {
            router.replace({
              pathname: "/payment/success",
              params: {
                amount: String(amount),
                gateway: selectedGateway,
              },
            });
          } else {
            router.replace({
              pathname: "/payment/failure",
              params: {
                amount: String(amount),
                gateway: selectedGateway,
              },
            });
          }
        } else {
          router.replace({
            pathname: "/payment/failure",
            params: {
              amount: String(amount),
              gateway: selectedGateway,
            },
          });
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
      <AppHeader title="Make Payment" showThemeToggle={false} />

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

          <Text
            style={[
              styles.sectionLabel,
              { color: colors.textSecondary, marginBottom: spacing.sm },
            ]}
          >
            Payment Type
          </Text>

          <View style={styles.paymentModeRow}>
            <TouchableOpacity
              style={[
                styles.modeCard,
                {
                  backgroundColor:
                    paymentMode === "installment"
                      ? colors.primaryLight
                      : colors.surface,
                  borderColor:
                    paymentMode === "installment"
                      ? colors.primary
                      : colors.border,
                  borderWidth: paymentMode === "installment" ? 2 : 1,
                },
              ]}
              activeOpacity={0.8}
              onPress={() => setPaymentMode("installment")}
            >
              <Ionicons
                name="calendar-outline"
                size={22}
                color={
                  paymentMode === "installment"
                    ? colors.primary
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.modePrimary,
                  {
                    color:
                      paymentMode === "installment"
                        ? colors.primary
                        : colors.text,
                  },
                ]}
              >
                Current Installment
              </Text>
              <Text
                style={[styles.modeAmount, { color: colors.textSecondary }]}
              >
                {formatCurrency(installmentAmount)}
              </Text>
            </TouchableOpacity>

            {outstandingBalance > 0 &&
              outstandingBalance !== installmentAmount && (
                <TouchableOpacity
                  style={[
                    styles.modeCard,
                    {
                      backgroundColor:
                        paymentMode === "full"
                          ? colors.primaryLight
                          : colors.surface,
                      borderColor:
                        paymentMode === "full" ? colors.primary : colors.border,
                      borderWidth: paymentMode === "full" ? 2 : 1,
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setPaymentMode("full")}
                >
                  <Ionicons
                    name="checkmark-done-circle-outline"
                    size={22}
                    color={
                      paymentMode === "full"
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.modePrimary,
                      {
                        color:
                          paymentMode === "full" ? colors.primary : colors.text,
                      },
                    ]}
                  >
                    Repay Full Loan
                  </Text>
                  <Text
                    style={[styles.modeAmount, { color: colors.textSecondary }]}
                  >
                    {formatCurrency(outstandingBalance)}
                  </Text>
                </TouchableOpacity>
              )}
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
                {gateway.id === "ESEWA" ? (
                  <View style={styles.gatewayLogoWrap}>
                    <Image
                      source={require("../../assets/images/esewa-logo.png")}
                      style={{ width: 48, height: 48, resizeMode: "contain" }}
                    />
                  </View>
                ) : (
                  <View style={styles.gatewayLogoWrap}>
                    <Image
                      source={require("../../assets/images/khalti-logo.png")}
                      style={{ width: 48, height: 48, resizeMode: "contain" }}
                    />
                  </View>
                )}
                <Text style={[styles.gatewayName, { color: colors.text }]}>
                  {gateway.name}
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
              backgroundColor:
                selectedGateway === "ESEWA"
                  ? "#60BB46"
                  : selectedGateway === "KHALTI"
                    ? "#5C2D91"
                    : colors.border,
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
              {selectedGateway ? (
                <Image
                  source={
                    selectedGateway === "ESEWA"
                      ? require("../../assets/images/esewa-logo.png")
                      : require("../../assets/images/khalti-logo.png")
                  }
                  style={{ width: 22, height: 22, resizeMode: "contain" }}
                />
              ) : (
                <Ionicons
                  name="card-outline"
                  size={20}
                  color={colors.textSecondary}
                />
              )}
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
    summaryDivider: { height: 1, marginVertical: spacing.md },
    paymentModeRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    modeCard: {
      flex: 1,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      alignItems: "center",
      gap: 6,
    },
    modePrimary: { fontSize: 12, fontWeight: "700", textAlign: "center" },
    modeAmount: { fontSize: 13, fontWeight: "600" },
    amountSection: { alignItems: "center", paddingVertical: spacing.sm },
    amountLabel: {
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    amountValue: { fontSize: 38, fontWeight: "800" },
    walletRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: spacing.sm,
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
    gatewayLogoWrap: {
      width: 56,
      height: 56,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      backgroundColor: "transparent",
    },
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
