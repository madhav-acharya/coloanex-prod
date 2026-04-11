import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Card, AppHeader } from "@/components/ui";
import { spacing, borderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { paymentSchedulesApi } from "@/api";
import type { PaymentSchedule } from "@/api/paymentSchedulesApi";
import { formatCurrency } from "@/utils/currency";

export default function PaymentSchedulesScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { contractId } = useLocalSearchParams<{ contractId: string }>();
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSchedules = async () => {
    if (!contractId) return;
    try {
      const data = await paymentSchedulesApi.getByContract(contractId);
      setSchedules(data);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    loadSchedules();
  }, [contractId]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const onRefresh = () => {
    setRefreshing(true);
    loadSchedules();
  };

  const getStatusColor = (status: string) => {
    const colors_map: Record<string, string> = {
      PENDING: colors.textLight,
      PAID: colors.success,
      OVERDUE: colors.error,
      PARTIALLY_PAID: colors.warning,
    };
    return colors_map[status] || colors.textLight;
  };

  const totalScheduled = schedules.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalPaid = schedules.reduce((sum, s) => sum + s.amountPaid, 0);
  const totalPending = totalScheduled - totalPaid;
  const overdueCount = schedules.filter((s) => s.status === "OVERDUE").length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Payment Schedule" showThemeToggle={false} />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.summarySection}>
          <Card style={styles.summaryCard}>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Total Scheduled
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {formatCurrency(totalScheduled)}
            </Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Total Paid
            </Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {formatCurrency(totalPaid)}
            </Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Pending
            </Text>
            <Text style={[styles.summaryValue, { color: colors.warning }]}>
              {formatCurrency(totalPending)}
            </Text>
          </Card>
        </View>

        {overdueCount > 0 && (
          <View
            style={[
              styles.overdueAlert,
              { backgroundColor: colors.error + "10" },
            ]}
          >
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={[styles.overdueText, { color: colors.error }]}>
              You have {overdueCount} overdue payment
              {overdueCount > 1 ? "s" : ""}
            </Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Payment Schedule
        </Text>

        {schedules.map((schedule, index) => (
          <Card key={schedule.id} style={styles.scheduleCard}>
            <View style={styles.scheduleHeader}>
              <View
                style={[
                  styles.installmentNumber,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Text
                  style={[styles.installmentText, { color: colors.primary }]}
                >
                  #{index + 1}
                </Text>
              </View>
              <View style={styles.scheduleInfo}>
                <Text style={[styles.dueDate, { color: colors.text }]}>
                  Due: {new Date(schedule.dueDate).toLocaleDateString()}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(schedule.status) + "20" },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(schedule.status) },
                    ]}
                  >
                    {schedule.status}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.amountBreakdown}>
              <View style={styles.breakdownRow}>
                <Text
                  style={[
                    styles.breakdownLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Principal
                </Text>
                <Text style={[styles.breakdownValue, { color: colors.text }]}>
                  {formatCurrency(schedule.principalAmount)}
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text
                  style={[
                    styles.breakdownLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Interest
                </Text>
                <Text style={[styles.breakdownValue, { color: colors.text }]}>
                  {formatCurrency(schedule.interestAmount)}
                </Text>
              </View>
              {schedule.penaltyAmount > 0 && (
                <View style={styles.breakdownRow}>
                  <Text
                    style={[styles.breakdownLabel, { color: colors.error }]}
                  >
                    Penalty
                  </Text>
                  <Text
                    style={[styles.breakdownValue, { color: colors.error }]}
                  >
                    {formatCurrency(schedule.penaltyAmount)}
                  </Text>
                </View>
              )}
              <View
                style={[
                  styles.breakdownRow,
                  styles.totalRow,
                  { borderTopColor: colors.border },
                ]}
              >
                <Text style={[styles.totalLabel, { color: colors.text }]}>
                  Total Amount
                </Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>
                  {formatCurrency(schedule.totalAmount)}
                </Text>
              </View>
            </View>

            {schedule.amountPaid > 0 && (
              <View
                style={[
                  styles.paidSection,
                  { backgroundColor: colors.success + "10" },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.success}
                />
                <Text style={[styles.paidText, { color: colors.success }]}>
                  Paid: {formatCurrency(schedule.amountPaid)}
                </Text>
                {schedule.paidAt && (
                  <Text style={[styles.paidDate, { color: colors.success }]}>
                    on {new Date(schedule.paidAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
            )}

            {schedule.status === "PENDING" || schedule.status === "OVERDUE" ? (
              <TouchableOpacity
                style={[
                  styles.payButton,
                  {
                    backgroundColor:
                      schedule.status === "OVERDUE"
                        ? colors.error
                        : colors.primary,
                  },
                ]}
                onPress={() =>
                  router.push(
                    `/repayment/make-repayment?scheduleId=${schedule.id}` as any,
                  )
                }
              >
                <Text style={styles.payButtonText}>
                  {schedule.status === "OVERDUE"
                    ? "Pay Now (Overdue)"
                    : "Pay Now"}
                </Text>
              </TouchableOpacity>
            ) : null}
          </Card>
        ))}

        {schedules.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons
              name="calendar-outline"
              size={64}
              color={colors.textLight}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No payment schedule found
            </Text>
          </View>
        )}
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
      padding: spacing.lg,
      borderBottomWidth: 1,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: 20,
      fontWeight: "700" as any,
    },
    content: {
      flex: 1,
      padding: spacing.lg,
    },
    summarySection: {
      flexDirection: "row",
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    summaryCard: {
      flex: 1,
      padding: spacing.md,
    },
    summaryLabel: {
      fontSize: 12,
      marginBottom: spacing.xs,
    },
    summaryValue: {
      fontSize: 16,
      fontWeight: "700" as any,
    },
    overdueAlert: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.lg,
    },
    overdueText: {
      fontSize: 14,
      fontWeight: "600" as any,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600" as any,
      marginBottom: spacing.md,
    },
    scheduleCard: {
      marginBottom: spacing.md,
    },
    scheduleHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    installmentNumber: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.full,
      justifyContent: "center",
      alignItems: "center",
      marginRight: spacing.md,
    },
    installmentText: {
      fontSize: 14,
      fontWeight: "700" as any,
    },
    scheduleInfo: {
      flex: 1,
    },
    dueDate: {
      fontSize: 14,
      marginBottom: spacing.xs,
    },
    statusBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600" as any,
    },
    amountBreakdown: {
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    breakdownRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    breakdownLabel: {
      fontSize: 14,
    },
    breakdownValue: {
      fontSize: 14,
    },
    totalRow: {
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: "600" as any,
    },
    totalValue: {
      fontSize: 16,
      fontWeight: "700" as any,
    },
    paidSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: borderRadius.sm,
      marginBottom: spacing.md,
    },
    paidText: {
      fontSize: 14,
      fontWeight: "600" as any,
    },
    paidDate: {
      fontSize: 12,
    },
    payButton: {
      padding: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: "center",
    },
    payButtonOverdue: {},
    payButtonText: {
      fontSize: 14,
      fontWeight: "600" as any,
      color: "#FFFFFF",
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.xl * 2,
    },
    emptyText: {
      marginTop: spacing.md,
      fontSize: 16,
    },
  });
