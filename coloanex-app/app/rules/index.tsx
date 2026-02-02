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
import { Card, Button } from "@/components/ui";
import { colors, spacing, typography, borderRadius } from "@/constants/theme";
import { rulesApi } from "@/api";
import type { Rule } from "@/types";

export default function RulesScreen() {
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Loan Rules</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.subtitle}>
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
                <Text style={styles.ruleName}>{rule.name}</Text>
                <View style={styles.ruleTypeBadge}>
                  <Text style={styles.ruleTypeText}>
                    {rule.ruleType.replace(/_/g, " ")}
                  </Text>
                </View>
              </View>
              {rule.isActive && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              )}
            </View>

            {rule.description && (
              <Text style={styles.ruleDescription}>{rule.description}</Text>
            )}

            <View style={styles.ruleDetails}>
              <View style={styles.detailRow}>
                <Ionicons
                  name="trending-up"
                  size={16}
                  color={colors.textLight}
                />
                <Text style={styles.detailLabel}>Interest Rate</Text>
                <Text style={styles.detailValue}>{rule.interestRate}%</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="cash" size={16} color={colors.textLight} />
                <Text style={styles.detailLabel}>Loan Amount</Text>
                <Text style={styles.detailValue}>
                  NPR {rule.loanLimits.minAmount.toLocaleString()} - NPR{" "}
                  {rule.loanLimits.maxAmount.toLocaleString()}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="calendar" size={16} color={colors.textLight} />
                <Text style={styles.detailLabel}>Loan Term</Text>
                <Text style={styles.detailValue}>
                  {rule.loanLimits.minTermMonths} -{" "}
                  {rule.loanLimits.maxTermMonths} months
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="warning" size={16} color={colors.textLight} />
                <Text style={styles.detailLabel}>Late Penalty</Text>
                <Text style={styles.detailValue}>
                  {rule.penaltyConfig.penaltyType === "PERCENTAGE"
                    ? `${rule.penaltyConfig.penaltyAmount}%`
                    : `NPR ${rule.penaltyConfig.penaltyAmount}`}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="time" size={16} color={colors.textLight} />
                <Text style={styles.detailLabel}>Grace Period</Text>
                <Text style={styles.detailValue}>
                  {rule.penaltyConfig.gracePeriodDays} days
                </Text>
              </View>
            </View>

            {rule.paymentConfig.allowEarlyPayment && (
              <View style={styles.earlyPaymentInfo}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.success}
                />
                <Text style={styles.earlyPaymentText}>
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
            <Text style={styles.emptyText}>No loan rules available</Text>
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
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
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
    color: colors.text,
    marginBottom: spacing.xs,
  },
  ruleTypeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.textLight + "20",
    borderRadius: borderRadius.sm,
  },
  ruleTypeText: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: "capitalize",
  },
  activeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.success + "20",
    borderRadius: borderRadius.sm,
  },
  activeBadgeText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: "600" as any,
  },
  ruleDescription: {
    fontSize: 14,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500" as any,
    color: colors.text,
  },
  earlyPaymentInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.success + "10",
    borderRadius: borderRadius.sm,
  },
  earlyPaymentText: {
    fontSize: 14,
    color: colors.success,
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
