import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Card, Button } from "@/components/ui";
import AppHeader from "@/components/ui/AppHeader";
import { spacing, borderRadius } from "@/constants/theme";
import { subscriptionsApi } from "@/api";
import { useTheme } from "@/hooks/useTheme";

export default function ProfileSubscriptionsScreen() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const toneBySubscription = (scope: string, status: string) => {
    const normalizedScope = String(scope || "").toUpperCase();
    const normalizedStatus = String(status || "").toUpperCase();
    const active = normalizedStatus === "ACTIVE";

    if (normalizedScope === "TENANT") {
      return {
        backgroundColor: isDark ? "#281842" : "#F3E8FF",
        borderColor: isDark ? "#7C3AED" : "#A855F7",
        scopeChipBg: isDark ? "#7C3AED" : "#8B5CF6",
        scopeChipText: "#FFFFFF",
        statusChipBg: active
          ? isDark
            ? "#14532D"
            : "#DCFCE7"
          : isDark
            ? "#7F1D1D"
            : "#FEE2E2",
        statusChipText: active
          ? isDark
            ? "#86EFAC"
            : "#166534"
          : isDark
            ? "#FCA5A5"
            : "#B91C1C",
      };
    }

    return {
      backgroundColor: isDark ? "#10263B" : "#E0F2FE",
      borderColor: isDark ? "#2563EB" : "#60A5FA",
      scopeChipBg: isDark ? "#2563EB" : "#1D4ED8",
      scopeChipText: "#FFFFFF",
      statusChipBg: active
        ? isDark
          ? "#14532D"
          : "#DCFCE7"
        : isDark
          ? "#7F1D1D"
          : "#FEE2E2",
      statusChipText: active
        ? isDark
          ? "#86EFAC"
          : "#166534"
        : isDark
          ? "#FCA5A5"
          : "#B91C1C",
    };
  };

  const loadData = useCallback(async () => {
    try {
      const data = await subscriptionsApi.listMine().catch(() => []);
      setSubscriptions(data);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const selectSubscription = async (id: string) => {
    try {
      setSelectingId(id);
      await subscriptionsApi.select(id);
      await loadData();
    } finally {
      setSelectingId(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.surface }]}
    >
      <AppHeader title="Subscriptions" showThemeToggle={false} />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
          />
        }
      >
        <Card style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            My Subscriptions
          </Text>
          {subscriptions.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No subscriptions yet.
            </Text>
          ) : (
            subscriptions.map((sub) => {
              const tone = toneBySubscription(sub.scope, sub.status);
              const maxTransactions = Number(sub.planRef?.maxTransactions || 0);
              const usedTransactions = Number(sub.usageCount || 0);
              const remainingTransactions =
                maxTransactions > 0
                  ? Math.max(maxTransactions - usedTransactions, 0)
                  : null;
              const endsAtDate = sub.endsAt ? new Date(sub.endsAt) : null;
              const lifecycleStatus = sub.lifecycleStatus || "EXPIRED";
              const isExpired = lifecycleStatus === "EXPIRED";
              const isLimitExceeded = lifecycleStatus === "LIMIT_EXCEEDED";
              const isBought = lifecycleStatus === "BOUGHT";

              return (
                <View
                  key={sub.id}
                  style={[
                    styles.item,
                    {
                      borderColor: tone.borderColor,
                      backgroundColor: tone.backgroundColor,
                    },
                  ]}
                >
                  <View style={styles.itemTopRow}>
                    <View
                      style={[
                        styles.scopeChip,
                        { backgroundColor: tone.scopeChipBg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.scopeChipText,
                          { color: tone.scopeChipText },
                        ]}
                      >
                        {sub.scope}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusChip,
                        { backgroundColor: tone.statusChipBg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          { color: tone.statusChipText },
                        ]}
                      >
                        {isBought
                          ? "BOUGHT"
                          : isLimitExceeded
                            ? "LIMIT EXCEEDED"
                            : "EXPIRED"}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.planName, { color: colors.text }]}>
                    {sub.plan}
                  </Text>
                  {sub.isSelected ? (
                    <Text
                      style={[styles.detailText, { color: colors.primary }]}
                    >
                      Selected for transactions
                    </Text>
                  ) : null}

                  <View style={styles.metricsRow}>
                    <View
                      style={[styles.metricBox, { borderColor: colors.border }]}
                    >
                      <Text
                        style={[
                          styles.metricLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Used
                      </Text>
                      <Text
                        style={[styles.metricValue, { color: colors.text }]}
                      >
                        {usedTransactions}
                      </Text>
                    </View>
                    <View
                      style={[styles.metricBox, { borderColor: colors.border }]}
                    >
                      <Text
                        style={[
                          styles.metricLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Remaining
                      </Text>
                      <Text
                        style={[styles.metricValue, { color: colors.text }]}
                      >
                        {remainingTransactions === null
                          ? "Unlimited"
                          : remainingTransactions}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text
                      style={[
                        styles.detailText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Max: {maxTransactions > 0 ? maxTransactions : "Unlimited"}
                    </Text>
                    <Text
                      style={[
                        styles.detailText,
                        {
                          color: isExpired
                            ? colors.error
                            : isLimitExceeded
                              ? "#D97706"
                              : colors.success,
                        },
                      ]}
                    >
                      {isExpired
                        ? "Expired"
                        : isLimitExceeded
                          ? "Limit Exceeded"
                          : sub.endsAt
                            ? `Valid till ${new Date(sub.endsAt).toLocaleDateString()}`
                            : "No expiry"}
                    </Text>
                  </View>
                  {isBought && !sub.isSelected ? (
                    <Button
                      title={
                        selectingId === sub.id
                          ? "Selecting..."
                          : "Use This Subscription"
                      }
                      onPress={() => selectSubscription(sub.id)}
                      style={styles.manageButton}
                    />
                  ) : null}
                </View>
              );
            })
          )}
          <Button
            title="Manage Plans"
            onPress={() => router.push("/pricing")}
            style={styles.manageButton}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, padding: spacing.md },
    card: { padding: spacing.md },
    sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: spacing.sm },
    emptyText: {
      fontSize: 13,
      lineHeight: 18,
    },
    item: {
      borderWidth: 1,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginTop: spacing.sm,
    },
    itemTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.xs,
    },
    scopeChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
    },
    scopeChipText: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    statusChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
    },
    statusChipText: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    planName: {
      fontSize: 16,
      fontWeight: "800",
    },
    metricsRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    metricBox: {
      flex: 1,
      borderWidth: 1,
      borderRadius: borderRadius.sm,
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    metricLabel: {
      fontSize: 11,
      fontWeight: "600",
    },
    metricValue: {
      fontSize: 16,
      fontWeight: "800",
      marginTop: 2,
    },
    detailRow: {
      marginTop: spacing.xs,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    detailText: {
      fontSize: 12,
      fontWeight: "600",
    },
    manageButton: {
      marginTop: spacing.md,
      backgroundColor: colors.primary,
    },
  });
