import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  LinearGradient,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Card } from "@/components/ui";
import { colors, spacing, typography } from "@/constants/theme";
import { lendersApi, notificationsApi } from "@/api";
import type { Lender } from "@/types";

export default function HomeScreen() {
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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

  const loadUnreadCount = async () => {
    try {
      const data = await notificationsApi.getUnreadCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error("Failed to load unread count:", error);
    }
  };

  useEffect(() => {
    loadLenders();
    loadUnreadCount();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadLenders();
    loadUnreadCount();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeText}>Welcome to</Text>
            <Text style={styles.title}>CoLoanex</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push("/activity-logs")}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={colors.text}
            />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  welcomeText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    fontWeight: "800",
    marginTop: 4,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
    width: 64,
    height: 64,
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
