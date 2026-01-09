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
import { Card } from "@/components/ui";
import { colors, spacing, typography, borderRadius } from "@/constants/theme";
import { lendersApi } from "@/api";
import type { Lender } from "@/types";

const FILTERS = ["All", "Active", "Inactive"];

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

  const filteredLenders = lenders.filter((lender) => {
    if (selectedFilter === "All") return true;
    if (selectedFilter === "Active") return lender.isActive;
    if (selectedFilter === "Inactive") return !lender.isActive;
    return true;
  });

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
        {filteredLenders.map((lender) => (
          <TouchableOpacity
            key={lender.id}
            onPress={() =>
              router.push({
                pathname: "/lenders/lender-details",
                params: { id: lender.id },
              })
            }
          >
            <Card style={styles.lenderCard}>
              <View style={styles.lenderHeader}>
                <View style={styles.lenderIcon}>
                  <Ionicons name="business" size={32} color={colors.primary} />
                </View>
                <View style={styles.lenderInfo}>
                  <Text style={styles.lenderName}>{lender.name}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      lender.isActive && styles.statusBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        lender.isActive && styles.statusTextActive,
                      ]}
                    >
                      {lender.isActive ? "Active" : "Inactive"}
                    </Text>
                  </View>
                </View>
              </View>

              {(lender.contactEmail ||
                lender.contactPhone ||
                lender.address) && (
                <View style={styles.contactInfo}>
                  {lender.contactEmail && (
                    <View style={styles.contactRow}>
                      <Ionicons
                        name="mail-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.contactText}>
                        {lender.contactEmail}
                      </Text>
                    </View>
                  )}
                  {lender.contactPhone && (
                    <View style={styles.contactRow}>
                      <Ionicons
                        name="call-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.contactText}>
                        {lender.contactPhone}
                      </Text>
                    </View>
                  )}
                  {lender.address && (
                    <View style={styles.contactRow}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.contactText} numberOfLines={1}>
                        {lender.address}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={styles.viewButton}
                onPress={() =>
                  router.push({
                    pathname: "/lenders/lender-details",
                    params: { id: lender.id },
                  })
                }
              >
                <Text style={styles.viewButtonText}>View Details</Text>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={colors.background}
                />
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
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    borderWidth: 2,
    borderColor: "transparent",
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: "600",
  },
  filterTextActive: {
    color: colors.background,
    fontWeight: "700",
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
  lenderIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
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
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignSelf: "flex-start",
  },
  statusBadgeActive: {
    backgroundColor: colors.primaryLight,
  },
  statusText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  statusTextActive: {
    color: colors.primary,
  },
  viewButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  viewButtonText: {
    ...typography.bodySmall,
    color: colors.background,
    fontWeight: "700",
    marginRight: spacing.xs,
  },
  contactInfo: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  contactText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    flex: 1,
  },
});
