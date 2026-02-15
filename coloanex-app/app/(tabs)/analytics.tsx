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
  Modal,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { LineChart, PieChart } from "react-native-chart-kit";
import { Card } from "@/components/ui";
import { spacing, typography, borderRadius } from "@/constants/theme";
import analyticsApi, {
  BorrowerAnalytics,
  MonthlyData,
  StatusData,
} from "@/api/analyticsApi";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

const screenWidth = Dimensions.get("window").width;

export default function AnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
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
          <Text style={[styles.statTitle, { color: colors.textSecondary }]}>
            {title}
          </Text>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
          {subtitle && (
            <Text style={[styles.statSubtitle, { color: colors.textLight }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
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
                          width: `${(analytics.totalPaid / analytics.totalBorrowed) * 100}%`,
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

        {monthlyLoans.length > 0 && (
          <Card style={styles.chartCard}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Loan Applications Trend
            </Text>
            <View style={styles.chartContainer}>
              <LineChart
                data={lineChartData}
                width={screenWidth - 64}
                height={200}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines={false}
                withOuterLines={true}
                withVerticalLines={false}
                withHorizontalLines={true}
                withDots={true}
                withShadow={false}
                fromZero={true}
              />
            </View>
          </Card>
        )}

        {loansByStatus.length > 0 && (
          <Card style={styles.chartCard}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Loans by Status
            </Text>
            <View style={styles.pieChartWrapper}>
              <View style={styles.pieChartContainer}>
                <PieChart
                  data={pieChartData}
                  width={screenWidth - 64}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="count"
                  backgroundColor="transparent"
                  paddingLeft="0"
                  hasLegend={false}
                  style={styles.chart}
                  absolute
                  center={[(screenWidth - 64) / 4, 0]}
                />
              </View>
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
                    <Text style={[styles.legendText, { color: colors.text }]}>
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

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      backgroundColor: colors.card,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
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
      color: colors.text,
      fontWeight: "700",
    },
    statSubtitle: {
      ...typography.caption,
      color: colors.textSecondary,
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
      padding: spacing.lg,
      marginBottom: spacing.md,
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
      padding: spacing.lg,
      marginBottom: spacing.md,
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
  });
