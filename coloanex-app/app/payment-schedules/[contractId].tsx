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
import { router, useLocalSearchParams } from "expo-router";
import { Card } from "@/components/ui";
import { colors, spacing, typography, borderRadius } from "@/constants/theme";
import { paymentSchedulesApi } from "@/api";
import type { PaymentSchedule } from "@/api/paymentSchedulesApi";
import { formatCurrency } from "@/utils/currency";

export default function PaymentSchedulesScreen() {
  const { contractId } = useLocalSearchParams<{ contractId: string }>();
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSchedules = async () => {
    if (!contractId) return;
    try {
      const data = await paymentSchedulesApi.getByContract(contractId);
      setSchedules(data);
    } catch (error) {
      console.error("Failed to load payment schedules:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, [contractId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSchedules();
  };

  const getStatusColor = (status: string) => {
    const colors_map: Record<string, string> = {
      PENDING: colors.textLight,
      PAID: colors.success,
      OVERDUE: colors.error,
      PARTIAL: colors.warning,
    };
    return colors_map[status] || colors.textLight;
  };

  const totalScheduled = schedules.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalPaid = schedules.reduce((sum, s) => sum + s.amountPaid, 0);
  const totalPending = totalScheduled - totalPaid;
  const overdueCount = schedules.filter((s) => s.status === "OVERDUE").length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Payment Schedule</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.summarySection}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Scheduled</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(totalScheduled)}
            </Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Paid</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {formatCurrency(totalPaid)}
            </Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={[styles.summaryValue, { color: colors.warning }]}>
              {formatCurrency(totalPending)}
            </Text>
          </Card>
        </View>

        {overdueCount > 0 && (
          <View style={styles.overdueAlert}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={styles.overdueText}>
              You have {overdueCount} overdue payment
              {overdueCount > 1 ? "s" : ""}
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Payment Schedule</Text>

        {schedules.map((schedule, index) => (
          <Card key={schedule.id} style={styles.scheduleCard}>
            <View style={styles.scheduleHeader}>
              <View style={styles.installmentNumber}>
                <Text style={styles.installmentText}>#{index + 1}</Text>
              </View>
              <View style={styles.scheduleInfo}>
                <Text style={styles.dueDate}>
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
                <Text style={styles.breakdownLabel}>Principal</Text>
                <Text style={styles.breakdownValue}>
                  {formatCurrency(schedule.principalAmount)}
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Interest</Text>
                <Text style={styles.breakdownValue}>
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
              <View style={[styles.breakdownRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(schedule.totalAmount)}
                </Text>
              </View>
            </View>

            {schedule.amountPaid > 0 && (
              <View style={styles.paidSection}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.success}
                />
                <Text style={styles.paidText}>
                  Paid: {formatCurrency(schedule.amountPaid)}
                </Text>
                {schedule.paidAt && (
                  <Text style={styles.paidDate}>
                    on {new Date(schedule.paidAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
            )}

            {schedule.status === "PENDING" || schedule.status === "OVERDUE" ? (
              <TouchableOpacity
                style={[
                  styles.payButton,
                  schedule.status === "OVERDUE" && styles.payButtonOverdue,
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
            <Text style={styles.emptyText}>No payment schedule found</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.text,
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
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700" as any,
    color: colors.text,
  },
  overdueAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.error + "10",
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  overdueText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: "600" as any,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as any,
    color: colors.text,
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
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  installmentText: {
    fontSize: 14,
    fontWeight: "700" as any,
    color: colors.primary,
  },
  scheduleInfo: {
    flex: 1,
  },
  dueDate: {
    fontSize: 14,
    color: colors.text,
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
    color: colors.textSecondary,
  },
  breakdownValue: {
    fontSize: 14,
    color: colors.text,
  },
  totalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600" as any,
    color: colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700" as any,
    color: colors.primary,
  },
  paidSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.success + "10",
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  paidText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: "600" as any,
  },
  paidDate: {
    fontSize: 12,
    color: colors.success,
  },
  payButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  payButtonOverdue: {
    backgroundColor: colors.error,
  },
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
    color: colors.textSecondary,
  },
});
