import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  useWindowDimensions,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { PieChart } from "react-native-chart-kit";
import { Card, CurrencyIcon } from "@/components/ui";
import { spacing, typography, borderRadius } from "@/constants/theme";
import analyticsApi, {
  BorrowerAnalytics,
  MonthlyData,
  StatusData,
} from "@/api/analyticsApi";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(width - spacing.md * 4, 260);
  const isCompactScreen = width < 360;
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
  const [isSelectingStart, setIsSelectingStart] = useState(true);

  const loadAnalytics = async () => {
    try {
      const monthsDiff = Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
      );
      const months = monthsDiff > 0 ? monthsDiff + 1 : 1;
      const rangeParams = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
      const [analyticsData, monthlyData, statusData] = await Promise.all([
        analyticsApi.getBorrowerAnalytics(rangeParams),
        analyticsApi.getMonthlyLoans(months, rangeParams),
        analyticsApi.getLoansByStatus(rangeParams),
      ]);

      setAnalytics(analyticsData);
      setMonthlyLoans(monthlyData);
      setLoansByStatus(statusData);
    } catch (error) {
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
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForLabels: {
      fontFamily: "System",
    },
  };

  const totalBorrowed = Number(analytics?.totalBorrowed ?? 0) || 0;
  const totalInterest = Number(analytics?.totalInterest ?? 0) || 0;
  const totalAmountDue = Number(analytics?.totalAmountDue ?? 0) || 0;
  const totalPaid = Number(analytics?.totalPaid ?? 0) || 0;
  const outstandingAmount = Math.max(totalAmountDue - totalPaid, 0);
  const repaymentRate =
    totalAmountDue > 0 ? (totalPaid / totalAmountDue) * 100 : 0;
  const averageLoanSize =
    analytics && analytics.totalLoans > 0
      ? totalBorrowed / analytics.totalLoans
      : 0;
  const closedLoans = loansByStatus
    .filter((item) => ["PAID", "REJECTED"].includes(item.status))
    .reduce((sum, item) => sum + item.count, 0);
  const maxStatusCount = Math.max(
    ...loansByStatus.map((item) => item.count),
    1,
  );
  const maxMonthlyAmount = Math.max(
    ...monthlyLoans.map((item) => Number(item.amount || 0)),
    1,
  );

  const statusColors = [
    colors.primary,
    colors.primaryDark,
    colors.success,
    colors.warning,
    colors.error,
    "#86EFAC",
  ];

  const repaymentSplitData = [
    {
      name: "Paid",
      count: Number(totalPaid.toFixed(2)),
      color: colors.success,
      legendFontColor: colors.text,
      legendFontSize: 14,
    },
    {
      name: "Outstanding",
      count: Number(outstandingAmount.toFixed(2)),
      color: colors.warning,
      legendFontColor: colors.text,
      legendFontSize: 14,
    },
  ];

  const StatCard = ({ title, value, icon, color, subtitle }: any) => (
    <Card style={[styles.statCard, isCompactScreen && styles.statCardCompact]}>
      <View style={styles.summaryCardTop}>
        <View style={[styles.summaryIcon, { backgroundColor: `${color}1F` }]}>
          {icon === "rupee" ? (
            <CurrencyIcon size={16} color={color} />
          ) : (
            <Ionicons name={icon} size={16} color={color} />
          )}
        </View>
        <Text
          style={[styles.statLbl, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      <Text
        style={[styles.statNum, { color }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
      >
        {value}
      </Text>

      {subtitle ? (
        <Text
          style={[styles.summarySubText, { color: colors.textLight }]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      ) : null}
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            Your financial overview
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading analytics...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Your financial overview
        </Text>
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
        <Card style={styles.filterCard}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>
            Date Range
          </Text>
          <View style={styles.dateRangeContainer}>
            <TouchableOpacity
              style={[
                styles.dateButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => {
                setIsSelectingStart(true);
                setShowStartPicker(true);
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.dateButtonText, { color: colors.text }]}>
                {startDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            <Text
              style={[styles.dateSeparator, { color: colors.textSecondary }]}
            >
              to
            </Text>
            <TouchableOpacity
              style={[
                styles.dateButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => {
                setIsSelectingStart(false);
                setShowEndPicker(true);
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.dateButtonText, { color: colors.text }]}>
                {endDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>

          <Modal
            visible={showStartPicker || showEndPicker}
            transparent={true}
            animationType="fade"
            onRequestClose={() => {
              setShowStartPicker(false);
              setShowEndPicker(false);
            }}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => {
                setShowStartPicker(false);
                setShowEndPicker(false);
              }}
            >
              <View
                style={[
                  styles.calendarModalContent,
                  { backgroundColor: colors.card },
                ]}
              >
                <View style={styles.calendarHeader}>
                  <Text style={[styles.calendarTitle, { color: colors.text }]}>
                    {isSelectingStart ? "Select Start Date" : "Select End Date"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowStartPicker(false);
                      setShowEndPicker(false);
                    }}
                  >
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <Calendar
                  current={
                    isSelectingStart
                      ? startDate.toISOString().split("T")[0]
                      : endDate.toISOString().split("T")[0]
                  }
                  onDayPress={(day) => {
                    if (isSelectingStart) {
                      setStartDate(new Date(day.dateString));
                      setShowStartPicker(false);
                    } else {
                      setEndDate(new Date(day.dateString));
                      setShowEndPicker(false);
                    }
                  }}
                  markedDates={{
                    [startDate.toISOString().split("T")[0]]: {
                      selected: isSelectingStart,
                      selectedColor: colors.primary,
                    },
                    [endDate.toISOString().split("T")[0]]: {
                      selected: !isSelectingStart,
                      selectedColor: colors.primary,
                    },
                  }}
                  theme={{
                    backgroundColor: colors.card,
                    calendarBackground: colors.card,
                    textSectionTitleColor: colors.textSecondary,
                    selectedDayBackgroundColor: colors.primary,
                    selectedDayTextColor: "#ffffff",
                    todayTextColor: colors.primary,
                    dayTextColor: colors.text,
                    textDisabledColor: colors.textLight,
                    monthTextColor: colors.text,
                    textMonthFontWeight: "bold",
                    textDayFontSize: 16,
                    textMonthFontSize: 18,
                    textDayHeaderFontSize: 14,
                  }}
                  maxDate={
                    isSelectingStart
                      ? endDate.toISOString().split("T")[0]
                      : undefined
                  }
                  minDate={
                    !isSelectingStart
                      ? startDate.toISOString().split("T")[0]
                      : undefined
                  }
                />
              </View>
            </TouchableOpacity>
          </Modal>
        </Card>

        {analytics && (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statItemWrap}>
                <StatCard
                  title="Outstanding"
                  value={outstandingAmount.toLocaleString("en-IN")}
                  icon="wallet"
                  color={colors.warning}
                  subtitle="Remaining to pay"
                />
              </View>
              <View style={styles.statItemWrap}>
                <StatCard
                  title="Repayment Rate"
                  value={`${repaymentRate.toFixed(1)}%`}
                  icon="analytics"
                  color={colors.primaryDark}
                  subtitle="Paid vs amount due"
                />
              </View>
              <View style={styles.statItemWrap}>
                <StatCard
                  title="Overdue Payments"
                  value={analytics.overduePayments}
                  icon="alert-circle"
                  color={colors.error}
                  subtitle="Need action"
                />
              </View>
              <View style={styles.statItemWrap}>
                <StatCard
                  title="Avg Loan Size"
                  value={averageLoanSize.toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}
                  icon="calculator"
                  color={colors.primary}
                  subtitle="Per loan"
                />
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItemWrap}>
                <StatCard
                  title="Loans Closed"
                  value={closedLoans}
                  icon="checkmark-done-circle"
                  color={colors.success}
                  subtitle="Paid or rejected"
                />
              </View>
              <View style={styles.statItemWrap}>
                <StatCard
                  title="Total Interest"
                  value={totalInterest.toLocaleString("en-IN")}
                  icon="rupee"
                  color={colors.primaryDark}
                  subtitle="Interest due"
                />
              </View>
            </View>

            {totalAmountDue > 0 && (
              <Card style={styles.progressCard}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Repayment Progress
                </Text>
                <View style={styles.progressContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { backgroundColor: colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min((totalPaid / totalAmountDue) * 100, 100)}%`,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.progressText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {((totalPaid / totalAmountDue) * 100).toFixed(1)}% Complete
                  </Text>
                </View>
              </Card>
            )}
          </>
        )}

        {totalBorrowed > 0 && (
          <Card style={styles.chartCard}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Paid vs Outstanding
            </Text>
            <View style={styles.pieChartWrapper}>
              <View style={styles.pieChartContainer}>
                <PieChart
                  data={repaymentSplitData}
                  width={chartWidth}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="count"
                  backgroundColor="transparent"
                  paddingLeft="0"
                  hasLegend={false}
                  style={styles.chart}
                  absolute
                  center={[chartWidth / 4, 0]}
                />
              </View>
              <View style={styles.legendContainer}>
                {repaymentSplitData.map((item) => (
                  <View key={item.name} style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendColor,
                        { backgroundColor: item.color },
                      ]}
                    />
                    <Text style={[styles.legendText, { color: colors.text }]}>
                      {item.name}: {item.count.toLocaleString("en-IN")}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>
        )}

        {loansByStatus.length > 0 && (
          <Card style={styles.chartCard}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Status Breakdown
            </Text>
            <View style={styles.statusBreakdownList}>
              {loansByStatus.map((item, index) => {
                const widthPct = Math.max(
                  8,
                  (item.count / maxStatusCount) * 100,
                );
                return (
                  <View key={item.status} style={styles.statusBreakdownRow}>
                    <View style={styles.statusBreakdownHeader}>
                      <Text
                        style={[
                          styles.statusBreakdownLabel,
                          { color: colors.text },
                        ]}
                      >
                        {item.status.replace(/_/g, " ")}
                      </Text>
                      <Text
                        style={[
                          styles.statusBreakdownValue,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {item.count}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBreakdownTrack,
                        { backgroundColor: colors.border },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusBreakdownFill,
                          {
                            width: `${widthPct}%`,
                            backgroundColor:
                              statusColors[index % statusColors.length],
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {monthlyLoans.length > 0 && (
          <Card style={styles.chartCard}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Recent Monthly Activity
            </Text>
            <View style={styles.monthlySnapshotList}>
              {monthlyLoans
                .slice(-4)
                .reverse()
                .map((item) => {
                  const amount = Number(item.amount || 0);
                  const widthPct = Math.max(
                    6,
                    (amount / maxMonthlyAmount) * 100,
                  );
                  return (
                    <View key={item.month} style={styles.monthlySnapshotRow}>
                      <View style={styles.monthlySnapshotHeader}>
                        <Text
                          style={[
                            styles.monthlySnapshotMonth,
                            { color: colors.text },
                          ]}
                        >
                          {item.month}
                        </Text>
                        <Text
                          style={[
                            styles.monthlySnapshotMeta,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {item.count} loans
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.monthlySnapshotTrack,
                          { backgroundColor: colors.border },
                        ]}
                      >
                        <View
                          style={[
                            styles.monthlySnapshotFill,
                            {
                              width: `${widthPct}%`,
                              backgroundColor: colors.primary,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.monthlySnapshotAmount,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {amount.toLocaleString("en-IN")}
                      </Text>
                    </View>
                  );
                })}
            </View>
          </Card>
        )}

        <View style={{ height: 40 }} />
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
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      ...typography.h2,
      color: colors.text,
      fontWeight: "800",
      marginBottom: 4,
    },
    headerSubtitle: {
      ...typography.body,
      color: colors.textSecondary,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.xxl,
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
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: spacing.sm,
      marginBottom: spacing.sm,
    },
    statItemWrap: {
      width: "48.5%",
    },
    statCard: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      marginBottom: spacing.sm,
      borderRadius: borderRadius.lg,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    statCardCompact: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    summaryCardTop: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    summaryIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    statNum: {
      ...typography.h3,
      fontWeight: "800",
      fontSize: 22,
      lineHeight: 30,
    },
    statLbl: {
      fontSize: 12,
      fontWeight: "600",
      flexShrink: 1,
    },
    summarySubText: {
      fontSize: 11,
      fontWeight: "500",
      marginTop: 4,
    },
    progressCard: {
      padding: spacing.md,
      marginBottom: spacing.sm,
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
      borderRadius: borderRadius.full,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
    },
    progressText: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      marginTop: spacing.sm,
      textAlign: "center",
    },
    filterCard: {
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    filterLabel: {
      ...typography.bodySmall,
      color: colors.text,
      fontWeight: "600",
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
      borderRadius: borderRadius.md,
      borderWidth: 1,
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
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.lg,
    },
    calendarModalContent: {
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      width: "100%",
      maxWidth: 400,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    calendarHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    calendarTitle: {
      ...typography.h3,
      fontWeight: "600",
    },
    chartCard: {
      padding: spacing.md,
      marginBottom: spacing.sm,
      overflow: "hidden",
    },
    chartContainer: {
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    pieChartContainer: {
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      width: "100%",
    },
    chart: {
      borderRadius: borderRadius.md,
    },
    pieChartWrapper: {
      alignItems: "center",
      width: "100%",
      overflow: "hidden",
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
    },
    statusBreakdownList: {
      gap: spacing.sm,
    },
    statusBreakdownRow: {
      gap: 6,
    },
    statusBreakdownHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    statusBreakdownLabel: {
      ...typography.bodySmall,
      fontWeight: "600",
      textTransform: "capitalize",
      flex: 1,
      marginRight: spacing.sm,
    },
    statusBreakdownValue: {
      ...typography.bodySmall,
      fontWeight: "700",
    },
    statusBreakdownTrack: {
      height: 8,
      borderRadius: borderRadius.full,
      overflow: "hidden",
    },
    statusBreakdownFill: {
      height: "100%",
      borderRadius: borderRadius.full,
    },
    monthlySnapshotList: {
      gap: spacing.sm,
    },
    monthlySnapshotRow: {
      gap: 6,
    },
    monthlySnapshotHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    monthlySnapshotMonth: {
      ...typography.body,
      fontWeight: "600",
      flex: 1,
    },
    monthlySnapshotMeta: {
      ...typography.caption,
      fontWeight: "600",
    },
    monthlySnapshotTrack: {
      height: 7,
      borderRadius: borderRadius.full,
      overflow: "hidden",
    },
    monthlySnapshotFill: {
      height: "100%",
      borderRadius: borderRadius.full,
    },
    monthlySnapshotAmount: {
      ...typography.caption,
      fontWeight: "500",
    },
  });
