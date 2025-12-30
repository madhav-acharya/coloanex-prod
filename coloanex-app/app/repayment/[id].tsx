import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import Slider from "@react-native-community/slider";
import { Card, LenderLogo, Button } from "@/components/ui";
import { colors, spacing, typography, borderRadius } from "@/constants/theme";
import { loansApi } from "@/api";
import type { Loan } from "@/types";
import { formatCurrency } from "@/utils/currency";

export default function RepaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadLoan();
    }
  }, [id]);

  useEffect(() => {
    if (loan) {
      setAmount(loan.monthlyPayment);
    }
  }, [loan]);

  const loadLoan = async () => {
    try {
      const data = await loansApi.getById(id!);
      setLoan(data);
    } catch (error) {
      console.error("Failed to load loan:", error);
    }
  };

  const calculateBreakdown = () => {
    if (!loan) return { principal: 0, interest: 0 };

    const monthlyRate = loan.interestRate / 100 / 12;
    const interest = loan.remainingBalance * monthlyRate;
    const principal = amount - interest;

    return {
      principal: Math.max(0, principal),
      interest: Math.min(amount, interest),
    };
  };

  const handlePayment = async () => {
    if (amount < 100) {
      Alert.alert("Error", "Minimum payment amount is Rs 100");
      return;
    }

    setLoading(true);
    try {
      await loansApi.makePayment(id!, amount);
      Alert.alert("Success", "Payment processed successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to process payment"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!loan) return null;

  const breakdown = calculateBreakdown();
  const daysRemaining = Math.ceil(
    (new Date(loan.nextPaymentDate).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.headerCard}>
          <View style={styles.lenderHeader}>
            <LenderLogo
              logo={loan.lenderLogo}
              name={loan.lenderName}
              size={48}
              verified
            />
            <View style={styles.lenderInfo}>
              <Text style={styles.lenderName}>{loan.lenderName}</Text>
              <Text style={styles.loanType}>{loan.loanType}</Text>
            </View>
          </View>
          <View style={styles.dueBox}>
            <Text style={styles.dueText}>
              Next payment due in {daysRemaining} days
            </Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Payment Amount</Text>
          <Text style={styles.amount}>{formatCurrency(amount)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={100}
            maximumValue={loan.remainingBalance}
            step={50}
            value={amount}
            onValueChange={setAmount}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
          <View style={styles.range}>
            <Text style={styles.rangeText}>Rs 100</Text>
            <Text style={styles.rangeText}>
              Full Balance: {formatCurrency(loan.remainingBalance)}
            </Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity style={styles.paymentMethod}>
            <View style={styles.paymentMethodLeft}>
              <Ionicons name="card-outline" size={24} color={colors.text} />
              <View style={styles.paymentMethodInfo}>
                <Text style={styles.paymentMethodText}>
                  {loan.paymentMethod || "Visa •••• 4532"}
                </Text>
                <Text style={styles.paymentMethodSubtext}>
                  Default payment method
                </Text>
              </View>
            </View>
            <TouchableOpacity>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Card>

        <Card style={styles.breakdownCard}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Principal Amount</Text>
            <Text style={styles.breakdownValue}>
              {formatCurrency(breakdown.principal)}
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Interest Amount</Text>
            <Text style={styles.breakdownValue}>
              {formatCurrency(breakdown.interest)}
            </Text>
          </View>
          <View style={[styles.breakdownRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Payment</Text>
            <Text style={styles.totalValue}>{formatCurrency(amount)}</Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Upcoming Payments</Text>
          <View style={styles.upcomingPayment}>
            <View style={styles.upcomingInfo}>
              <Text style={styles.upcomingDate}>
                {new Date(loan.nextPaymentDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
              <Text style={styles.upcomingType}>Monthly Payment</Text>
            </View>
            <View style={styles.upcomingRight}>
              <Text style={styles.upcomingAmount}>
                {formatCurrency(loan.monthlyPayment)}
              </Text>
              <View style={styles.dueBadge}>
                <Text style={styles.dueText}>Due Soon</Text>
              </View>
            </View>
          </View>
        </Card>

        <TouchableOpacity style={styles.consentBox}>
          <Ionicons name="checkbox" size={24} color={colors.primary} />
          <Text style={styles.consentText}>
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
            style={styles.payButton}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
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
    color: colors.text,
    marginBottom: 4,
  },
  loanType: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  dueBox: {
    backgroundColor: colors.primaryLight,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  dueText: {
    ...typography.bodySmall,
    color: colors.primary,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.md,
  },
  amount: {
    ...typography.h1,
    fontSize: 40,
    color: colors.text,
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
    color: colors.textLight,
  },
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
  paymentMethodInfo: {
    marginLeft: spacing.md,
  },
  paymentMethodText: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  paymentMethodSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  changeText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: "600",
  },
  breakdownCard: {
    backgroundColor: colors.surface,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  breakdownLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  breakdownValue: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  totalLabel: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
  },
  totalValue: {
    ...typography.h3,
    color: colors.text,
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
    color: colors.text,
    marginBottom: 4,
  },
  upcomingType: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  upcomingRight: {
    alignItems: "flex-end",
  },
  upcomingAmount: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  dueBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  consentBox: {
    flexDirection: "row",
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  consentText: {
    ...typography.caption,
    color: colors.text,
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
