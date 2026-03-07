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
import { router } from "expo-router";
import { Card, Button, AppHeader } from "@/components/ui";
import { spacing, typography, borderRadius } from "@/constants/theme";
import { rulesApi } from "@/api";
import type { Rule } from "@/types";
import { useTheme } from "@/hooks/useTheme";

export default function RulesScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRules = async () => {
    try {
      const data = await rulesApi.getAll();
      setRules(data);
    } catch (error) {
      console.error("Failed to load rules:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadRules();
  };

  const getRuleTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      STANDARD: "document-text",
      PREMIUM: "star",
      MICRO_LOAN: "cash",
      BUSINESS_LOAN: "business",
    };
    return icons[type] || "document-text";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Loan Rules" showThemeToggle={false} />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Browse available loan rules and configurations
        </Text>

        {rules.map((rule) => (
          <Card key={rule.id} style={styles.ruleCard}>
            <View style={styles.ruleHeader}>
              <View
                style={[
                  styles.ruleIcon,
                  {
                    backgroundColor: rule.isActive
                      ? colors.primary + "20"
                      : colors.textLight + "20",
                  },
                ]}
              >
                <Ionicons
                  name={getRuleTypeIcon(rule.ruleType) as any}
                  size={24}
                  color={rule.isActive ? colors.primary : colors.textLight}
                />
              </View>
              <View style={styles.ruleInfo}>
                <Text style={[styles.ruleName, { color: colors.text }]}>
                  {rule.name}
                </Text>
                <View
                  style={[
                    styles.ruleTypeBadge,
                    { backgroundColor: colors.textLight + "20" },
                  ]}
                >
                  <Text
                    style={[
                      styles.ruleTypeText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {rule.ruleType.replace(/_/g, " ")}
                  </Text>
                </View>
              </View>
              {rule.isActive && (
                <View
                  style={[
                    styles.activeBadge,
                    { backgroundColor: colors.success + "20" },
                  ]}
                >
                  <Text
                    style={[styles.activeBadgeText, { color: colors.success }]}
                  >
                    Active
                  </Text>
                </View>
              )}
            </View>

            {rule.description && (
              <Text
                style={[
                  styles.ruleDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {rule.description}
              </Text>
            )}

            <View style={styles.ruleDetails}>
              <View style={styles.detailRow}>
                <Ionicons
                  name="trending-up"
                  size={16}
                  color={colors.textLight}
                />
                <Text
                  style={[styles.detailLabel, { color: colors.textSecondary }]}
                >
                  Interest Rate
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {rule.interestRate}%
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="cash" size={16} color={colors.textLight} />
                <Text
                  style={[styles.detailLabel, { color: colors.textSecondary }]}
                >
                  Loan Amount
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  NPR {rule.loanLimits.minAmount.toLocaleString()} - NPR{" "}
                  {rule.loanLimits.maxAmount.toLocaleString()}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="calendar" size={16} color={colors.textLight} />
                <Text
                  style={[styles.detailLabel, { color: colors.textSecondary }]}
                >
                  Loan Term
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {rule.loanLimits.minTermMonths} -{" "}
                  {rule.loanLimits.maxTermMonths} months
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="warning" size={16} color={colors.textLight} />
                <Text
                  style={[styles.detailLabel, { color: colors.textSecondary }]}
                >
                  Late Penalty
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {rule.penaltyConfig.penaltyType === "PERCENTAGE"
                    ? `${rule.penaltyConfig.penaltyAmount}%`
                    : `NPR ${rule.penaltyConfig.penaltyAmount}`}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="time" size={16} color={colors.textLight} />
                <Text
                  style={[styles.detailLabel, { color: colors.textSecondary }]}
                >
                  Grace Period
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {rule.penaltyConfig.gracePeriodDays} days
                </Text>
              </View>
            </View>

            {rule.paymentConfig.allowEarlyPayment && (
              <View
                style={[
                  styles.earlyPaymentInfo,
                  { backgroundColor: colors.success + "10" },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.success}
                />
                <Text
                  style={[styles.earlyPaymentText, { color: colors.success }]}
                >
                  Early payment allowed
                  {rule.paymentConfig.earlyPaymentPenalty
                    ? ` (${rule.paymentConfig.earlyPaymentPenalty}% penalty)`
                    : ""}
                </Text>
              </View>
            )}
          </Card>
        ))}

        {rules.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons
              name="document-text-outline"
              size={64}
              color={colors.textLight}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No loan rules available
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
    subtitle: {
      fontSize: 14,
      marginBottom: spacing.lg,
    },
    ruleCard: {
      marginBottom: spacing.md,
    },
    ruleHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    ruleIcon: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.lg,
      justifyContent: "center",
      alignItems: "center",
      marginRight: spacing.md,
    },
    ruleInfo: {
      flex: 1,
    },
    ruleName: {
      fontSize: 16,
      fontWeight: "600" as any,
      marginBottom: spacing.xs,
    },
    ruleTypeBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
    },
    ruleTypeText: {
      fontSize: 12,
      textTransform: "capitalize",
    },
    activeBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: borderRadius.sm,
    },
    activeBadgeText: {
      fontSize: 12,
      fontWeight: "600" as any,
    },
    ruleDescription: {
      fontSize: 14,
      marginBottom: spacing.md,
    },
    ruleDetails: {
      gap: spacing.sm,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    detailLabel: {
      flex: 1,
      fontSize: 14,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: "500" as any,
    },
    earlyPaymentInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginTop: spacing.md,
      padding: spacing.sm,
      borderRadius: borderRadius.sm,
    },
    earlyPaymentText: {
      fontSize: 14,
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
