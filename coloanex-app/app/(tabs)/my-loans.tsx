import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Card, LenderLogo, Button } from "@/components/ui";
import { colors, spacing, typography, borderRadius } from "@/constants/theme";
import { loansApi } from "@/api";
import type { Loan } from "@/types";
import { formatCurrency } from "@/utils/currency";

export default function LoansScreen() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLoans = async () => {
    try {
      const data = await loansApi.getMyLoans();
      setLoans(data);
    } catch (error) {
      console.error("Failed to load loans:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLoans();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadLoans();
  };

  const totalDebt = loans.reduce((sum, loan) => sum + loan.remainingBalance, 0);
  const activeLoans = loans.filter((loan) => loan.status === "active").length;
  const nextPaymentDate =
    loans.length > 0
      ? loans.reduce(
          (earliest, loan) =>
            new Date(loan.nextPaymentDate) < new Date(earliest)
              ? loan.nextPaymentDate
              : earliest,
          loans[0].nextPaymentDate
        )
      : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Active Loans</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Active Debt</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(totalDebt)}</Text>
          <View style={styles.summaryDetails}>
            <View style={styles.summaryDetail}>
              <Text style={styles.summaryDetailValue}>
                {activeLoans} Active Loans
              </Text>
            </View>
            {nextPaymentDate && (
              <View style={styles.summaryDetail}>
                <Text style={styles.summaryDetailLabel}>Next Payment: </Text>
                <Text style={styles.summaryDetailValue}>
                  {new Date(nextPaymentDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </View>
            )}
          </View>
        </Card>

        <View style={styles.loansSection}>
          {loans.map((loan) => {
            const percentPaid =
              ((loan.totalPayments - loan.paymentsMade) / loan.totalPayments) *
              100;
            return (
              <TouchableOpacity
                key={loan.id}
                onPress={() =>
                  router.push({
                    pathname: "/loans/loan-details",
                    params: { id: loan.id },
                  })
                }
              >
                <Card style={styles.loanCard}>
                  <View style={styles.loanHeader}>
                    <LenderLogo
                      logo={loan.lenderLogo}
                      name={loan.lenderName}
                      size={48}
                      verified
                    />
                    <View style={styles.loanInfo}>
                      <Text style={styles.lenderName}>{loan.lenderName}</Text>
                      <Text style={styles.loanType}>{loan.loanType}</Text>
                    </View>
                  </View>

                  <View style={styles.loanDetails}>
                    <View style={styles.loanDetail}>
                      <Text style={styles.loanDetailLabel}>Loan Amount</Text>
                      <Text style={styles.loanDetailValue}>
                        {formatCurrency(loan.principalAmount)}
                      </Text>
                    </View>
                    <View style={styles.loanDetail}>
                      <Text style={styles.loanDetailLabel}>Interest Rate</Text>
                      <Text style={styles.loanDetailValue}>
                        {loan.interestRate}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.loanDetails}>
                    <View style={styles.loanDetail}>
                      <Text style={styles.loanDetailLabel}>
                        Remaining Balance
                      </Text>
                      <Text
                        style={[styles.loanDetailValue, styles.balanceValue]}
                      >
                        {formatCurrency(loan.remainingBalance)}
                      </Text>
                    </View>
                    <View style={styles.loanDetail}>
                      <Text style={styles.loanDetailLabel}>
                        Monthly Payment
                      </Text>
                      <Text style={styles.loanDetailValue}>
                        ${loan.monthlyPayment}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${percentPaid}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {loan.paymentsMade} of {loan.totalPayments} payments
                      completed ({percentPaid.toFixed(0)}% paid)
                    </Text>
                  </View>

                  <View style={styles.loanFooter}>
                    <Text style={styles.dueDate}>
                      Due Date:{" "}
                      {new Date(loan.nextPaymentDate).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" }
                      )}
                    </Text>
                    <TouchableOpacity
                      style={styles.payButton}
                      onPress={() =>
                        router.push({
                          pathname: "/repayment/make-repayment",
                          params: { id: loan.id },
                        })
                      }
                    >
                      <Text style={styles.payButtonText}>Make Payment</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          title="Apply for New Loan"
          onPress={() => router.push("/home/browse-lenders")}
          variant="outline"
          style={styles.applyButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    fontWeight: "800",
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  summaryCard: {
    backgroundColor: colors.primary,
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  summaryLabel: {
    ...typography.bodySmall,
    color: colors.background,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600",
  },
  summaryAmount: {
    ...typography.h1,
    fontSize: 36,
    color: colors.background,
    marginBottom: spacing.md,
    fontWeight: "800",
  },
  summaryDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryDetailLabel: {
    ...typography.bodySmall,
    color: colors.background,
    opacity: 0.9,
  },
  summaryDetailValue: {
    ...typography.bodySmall,
    fontWeight: "700",
    color: colors.background,
  },
  loansSection: {
    marginBottom: spacing.lg,
  },
  loanCard: {
    marginBottom: spacing.md,
  },
  loanHeader: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  loanInfo: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: "center",
  },
  lenderName: {
    ...typography.h3,
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
    fontWeight: "700",
  },
  loanType: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  loanDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  loanDetail: {},
  loanDetailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 6,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  loanDetailValue: {
    ...typography.body,
    fontWeight: "700",
    color: colors.text,
    fontSize: 16,
  },
  balanceValue: {
    color: colors.primary,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: "hidden",
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  loanFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dueDate: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  payButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  payButtonText: {
    ...typography.bodySmall,
    fontWeight: "600",
    color: colors.background,
  },
  applyButton: {
    marginBottom: spacing.lg,
  },
});
