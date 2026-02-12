import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LineChart, PieChart } from "react-native-chart-kit";
import { Card } from "@/components/ui";
import { colors, spacing, typography, borderRadius } from "@/constants/theme";
import analyticsApi, {
  BorrowerAnalytics,
  MonthlyData,
  StatusData,
} from "@/api/analyticsApi";
import { Ionicons } from "@expo/vector-icons";

const screenWidth = Dimensions.get("window").width;

export default function AnalyticsScreen() {
  const [analytics, setAnalytics] = useState<BorrowerAnalytics | null>(null);
  const [monthlyLoans, setMonthlyLoans] = useState<MonthlyData[]>([]);
  const [loansByStatus, setLoansByStatus] = useState<StatusData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 6)),
  );
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const loadAnalytics = async () => {
    try {
      const monthsDiff = Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
      );
      const months = monthsDiff > 0 ? monthsDiff : 1;
      const [analyticsData, monthlyData, statusData] = await Promise.all([
        analyticsApi.getBorrowerAnalytics(),
        analyticsApi.getMonthlyLoans(months),
        analyticsApi.getLoansByStatus(),
      ]);

      setAnalytics(analyticsData);
      setMonthlyLoans(monthlyData);
      setLoansByStatus(statusData);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [startDate, endDate]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForLabels: {
      fontFamily: "System",
    },
  };

  const lineChartData = {
    labels: monthlyLoans.map((item) => item.month.split(" ")[0]),
    datasets: [
      {
        data: monthlyLoans.map((item) => item.count),
      },
    ],
  };

  const pieChartData = loansByStatus.map((item, index) => ({
    name: item.status,
    count: item.count,
    color: [
      colors.primary,
      colors.primaryDark,
      colors.success,
      colors.warning,
      colors.error,
      "#86EFAC",
    ][index % 6],
    legendFontColor: colors.text,
    legendFontSize: 14,
  }));

  const StatCard = ({ title, value, icon, color, subtitle }: any) => (
    <Card style={styles.statCard}>
      <View style={styles.statContent}>
        <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
          {icon === "rupee" ? (
            <Text style={[styles.rupeeIcon, { color }]}>{"\u20B9"}</Text>
          ) : (
            <Ionicons name={icon} size={24} color={color} />
          )}
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>Your financial overview</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {analytics && (
          <>
            <StatCard
              title="Total Loans"
              value={analytics.totalLoans}
              icon="document-text"
              color={colors.primary}
            />
            <StatCard
              title="Active Loans"
              value={analytics.activeLoans}
              icon="checkmark-circle"
              color={colors.success}
            />
            <StatCard
              title="Total Borrowed"
              value={`NPR ${(analytics.totalBorrowed / 1000).toFixed(0)}K`}
              icon="rupee"
              color={colors.primary}
              subtitle="Total loan amount"
            />
            <StatCard
              title="Total Paid"
              value={`NPR ${(analytics.totalPaid / 1000).toFixed(0)}K`}
              icon="rupee"
              color={colors.success}
              subtitle="Payments made"
            />
            <StatCard
              title="Pending Amount"
              value={`NPR ${(analytics.pendingAmount / 1000).toFixed(0)}K`}
              icon="rupee"
              color={colors.warning}
              subtitle="Outstanding balance"
            />
            <StatCard
              title="Overdue"
              value={analytics.overduePayments}
              icon="alert-circle"
              color={colors.error}
              subtitle="Late payments"
            />

            {analytics.totalBorrowed > 0 && (
              <Card style={styles.progressCard}>
                <Text style={styles.cardTitle}>Repayment Progress</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${(analytics.totalPaid / analytics.totalBorrowed) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {(
                      (analytics.totalPaid / analytics.totalBorrowed) *
                      100
                    ).toFixed(1)}
                    % Complete
                  </Text>
                </View>
              </Card>
            )}
          </>
        )}

        <Card style={styles.filterCard}>
          <Text style={styles.filterLabel}>Date Range</Text>
          <View style={styles.dateRangeContainer}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.dateButtonText}>
                {startDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            <Text style={styles.dateSeparator}>to</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndPicker(true)}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.dateButtonText}>
                {endDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>
          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, date) => {
                setShowStartPicker(false);
                if (date) setStartDate(date);
              }}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, date) => {
                setShowEndPicker(false);
                if (date) setEndDate(date);
              }}
            />
          )}
        </Card>

        {monthlyLoans.length > 0 && (
          <Card style={styles.chartCard}>
            <Text style={styles.cardTitle}>Loan Applications Trend</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={lineChartData}
                width={Math.max(screenWidth - 64, monthlyLoans.length * 80)}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </ScrollView>
          </Card>
        )}

        {loansByStatus.length > 0 && (
          <Card style={styles.chartCard}>
            <Text style={styles.cardTitle}>Loans by Status</Text>
            <View style={styles.pieChartWrapper}>
              <PieChart
                data={pieChartData}
                width={screenWidth - 48}
                height={screenWidth - 48}
                chartConfig={chartConfig}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="15"
                hasLegend={false}
                style={styles.chart}
                absolute
              />
              <View style={styles.legendContainer}>
                {loansByStatus.map((item, index) => (
                  <View key={item.status} style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendColor,
                        {
                          backgroundColor: [
                            colors.primary,
                            colors.primaryDark,
                            colors.success,
                            colors.warning,
                            colors.error,
                            "#86EFAC",
                          ][index % 6],
                        },
                      ]}
                    />
                    <Text style={styles.legendText}>
                      {item.status}: {item.count}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    ...typography.h2,
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    ...typography.body,
    color: "rgba(255, 255, 255, 0.9)",
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  rupeeIcon: {
    fontSize: 28,
    fontWeight: "700",
  },
  statInfo: {
    flex: 1,
  },
  statTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    ...typography.h3,
    fontWeight: "700",
  },
  statSubtitle: {
    ...typography.caption,
    color: colors.textLight,
    marginTop: 2,
  },
  progressCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  progressText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  filterCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  filterLabel: {
    ...typography.bodySmall,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  dateRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: "#FFFFFF",
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dateButtonText: {
    ...typography.body,
    color: colors.text,
  },
  dateSeparator: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  chartCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  pieChartContainer: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  pieChartWrapper: {
    alignItems: "center",
  },
  legendContainer: {
    marginTop: spacing.md,
    width: "100%",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  legendText: {
    ...typography.body,
    color: colors.text,
  },
});
