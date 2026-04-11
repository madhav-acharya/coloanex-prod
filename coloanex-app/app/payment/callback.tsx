import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { BlockchainProcessingModal } from "@/components/ui";
import { spacing, typography, borderRadius } from "@/constants/theme";
import { paymentsApi } from "@/api/paymentsApi";
import { subscriptionsApi } from "@/api/subscriptionsApi";
import type { PaymentGateway } from "@/api/paymentsApi";

export default function PaymentCallbackScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const params = useLocalSearchParams<{
    gateway: string;
    transactionUuid: string;
    amount: string;
    walletId?: string;
    contractId?: string;
    scheduleId?: string;
    paymentMode?: string;
    status?: string;
    pidx?: string;
    transaction_uuid?: string;
  }>();

  const [verifying, setVerifying] = useState(true);
  const [blockchainStep, setBlockchainStep] = useState<
    "blockchain" | "database" | "complete"
  >("blockchain");
  const [succeeded, setSucceeded] = useState(false);
  const [flowType, setFlowType] = useState<"INSTALLMENT" | "SUBSCRIPTION">(
    "INSTALLMENT",
  );

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const run = async () => {
      try {
        const raw = sessionStorage.getItem("app_pending_payment");
        sessionStorage.removeItem("app_pending_payment");

        const pending = raw ? JSON.parse(raw) : null;

        const gateway = (pending?.gateway ??
          params.gateway ??
          "") as PaymentGateway;
        const pendingType = String(pending?.type || "").toUpperCase();
        const isSubscriptionPayment = pendingType === "SUBSCRIPTION_PAYMENT";
        setFlowType(isSubscriptionPayment ? "SUBSCRIPTION" : "INSTALLMENT");

        const transactionUuid =
          gateway === "KHALTI"
            ? (params.pidx ??
              pending?.transactionUuid ??
              params.transactionUuid)
            : (params.transaction_uuid ??
              pending?.transactionUuid ??
              params.transactionUuid);
        const totalAmount = parseFloat(pending?.amount ?? params.amount ?? "0");
        const contractId = pending?.contractId ?? params.contractId;
        const paymentScheduleId =
          pending?.paymentScheduleId ?? params.scheduleId;

        if (!gateway || !transactionUuid || !totalAmount) {
          setVerifying(false);
          setSucceeded(false);
          return;
        }

        setBlockchainStep("blockchain");

        const verifyResult = await paymentsApi.verifyPayment({
          transactionUuid,
          totalAmount,
          gateway,
          type: isSubscriptionPayment ? "FEE" : "INSTALLMENT_PAYMENT",
          gasPaymentMode: isSubscriptionPayment ? "PLATFORM_WALLET" : undefined,
          contractId,
          paymentScheduleId,
        });

        const purchaseSubscriptionIfNeeded = async (
          paymentTransactionId: string | null,
        ) => {
          if (!isSubscriptionPayment || !paymentTransactionId) return;
          await subscriptionsApi.purchase({
            planCode: pending?.planCode,
            scope: pending?.scope || "USER",
            tenantId: pending?.tenantId,
            paymentTransactionId,
          });
        };

        if (verifyResult.success) {
          await purchaseSubscriptionIfNeeded(
            verifyResult.transactionId || null,
          );
          setBlockchainStep("database");
          await new Promise((r) => setTimeout(r, 600));
          setBlockchainStep("complete");
          await new Promise((r) => setTimeout(r, 400));
          setVerifying(false);
          setSucceeded(true);
          return;
        }

        const maxAttempts = 6;
        for (let i = 0; i < maxAttempts; i++) {
          const lookup = await paymentsApi.lookupPayment({
            transactionUuid,
            totalAmount,
            gateway,
          });
          if (lookup.status === "COMPLETED") {
            if (lookup.alreadyProcessed) {
              await purchaseSubscriptionIfNeeded(lookup.transactionId || null);
              setBlockchainStep("database");
              await new Promise((r) => setTimeout(r, 400));
              setVerifying(false);
              setSucceeded(true);
              return;
            }
            const retry = await paymentsApi.verifyPayment({
              transactionUuid,
              totalAmount,
              gateway,
              type: isSubscriptionPayment ? "FEE" : "INSTALLMENT_PAYMENT",
              gasPaymentMode: isSubscriptionPayment
                ? "PLATFORM_WALLET"
                : undefined,
              contractId,
              paymentScheduleId,
            });
            if (retry.success) {
              await purchaseSubscriptionIfNeeded(retry.transactionId || null);
              setBlockchainStep("database");
              await new Promise((r) => setTimeout(r, 600));
              setBlockchainStep("complete");
              await new Promise((r) => setTimeout(r, 400));
              setVerifying(false);
              setSucceeded(true);
              return;
            }
          } else if (
            lookup.status === "FAILED" ||
            lookup.status === "EXPIRED"
          ) {
            break;
          }
          if (i < maxAttempts - 1)
            await new Promise((r) => setTimeout(r, 2000));
        }

        setVerifying(false);
        setSucceeded(false);
      } catch {
        setVerifying(false);
        setSucceeded(false);
      }
    };
    run();
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  if (verifying) {
    return (
      <BlockchainProcessingModal
        visible={true}
        message="Recording payment on the blockchain and updating your account. Please wait..."
        currentStep={blockchainStep}
      />
    );
  }

  if (succeeded) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.successLight },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={72}
              color={colors.success}
            />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {flowType === "SUBSCRIPTION"
              ? "Subscription Activated"
              : "Payment Successful"}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {flowType === "SUBSCRIPTION"
              ? "Your payment has been verified and your subscription has been activated successfully."
              : "Your payment has been verified, recorded on the blockchain, and your loan repayment has been updated."}
          </Text>
        </View>
        <View style={styles.buttons}>
          {flowType === "SUBSCRIPTION" ? (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
              onPress={() => router.replace("/pricing")}
            >
              <Ionicons
                name="pricetag-outline"
                size={18}
                color={colors.buttonText}
              />
              <Text
                style={[styles.primaryBtnText, { color: colors.buttonText }]}
              >
                Back to Pricing
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
              onPress={() => router.replace("/(tabs)/my-loans")}
            >
              <Ionicons
                name="document-text-outline"
                size={18}
                color={colors.buttonText}
              />
              <Text
                style={[styles.primaryBtnText, { color: colors.buttonText }]}
              >
                View My Loans
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            activeOpacity={0.85}
            onPress={() => router.replace("/(tabs)/home")}
          >
            <Ionicons name="home-outline" size={18} color={colors.text} />
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
              Go to Home
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View
          style={[styles.iconCircle, { backgroundColor: colors.errorLight }]}
        >
          <Ionicons name="close-circle" size={72} color={colors.error} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          {flowType === "SUBSCRIPTION"
            ? "Subscription Payment Failed"
            : "Payment Not Verified"}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {flowType === "SUBSCRIPTION"
            ? "We could not verify your subscription payment. If your account was debited, please contact support."
            : "We could not verify your payment. If your account was debited, please contact support. Otherwise, try again."}
        </Text>
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.error }]}
          activeOpacity={0.85}
          onPress={() => router.back()}
        >
          <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
          <Text style={[styles.primaryBtnText, { color: "#FFFFFF" }]}>
            Try Again
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.secondaryBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          activeOpacity={0.85}
          onPress={() =>
            router.replace(
              flowType === "SUBSCRIPTION" ? "/pricing" : "/(tabs)/my-loans",
            )
          }
        >
          <Ionicons
            name={
              flowType === "SUBSCRIPTION"
                ? "pricetag-outline"
                : "document-text-outline"
            }
            size={18}
            color={colors.text}
          />
          <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
            {flowType === "SUBSCRIPTION" ? "Back to Pricing" : "View My Loans"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl * 2,
      paddingBottom: spacing.xxl,
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
    },
    iconCircle: {
      width: 128,
      height: 128,
      borderRadius: 64,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.sm,
    },
    title: { ...typography.h1, fontWeight: "700", textAlign: "center" },
    description: {
      ...typography.body,
      textAlign: "center",
      marginTop: spacing.xs,
      lineHeight: 22,
      paddingHorizontal: spacing.sm,
    },
    buttons: { gap: spacing.sm },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
    },
    primaryBtnText: { ...typography.body, fontWeight: "600" },
    secondaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
    },
    secondaryBtnText: { ...typography.body, fontWeight: "600" },
  });
