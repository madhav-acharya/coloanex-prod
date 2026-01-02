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
import { Card } from "@/components/ui";
import { colors, spacing, typography } from "@/constants/theme";
import { lendersApi } from "@/api";
import type { Lender } from "@/types";

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
                    <Ionicons
                      name="business"
                      size={32}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.lenderInfo}>
                    <Text style={styles.lenderName}>{lender.name}</Text>
                    <View style={styles.statusRow}>
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
                </View>

                {(lender.contactEmail ||
                  lender.contactPhone ||
                  lender.address) && (
                  <View style={styles.contactInfo}>
                    {lender.contactEmail && (
                      <View style={styles.contactRow}>
                        <Ionicons
                          name="mail-outline"
                          size={16}
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
                          size={16}
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
                          size={16}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.contactText}>{lender.address}</Text>
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
                    color={colors.primary}
                  />
                </TouchableOpacity>
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
  lenderIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  lenderInfo: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: "center",
  },
  lenderName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.surface,
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
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: spacing.sm,
  },
  viewButtonText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: "600",
    marginRight: spacing.xs,
  },
  contactInfo: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  contactText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
});
