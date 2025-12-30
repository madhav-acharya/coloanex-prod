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
import { Card, LenderLogo } from "@/components/ui";
import { colors, spacing, typography } from "@/constants/theme";
import { lendersApi } from "@/api";
import type { Lender } from "@/types";
import { formatCurrencyShort } from "@/utils/currency";

export default function HomeScreen() {
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLenders = async () => {
    try {
      const data = await lendersApi.getAll();
      setLenders(data);
    } catch (error) {
      console.error("Failed to load lenders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLenders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadLenders();
  };

  const formatAmount = (min: number, max: number) => {
    return `${formatCurrencyShort(min)}-${formatCurrencyShort(max)}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to CoLoanex</Text>
        <Text style={styles.subtitle}>Find the best loan options for you</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Lenders</Text>

          {lenders.map((lender) => (
            <TouchableOpacity
              key={lender.id}
              onPress={() => router.push(`/lender/${lender.id}`)}
            >
              <Card style={styles.lenderCard}>
                <View style={styles.lenderHeader}>
                  <LenderLogo
                    logo={lender.logo}
                    name={lender.name}
                    size={56}
                    verified={lender.verified}
                  />
                  <View style={styles.lenderInfo}>
                    <View style={styles.lenderNameRow}>
                      <Text style={styles.lenderName}>{lender.name}</Text>
                    </View>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={16} color={colors.warning} />
                      <Text style={styles.rating}>
                        {(lender.rating || 0).toFixed(1)}
                      </Text>
                      <Text style={styles.reviewCount}>
                        ({(lender.reviewCount || 0).toLocaleString()} reviews)
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.lenderStats}>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>
                      {lender.interestRate || 0}%
                    </Text>
                    <Text style={styles.statLabel}>Interest Rate</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>
                      {formatAmount(
                        lender.minAmount || 0,
                        lender.maxAmount || 0
                      )}
                    </Text>
                    <Text style={styles.statLabel}>Amount</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>
                      {lender.successRate || 0}%
                    </Text>
                    <Text style={styles.statLabel}>Success Rate</Text>
                  </View>
                </View>

                <View style={styles.lenderFooter}>
                  <View style={styles.responseTime}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.responseTimeText}>
                      {lender.responseTime}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => router.push(`/lender/${lender.id}`)}
                  >
                    <Text style={styles.viewButtonText}>View Details</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  lenderCard: {
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
  lenderNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  lenderName: {
    ...typography.h3,
    color: colors.text,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    ...typography.bodySmall,
    fontWeight: "600",
    color: colors.text,
    marginLeft: 4,
  },
  reviewCount: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  lenderStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  lenderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  responseTime: {
    flexDirection: "row",
    alignItems: "center",
  },
  responseTimeText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  viewButtonText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: "600",
    marginRight: spacing.xs,
  },
});
