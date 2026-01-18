import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { Card, LenderLogo, Button } from "@/components/ui";
import { colors, spacing, typography, borderRadius } from "@/constants/theme";
import { loansApi } from "@/api";
import type { Loan, PaymentSchedule } from "@/types";
import { formatCurrency } from "@/utils/currency";

export default function LoanDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [schedule, setSchedule] = useState<PaymentSchedule[]>([]);

  useEffect(() => {
    if (id) {
      loadLoan();
      loadSchedule();
    }
  }, [id]);

  const loadLoan = async () => {
    try {
      const data = await loansApi.getById(id!);
      setLoan(data);
    } catch (error) {
      console.error("Failed to load loan:", error);
    }
  };

  const loadSchedule = async () => {
    try {
      const data = await loansApi.getPaymentSchedule(id!);
      setSchedule(data);
    } catch (error) {
      console.error("Failed to load schedule:", error);
    }
  };

  if (!loan) return null;

  const principalAmount = loan.amount || 0;
  const monthlyPayment = loan.monthlyPayment || 0;
  const remainingBalance = loan.remainingBalance || loan.amount || 0;
  const paidAmount = principalAmount - remainingBalance;
  const progressPercent =
    principalAmount > 0 ? (paidAmount / principalAmount) * 100 : 0;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.headerCard}>
          <View style={styles.lenderHeader}>
            <LenderLogo
              name={loan.borrower?.tenant?.name || "Lender"}
              size={56}
              verified
            />
            <View style={styles.lenderInfo}>
              <Text style={styles.lenderName}>
                {loan.borrower?.tenant?.name || "Lender"}
              </Text>
              <Text style={styles.loanType}>Personal Loan • {loan.status}</Text>
            </View>
          </View>
          <Text style={styles.loanNumber}>Loan #{loan.id.slice(0, 8)}</Text>
        </Card>

        <Card style={styles.overviewCard}>
          <Text style={styles.sectionTitle}>Loan Overview</Text>
          <Text style={styles.amount}>{formatCurrency(principalAmount)}</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Interest Rate</Text>
              <Text style={styles.statValue}>{loan.interestRate}% APR</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Loan Term</Text>
              <Text style={styles.statValue}>{loan.termMonths} months</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Monthly Payment</Text>
              <Text style={styles.statValue}>
                {formatCurrency(monthlyPayment)}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Remaining Balance</Text>
              <Text style={styles.statValue}>
                {formatCurrency(remainingBalance)}
              </Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Repayment Progress</Text>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progressPercent}%` }]}
            />
          </View>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              Paid {formatCurrency(paidAmount)}
            </Text>
            <Text style={styles.progressText}>
              Remaining {formatCurrency(remainingBalance)}
            </Text>
          </View>
          <Text style={styles.paymentsCompleted}>
            {loan.paymentsMade || 0} of{" "}
            {loan.totalPayments || loan.termMonths || 0} payments completed
          </Text>
        </Card>

        {loan.nextPaymentDate && (
          <Card style={styles.nextPaymentCard}>
            <Text style={styles.nextPaymentLabel}>Next Payment Due</Text>
            <Text style={styles.nextPaymentDate}>
              {new Date(loan.nextPaymentDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
            <Text style={styles.daysRemaining}>
              {Math.ceil(
                (new Date(loan.nextPaymentDate).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24),
              )}{" "}
              days remaining
            </Text>
          </Card>
        )}

        <View style={styles.scheduleHeader}>
          <Text style={styles.scheduleTitle}>Payment Schedule</Text>
        </View>

        {schedule.map((payment, index) => (
          <Card key={index} style={styles.scheduleCard}>
            <View style={styles.scheduleRow}>
              <View>
                <Text style={styles.scheduleDate}>
                  {new Date(payment.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
                <Text style={styles.scheduleType}>Monthly Payment</Text>
              </View>
              <View style={styles.scheduleRight}>
                <Text style={styles.scheduleAmount}>
                  {formatCurrency(payment.amount)}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    payment.status === "PAID"
                      ? styles.statusBadgePaid
                      : styles.statusBadgeScheduled,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      payment.status === "PAID" && styles.statusTextPaid,
                    ]}
                  >
                    {payment.status === "PAID"
                      ? "Paid"
                      : payment.status === "OVERDUE"
                        ? "Overdue"
                        : "Scheduled"}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        ))}

        <Card>
          <Text style={styles.sectionTitle}>Additional Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Loan Type</Text>
            <Text style={styles.detailValue}>{loan.loanType}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Disbursement Date</Text>
            <Text style={styles.detailValue}>
              {new Date(loan.disbursementDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Maturity Date</Text>
            <Text style={styles.detailValue}>
              {new Date(loan.maturityDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Auto-debit</Text>
            <Text style={styles.detailValue}>
              {loan.autoDebit ? "Enabled" : "Disabled"}
            </Text>
          </View>
          {loan.paymentMethod && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailValue}>{loan.paymentMethod}</Text>
            </View>
          )}
        </Card>

        <View style={styles.actions}>
          <Button
            title="View Payment History"
            onPress={() => {}}
            variant="outline"
            style={styles.historyButton}
          />
          <Button
            title="Make Payment"
            onPress={() =>
              router.push({
                pathname: "/repayment/make-repayment",
                params: { id: loan.id },
              })
            }
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
    marginBottom: spacing.md,
  },
  lenderInfo: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: "center",
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
  loanNumber: {
    ...typography.caption,
    color: colors.textLight,
  },
  overviewCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.md,
  },
  amount: {
    ...typography.h1,
    fontSize: 36,
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  progressText: {
    ...typography.bodySmall,
    fontWeight: "600",
    color: colors.text,
  },
  paymentsCompleted: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  nextPaymentCard: {
    backgroundColor: colors.primaryLight,
    marginBottom: spacing.md,
  },
  nextPaymentLabel: {
    ...typography.bodySmall,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  nextPaymentDate: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  daysRemaining: {
    ...typography.caption,
    color: colors.primary,
  },
  scheduleHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  scheduleTitle: {
    ...typography.h3,
    color: colors.text,
  },
  scheduleCard: {
    marginBottom: spacing.sm,
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scheduleDate: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  scheduleType: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  scheduleRight: {
    alignItems: "flex-end",
  },
  scheduleAmount: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusBadgePaid: {
    backgroundColor: colors.primaryLight,
  },
  statusBadgeScheduled: {
    backgroundColor: colors.surface,
  },
  statusText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statusTextPaid: {
    color: colors.primary,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  historyButton: {
    flex: 1,
  },
  payButton: {
    flex: 1,
  },
});
