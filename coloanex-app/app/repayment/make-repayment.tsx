import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import Slider from "@react-native-community/slider";
import { Card, LenderLogo, Button, useToast } from "@/components/ui";
import { spacing, typography, borderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { loansApi } from "@/api";
import type { Loan } from "@/types";
import { formatCurrency } from "@/utils/currency";

export default function RepaymentScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const isFormValid = useMemo(() => amount >= 100, [amount]);

  useEffect(() => {
    if (id) {
      loadLoan();
    }
  }, [id]);

  useEffect(() => {
    if (loan) {
      const monthlyPayment = loan.monthlyPayment || 0;
      setAmount(monthlyPayment > 0 ? monthlyPayment : 1000);
    }
  }, [loan]);

  const loadLoan = async () => {
    try {
      const data = await loansApi.getById(id!);
      setLoan(data);
    } catch (error) {
      console.error("Failed to load loan:", error);
      showToast("Failed to load loan details", "error");
      router.back();
    }
  };

  const calculateBreakdown = () => {
    if (!loan) return { principal: 0, interest: 0 };

    const remainingBalance =
      loan.remainingBalance ?? loan.approvedAmount ?? loan.requestedAmount;
    const interest = 0;
    const principal = amount - interest;

    return {
      principal: Math.max(0, principal),
      interest: Math.min(amount, interest),
    };
  };

  const handlePayment = async () => {
    if (amount < 100) {
      showToast("Minimum payment amount is Rs 100", "error");
      return;
    }

    setLoading(true);
    try {
      await loansApi.makePayment(id!, amount);
      showToast("Payment processed successfully!", "success");
      router.back();
    } catch (error: any) {
      showToast(
        error.response?.data?.message || "Failed to process payment",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!loan) return null;

  const breakdown = calculateBreakdown();
  const remainingBalance =
    loan.remainingBalance ?? loan.approvedAmount ?? loan.requestedAmount;
  const nextPaymentDate = loan.nextPaymentDate;
  const daysRemaining = nextPaymentDate
    ? Math.ceil(
        (new Date(nextPaymentDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : 30;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Make Repayment
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.headerCard}>
          <View style={styles.lenderHeader}>
            <LenderLogo
              name={loan.borrower?.tenant?.name || "Lender"}
              size={48}
              verified
            />
            <View style={styles.lenderInfo}>
              <Text style={[styles.lenderName, { color: colors.text }]}>
                {loan.borrower?.tenant?.name || "Lender"}
              </Text>
              <Text style={[styles.loanType, { color: colors.textSecondary }]}>
                Personal Loan
              </Text>
            </View>
          </View>
          <View
            style={[styles.dueBox, { backgroundColor: colors.primaryLight }]}
          >
            <Text style={[styles.dueText, { color: colors.primary }]}>
              {nextPaymentDate
                ? `Next payment due in ${daysRemaining} days`
                : "Payment schedule pending"}
            </Text>
          </View>
        </Card>

        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Payment Amount
          </Text>
          <Text style={[styles.amount, { color: colors.text }]}>
            {formatCurrency(amount)}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={100}
            maximumValue={Math.max(remainingBalance, 1000)}
            step={50}
            value={Math.max(amount, 100)}
            onValueChange={setAmount}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
          <View style={styles.range}>
            <Text style={[styles.rangeText, { color: colors.textLight }]}>
              Rs 100
            </Text>
            <Text style={[styles.rangeText, { color: colors.textLight }]}>
              Full Balance: {formatCurrency(remainingBalance)}
            </Text>
          </View>
        </Card>

        <Card style={styles.paymentCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Payment Method
          </Text>
          <TouchableOpacity style={styles.paymentMethod}>
            <View style={styles.paymentMethodLeft}>
              <View style={styles.esewaIcon}>
                <Text style={styles.esewaText}>e</Text>
              </View>
              <View style={styles.paymentMethodInfo}>
                <Text
                  style={[styles.paymentMethodText, { color: colors.text }]}
                >
                  eSewa
                </Text>
                <Text
                  style={[
                    styles.paymentMethodSubtext,
                    { color: colors.textSecondary },
                  ]}
                >
                  Digital wallet payment
                </Text>
              </View>
            </View>
            <TouchableOpacity>
              <Text style={[styles.changeText, { color: colors.primary }]}>
                Change
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Card>

        <Card
          style={[styles.breakdownCard, { backgroundColor: colors.surface }]}
        >
          <View style={styles.breakdownRow}>
            <Text
              style={[styles.breakdownLabel, { color: colors.textSecondary }]}
            >
              Principal Amount
            </Text>
            <Text style={[styles.breakdownValue, { color: colors.text }]}>
              {formatCurrency(breakdown.principal)}
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text
              style={[styles.breakdownLabel, { color: colors.textSecondary }]}
            >
              Interest Amount
            </Text>
            <Text style={[styles.breakdownValue, { color: colors.text }]}>
              {formatCurrency(breakdown.interest)}
            </Text>
          </View>
          <View
            style={[
              styles.breakdownRow,
              styles.totalRow,
              { borderTopColor: colors.border },
            ]}
          >
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              Total Payment
            </Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>
              {formatCurrency(amount)}
            </Text>
          </View>
        </Card>

        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Upcoming Payments
          </Text>
          {loan.nextPaymentDate ? (
            <View style={styles.upcomingPayment}>
              <View style={styles.upcomingInfo}>
                <Text style={[styles.upcomingDate, { color: colors.text }]}>
                  {new Date(loan.nextPaymentDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
                <Text
                  style={[styles.upcomingType, { color: colors.textSecondary }]}
                >
                  Monthly Payment
                </Text>
              </View>
              <View style={styles.upcomingRight}>
                <Text style={[styles.upcomingAmount, { color: colors.text }]}>
                  {formatCurrency(loan.monthlyPayment || amount)}
                </Text>
                <View
                  style={[styles.dueBadge, { backgroundColor: colors.warning }]}
                >
                  <Text style={[styles.dueText, { color: colors.primary }]}>
                    Due Soon
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <Text
              style={[styles.noPaymentsText, { color: colors.textSecondary }]}
            >
              No upcoming payments scheduled
            </Text>
          )}
        </Card>

        <TouchableOpacity
          style={[styles.consentBox, { backgroundColor: colors.primaryLight }]}
        >
          <Ionicons name="checkbox" size={24} color={colors.primary} />
          <Text style={[styles.consentText, { color: colors.text }]}>
            I confirm this payment and authorize deduction from my account
          </Text>
        </TouchableOpacity>

        <View style={styles.actions}>
          <Button
            title="Schedule Payment"
            onPress={() => {}}
            variant="outline"
            style={styles.scheduleButton}
          />
          <Button
            title="Pay Now"
            onPress={handlePayment}
            loading={loading}
            disabled={!isFormValid || loading}
            style={styles.payButton}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
    },
    backButton: {
      padding: spacing.xs,
    },
    headerTitle: {
      ...typography.h3,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    headerCard: {
      marginBottom: spacing.md,
    },
    lenderHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    lenderInfo: {
      flex: 1,
      marginLeft: spacing.md,
    },
    lenderName: {
      ...typography.h3,
      marginBottom: 4,
    },
    loanType: {
      ...typography.bodySmall,
    },
    dueBox: {
      padding: spacing.sm,
      borderRadius: borderRadius.md,
    },
    dueText: {
      ...typography.bodySmall,
    },
    sectionTitle: {
      ...typography.body,
      fontWeight: "600",
      marginBottom: spacing.md,
    },
    amount: {
      ...typography.h1,
      fontSize: 40,
      marginBottom: spacing.md,
    },
    slider: {
      width: "100%",
      height: 40,
    },
    range: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    rangeText: {
      ...typography.caption,
    },
    paymentCard: {},
    paymentMethod: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    paymentMethodLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    esewaIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#60BB46",
      alignItems: "center",
      justifyContent: "center",
    },
    esewaText: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    paymentMethodInfo: {
      marginLeft: spacing.md,
    },
    paymentMethodText: {
      ...typography.body,
      fontWeight: "600",
      marginBottom: 4,
    },
    paymentMethodSubtext: {
      ...typography.caption,
    },
    changeText: {
      ...typography.bodySmall,
      fontWeight: "600",
    },
    breakdownCard: {
      marginBottom: spacing.md,
    },
    breakdownRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: spacing.sm,
    },
    breakdownLabel: {
      ...typography.body,
    },
    breakdownValue: {
      ...typography.body,
      fontWeight: "600",
    },
    totalRow: {
      borderTopWidth: 1,
      paddingTop: spacing.md,
      marginTop: spacing.sm,
    },
    totalLabel: {
      ...typography.body,
      fontWeight: "600",
    },
    totalValue: {
      ...typography.h3,
    },
    upcomingPayment: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    upcomingInfo: {},
    upcomingDate: {
      ...typography.body,
      fontWeight: "600",
      marginBottom: 4,
    },
    upcomingType: {
      ...typography.caption,
    },
    upcomingRight: {
      alignItems: "flex-end",
    },
    upcomingAmount: {
      ...typography.body,
      fontWeight: "600",
      marginBottom: 4,
    },
    noPaymentsText: {
      ...typography.body,
      textAlign: "center",
      paddingVertical: spacing.md,
    },
    dueBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: borderRadius.sm,
    },
    consentBox: {
      flexDirection: "row",
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
      marginTop: spacing.md,
    },
    consentText: {
      ...typography.caption,
      marginLeft: spacing.sm,
      flex: 1,
      lineHeight: 18,
    },
    actions: {
      flexDirection: "row",
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    scheduleButton: {
      flex: 1,
    },
    payButton: {
      flex: 1,
    },
  });
