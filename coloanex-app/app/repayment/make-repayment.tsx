import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { Buffer } from "buffer";
import AppHeader from "@/components/ui/AppHeader";
import { PaymentWebView } from "@/components/payments";
import { spacing, borderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useKhaltiPayment, useEsewaPayment } from "@/hooks/payments";
import { loansApi, contractsApi, paymentSchedulesApi } from "@/api";
import { useToast, BlockchainProcessingModal, GasModeWarningBanner, GasModeBlockingOverlay } from "@/components/ui";
import type { Loan } from "@/types";
import type { Contract } from "@/api/contractsApi";
import type { PaymentGateway } from "@/api/paymentsApi";
import { formatCurrency } from "@/utils/currency";
import { ensureActiveSubscription } from "@/utils/subscriptionGuard";

const SUCCESS_URL_PATTERN = "/payment/success";
const FAILURE_URL_PATTERN = "/payment/failure";

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
  const khaltiPayment = useKhaltiPayment();
  const esewaPayment = useEsewaPayment();

  const [loan, setLoan] = useState<Loan | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(
    (params.gateway as PaymentGateway) ?? null,
  );
  const [paymentMode, setPaymentMode] = useState<"installment" | "full">(
    "installment",
  );
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);
  const [blockchainProcessing, setBlockchainProcessing] = useState(false);
  const [blockchainStep, setBlockchainStep] = useState<
    "blockchain" | "database" | "complete"
  >("blockchain");
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [currentPaymentData, setCurrentPaymentData] = useState<{
    transactionUuid: string;
    amount: number;
    gateway: PaymentGateway;
  } | null>(null);

  const safeNum = (val: any) => {
    if (val === undefined || val === null) return 0;
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      if (val === "[object Object]") return 0;
      return parseFloat(val) || 0;
    }
    return 0; // if it's an object, we just gracefully fallback to 0 in case frontend got messed up
  };

  const installmentAmount = safeNum(params.amount);
  const outstandingBalance = contract
    ? safeNum(contract.outstandingBalance) ||
      safeNum(contract.totalAmountDue) - safeNum(contract.totalAmountPaid)
    : safeNum(params.outstandingBalance);

  const amount =
    paymentMode === "full" && outstandingBalance > 0
      ? outstandingBalance
      : installmentAmount;

  const loadData = useCallback(async () => {
    try {
      const [loanData, contractData] = await Promise.all([
        loansApi.getById(params.loanId),
        params.contractId
          ? contractsApi.getById(params.contractId)
          : Promise.resolve(null),
      ]);
      setLoan(loanData);
      setContract(contractData);

      if (params.scheduleId) {
        try {
          const schedule = await paymentSchedulesApi.getById(params.scheduleId);
          if (schedule?.status === "PAID") {
            setAlreadyPaid(true);
          }
        } catch {}
      }
    } catch {
      showToast("Failed to load payment details. Please try again.", "error");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [params.loanId, params.contractId, params.scheduleId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePaymentSuccess = async (url: string) => {
    if (!currentPaymentData) return;

    setShowPaymentWebView(false);
    setBlockchainProcessing(true);
    setBlockchainStep("blockchain");

    try {
      const paymentHook =
        currentPaymentData.gateway === "KHALTI" ? khaltiPayment : esewaPayment;

      const success = await paymentHook.verify({
        transactionUuid: currentPaymentData.transactionUuid,
        totalAmount: currentPaymentData.amount,
        type: "INSTALLMENT_PAYMENT",
        contractId: params.contractId || undefined,
        paymentScheduleId:
          paymentMode === "installment"
            ? params.scheduleId || undefined
            : undefined,
        gasPaymentMode: "PLATFORM_WALLET",
        platform: "APP",
      });

      setBlockchainStep("database");
      await new Promise((resolve) => setTimeout(resolve, 600));
      setBlockchainStep("complete");
      await new Promise((resolve) => setTimeout(resolve, 400));

      if (success) {
        setBlockchainProcessing(false);
        router.replace({
          pathname: "/payment/success",
          params: {
            amount: String(currentPaymentData.amount),
            gateway: currentPaymentData.gateway,
          },
        });
      } else {
        await handlePaymentLookup();
      }
    } catch {
      await handlePaymentLookup();
    }
  };

  const handlePaymentFailure = async (url: string) => {
    if (!currentPaymentData) return;

    setShowPaymentWebView(false);
    setBlockchainProcessing(true);
    setBlockchainStep("blockchain");

    try {
      await handlePaymentLookup();
    } catch {
      setBlockchainProcessing(false);
      router.replace({
        pathname: "/payment/failure",
        params: {
          amount: String(currentPaymentData.amount),
          gateway: currentPaymentData.gateway,
        },
      });
    }
  };

  const handlePaymentLookup = async () => {
    if (!currentPaymentData) return;

    const paymentHook =
      currentPaymentData.gateway === "KHALTI" ? khaltiPayment : esewaPayment;

    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const lookupResult = await paymentHook.lookup(
          currentPaymentData.transactionUuid,
          currentPaymentData.amount,
        );

        if (lookupResult.status === "COMPLETED") {
          if (lookupResult.alreadyProcessed) {
            setBlockchainProcessing(false);
            router.replace({
              pathname: "/payment/success",
              params: {
                amount: String(currentPaymentData.amount),
                gateway: currentPaymentData.gateway,
              },
            });
            return;
          }

          const success = await paymentHook.verify({
            transactionUuid: currentPaymentData.transactionUuid,
            totalAmount: currentPaymentData.amount,
            type: "INSTALLMENT_PAYMENT",
            contractId: params.contractId || undefined,
            paymentScheduleId:
              paymentMode === "installment"
                ? params.scheduleId || undefined
                : undefined,
            gasPaymentMode: "PLATFORM_WALLET",
            platform: "APP",
          });

          if (success) {
            setBlockchainStep("database");
            await new Promise((resolve) => setTimeout(resolve, 600));
            setBlockchainStep("complete");
            await new Promise((resolve) => setTimeout(resolve, 400));
            setBlockchainProcessing(false);
            router.replace({
              pathname: "/payment/success",
              params: {
                amount: String(currentPaymentData.amount),
                gateway: currentPaymentData.gateway,
              },
            });
            return;
          }
        } else if (
          lookupResult.status === "FAILED" ||
          lookupResult.status === "EXPIRED"
        ) {
          setBlockchainProcessing(false);
          router.replace({
            pathname: "/payment/failure",
            params: {
              amount: String(currentPaymentData.amount),
              gateway: currentPaymentData.gateway,
            },
          });
          return;
        }

        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    throw new Error("Payment verification timed out");
  };

  const handlePaymentCancel = () => {
    setShowPaymentWebView(false);
    setBlockchainProcessing(false);
    showToast("Payment was cancelled.", "warning");
  };

  const handlePay = async () => {
    const hasSubscription = await ensureActiveSubscription(showToast);
    if (!hasSubscription) {
      return;
    }

    if (!selectedGateway) {
      showToast("Please select a payment method to continue.", "warning");
      return;
    }
    if (amount <= 0) {
      showToast("Payment amount is invalid.", "error");
      return;
    }

    setInitiating(true);
    try {
      const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
      const apiUrl =
        Platform.OS === "web" && apiBase.includes("192.168.")
          ? "http://localhost:3000/api"
          : `${apiBase}/api`;

      const resolvedSuccessUrl =
        Platform.OS === "web"
          ? `${window.location.origin}/payment/callback?gateway=${selectedGateway}`
          : `https://coloanex-intercept.app/payment/success`;

      const resolvedFailureUrl =
        Platform.OS === "web"
          ? `${window.location.origin}/payment/callback?gateway=${selectedGateway}`
          : `https://coloanex-intercept.app/payment/failure`;

      const paymentHook =
        selectedGateway === "KHALTI" ? khaltiPayment : esewaPayment;

      const result = await paymentHook.initiate({
        contractId: params.contractId || undefined,
        paymentScheduleId:
          paymentMode === "installment"
            ? params.scheduleId || undefined
            : undefined,
        amount,
        type: "INSTALLMENT_PAYMENT",
        successUrl: resolvedSuccessUrl,
        failureUrl: resolvedFailureUrl,
        gasPaymentMode: "PLATFORM_WALLET",
        platform: "APP",
      });

      let finalPaymentUrl = result.paymentUrl;

      if (selectedGateway === "ESEWA") {
        if (result.formData && Object.keys(result.formData).length > 0) {
          const encoded = Buffer.from(
            JSON.stringify({
              paymentUrl: result.paymentUrl,
              formData: result.formData,
            }),
          ).toString("base64");
          finalPaymentUrl = `${apiUrl}/payments/esewa-form?data=${encoded}`;
        }
      }

      const paymentData = {
        transactionUuid:
          selectedGateway === "KHALTI"
            ? (result.formData?.pidx ?? result.transactionUuid)
            : result.transactionUuid,
        amount,
        gateway: selectedGateway,
      };

      setCurrentPaymentData(paymentData);

      if (Platform.OS === "web") {
        sessionStorage.setItem(
          "app_pending_payment",
          JSON.stringify({
            ...paymentData,
            type: "INSTALLMENT_PAYMENT",
            contractId: params.contractId || undefined,
            paymentScheduleId:
              paymentMode === "installment"
                ? params.scheduleId || undefined
                : undefined,
          }),
        );
      }

      setPaymentUrl(finalPaymentUrl);
      setInitiating(false);
      setShowPaymentWebView(true);
    } catch (error: any) {
      setInitiating(false);
      const errorMessage =
        error?.message ||
        error?.data?.message ||
        "An error occurred while processing your payment. Please try again.";
      showToast(errorMessage, "error");
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

  if (alreadyPaid) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppHeader title="Make Payment" showThemeToggle={false} />
        <View style={styles.alreadyPaidContainer}>
          <View
            style={[
              styles.alreadyPaidIconWrap,
              { backgroundColor: `${colors.success}20` },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={64}
              color={colors.success}
            />
          </View>
          <Text style={[styles.alreadyPaidTitle, { color: colors.text }]}>
            Installment Already Paid
          </Text>
          <Text
            style={[styles.alreadyPaidSub, { color: colors.textSecondary }]}
          >
            This installment has already been paid successfully. No further
            action is required.
          </Text>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={18} color={colors.buttonText} />
            <Text style={[styles.backBtnText, { color: colors.buttonText }]}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const lenderName = loan.borrower?.tenant?.name ?? "Lender";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Make Payment" showThemeToggle={false} />
      <GasModeWarningBanner />
      <GasModeBlockingOverlay />

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
            Your payment is secured with 256-bit SSL encryption and recorded on
            the blockchain for immutable proof.
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
              opacity: initiating ? 0.7 : 1,
            },
          ]}
          activeOpacity={0.85}
          onPress={handlePay}
          disabled={!selectedGateway || initiating}
        >
          {initiating ? (
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

      <BlockchainProcessingModal
        visible={blockchainProcessing}
        message="Recording payment on the blockchain and updating your account. Please wait..."
        currentStep={blockchainStep}
      />

      <PaymentWebView
        visible={showPaymentWebView}
        paymentUrl={paymentUrl}
        successUrlPattern={SUCCESS_URL_PATTERN}
        failureUrlPattern={FAILURE_URL_PATTERN}
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
        onCancel={handlePaymentCancel}
        gateway={selectedGateway ?? "KHALTI"}
      />
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
    alreadyPaidContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xl,
    },
    alreadyPaidIconWrap: {
      width: 120,
      height: 120,
      borderRadius: 60,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.lg,
    },
    alreadyPaidTitle: {
      fontSize: 22,
      fontWeight: "800",
      marginBottom: spacing.sm,
      textAlign: "center",
    },
    alreadyPaidSub: {
      fontSize: 14,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: spacing.xl,
    },
    backBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: 14,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.lg,
    },
    backBtnText: { fontSize: 15, fontWeight: "700" },
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
