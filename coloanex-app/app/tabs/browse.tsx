import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Card, LenderLogo } from "@/components/ui";
import { colors, spacing, typography, borderRadius } from "@/constants/theme";
import { lendersApi } from "@/api";
import type { Lender } from "@/types";
import { formatCurrencyShort } from "@/utils/currency";

const FILTERS = ["All", "Low Interest", "Fast Approval", "High Amount"];

export default function BrowseScreen() {
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchVisible, setSearchVisible] = useState(false);

  const loadLenders = async () => {
    try {
      const data = await lendersApi.getAll();
      setLenders(data);
    } catch (error) {
      console.error("Failed to load lenders:", error);
    }
  };

  useEffect(() => {
    loadLenders();
  }, []);

  const formatAmount = (min: number, max: number) => {
    return `${formatCurrencyShort(min)}-${formatCurrencyShort(max)}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Browse Lenders</Text>
        <TouchableOpacity onPress={() => setSearchVisible(!searchVisible)}>
          <Ionicons name="search" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              selectedFilter === filter && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                  size={48}
                  verified={lender.verified}
                />
                <View style={styles.lenderInfo}>
                  <Text style={styles.lenderName}>{lender.name}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color={colors.warning} />
                    <Text style={styles.rating}>
                      {(lender.rating || 0).toFixed(1)}
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
                    {formatAmount(lender.minAmount || 0, lender.maxAmount || 0)}
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
              </TouchableOpacity>
            </Card>
          </TouchableOpacity>
        ))}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  filterContainer: {
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    maxHeight: 60,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: "500",
  },
  filterTextActive: {
    color: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
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
  lenderName: {
    ...typography.h3,
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
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
    ...typography.body,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  responseTime: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  responseTimeText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  viewButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  viewButtonText: {
    ...typography.bodySmall,
    color: colors.background,
    fontWeight: "600",
  },
});
