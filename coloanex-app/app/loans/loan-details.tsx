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
import { spacing, typography, borderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { loansApi } from "@/api";
import type { Loan, PaymentSchedule } from "@/types";
import { formatCurrency } from "@/utils/currency";

export default function LoanDetailsScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
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

  const principalAmount = loan.approvedAmount ?? loan.requestedAmount;
  const monthlyPayment = loan.monthlyPayment || 0;
  const remainingBalance = loan.remainingBalance ?? principalAmount;
  const paidAmount = principalAmount - remainingBalance;
  const progressPercent =
    principalAmount > 0 ? (paidAmount / principalAmount) * 100 : 0;

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
          Loan Details
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.headerCard}>
          <View style={styles.lenderHeader}>
            <LenderLogo
              name={loan.borrower?.tenant?.name || "Lender"}
              size={56}
              verified
            />
            <View style={styles.lenderInfo}>
              <Text style={[styles.lenderName, { color: colors.text }]}>
                {loan.borrower?.tenant?.name || "Lender"}
              </Text>
              <Text style={[styles.loanType, { color: colors.textSecondary }]}>
                Personal Loan • {loan.status}
              </Text>
            </View>
          </View>
          <Text style={[styles.loanNumber, { color: colors.textLight }]}>
            Loan #{loan.id.slice(0, 8)}
          </Text>
        </Card>

        <Card style={styles.overviewCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Loan Overview
          </Text>
          <Text style={[styles.amount, { color: colors.text }]}>
            {formatCurrency(principalAmount)}
          </Text>

          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Requested Term
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {loan.requestedTermMonths} months
              </Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Status
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {loan.status}
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Monthly Payment
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatCurrency(monthlyPayment)}
              </Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Remaining Balance
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatCurrency(remainingBalance)}
              </Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Repayment Progress
          </Text>
          <View
            style={[styles.progressBar, { backgroundColor: colors.border }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressText, { color: colors.text }]}>
              Paid {formatCurrency(paidAmount)}
            </Text>
            <Text style={[styles.progressText, { color: colors.text }]}>
              Remaining {formatCurrency(remainingBalance)}
            </Text>
          </View>
          <Text
            style={[styles.paymentsCompleted, { color: colors.textSecondary }]}
          >
            {loan.paymentsMade || 0} of {loan.totalPayments || 0} payments
            completed
          </Text>
        </Card>

        {loan.nextPaymentDate && (
          <Card
            style={[
              styles.nextPaymentCard,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            <Text style={[styles.nextPaymentLabel, { color: colors.primary }]}>
              Next Payment Due
            </Text>
            <Text style={[styles.nextPaymentDate, { color: colors.primary }]}>
              {new Date(loan.nextPaymentDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
            <Text style={[styles.daysRemaining, { color: colors.primary }]}>
              {Math.ceil(
                (new Date(loan.nextPaymentDate).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24),
              )}{" "}
              days remaining
            </Text>
          </Card>
        )}

        <View style={styles.scheduleHeader}>
          <Text style={[styles.scheduleTitle, { color: colors.text }]}>
            Payment Schedule
          </Text>
        </View>

        {schedule.map((payment, index) => (
          <Card key={index} style={styles.scheduleCard}>
            <View style={styles.scheduleRow}>
              <View>
                <Text style={[styles.scheduleDate, { color: colors.text }]}>
                  {new Date(payment.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
                <Text
                  style={[styles.scheduleType, { color: colors.textSecondary }]}
                >
                  Monthly Payment
                </Text>
              </View>
              <View style={styles.scheduleRight}>
                <Text style={[styles.scheduleAmount, { color: colors.text }]}>
                  {formatCurrency(payment.totalAmount)}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        payment.status === "PAID"
                          ? colors.primaryLight
                          : colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          payment.status === "PAID"
                            ? colors.primary
                            : colors.textSecondary,
                      },
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Additional Details
          </Text>
          <View
            style={[styles.detailRow, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Purpose
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {loan.purpose}
            </Text>
          </View>
          <View
            style={[styles.detailRow, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Created Date
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {new Date(loan.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </View>
          <View
            style={[styles.detailRow, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Updated Date
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {new Date(loan.updatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </View>
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
      marginBottom: spacing.md,
    },
    lenderInfo: {
      flex: 1,
      marginLeft: spacing.md,
      justifyContent: "center",
    },
    lenderName: {
      ...typography.h3,
      marginBottom: 4,
    },
    loanType: {
      ...typography.bodySmall,
    },
    loanNumber: {
      ...typography.caption,
    },
    overviewCard: {
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography.body,
      fontWeight: "600",
      marginBottom: spacing.md,
    },
    amount: {
      ...typography.h1,
      fontSize: 36,
      marginBottom: spacing.md,
    },
    statsGrid: {
      flexDirection: "row",
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    statBox: {
      flex: 1,
      padding: spacing.md,
      borderRadius: borderRadius.md,
    },
    statLabel: {
      ...typography.caption,
      marginBottom: 4,
    },
    statValue: {
      ...typography.body,
      fontWeight: "600",
    },
    progressBar: {
      height: 12,
      borderRadius: borderRadius.full,
      overflow: "hidden",
      marginBottom: spacing.sm,
    },
    progressFill: {
      height: "100%",
    },
    progressInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: spacing.xs,
    },
    progressText: {
      ...typography.bodySmall,
      fontWeight: "600",
    },
    paymentsCompleted: {
      ...typography.caption,
    },
    nextPaymentCard: {
      marginBottom: spacing.md,
    },
    nextPaymentLabel: {
      ...typography.bodySmall,
      marginBottom: spacing.xs,
    },
    nextPaymentDate: {
      ...typography.h2,
      marginBottom: spacing.xs,
    },
    daysRemaining: {
      ...typography.caption,
    },
    scheduleHeader: {
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    scheduleTitle: {
      ...typography.h3,
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
      marginBottom: 4,
    },
    scheduleType: {
      ...typography.caption,
    },
    scheduleRight: {
      alignItems: "flex-end",
    },
    scheduleAmount: {
      ...typography.body,
      fontWeight: "600",
      marginBottom: 4,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: borderRadius.sm,
    },
    statusBadgePaid: {},
    statusBadgeScheduled: {},
    statusText: {
      ...typography.caption,
    },
    statusTextPaid: {},
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
    },
    detailLabel: {
      ...typography.body,
    },
    detailValue: {
      ...typography.body,
      fontWeight: "600",
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
