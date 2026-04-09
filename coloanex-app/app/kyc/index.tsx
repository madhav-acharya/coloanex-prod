import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { AppHeader } from "@/components/ui";
import { spacing, borderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { kycApi } from "@/api";
import type { Kyc } from "@/types";

export default function KycOverviewScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [kycs, setKycs] = useState<Kyc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadKycs = useCallback(async () => {
    try {
      const result = await kycApi.getAll({
        page: 1,
        limit: 50,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setKycs(result?.data || []);
    } catch {
      setKycs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadKycs();
  }, [loadKycs]);

  const onRefresh = () => {
    setRefreshing(true);
    loadKycs();
  };

  const getStatusColor = (status: string) => {
    if (status === "VERIFIED") return colors.success;
    if (status === "REJECTED") return colors.error;
    return colors.warning;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader
        title="KYC Submissions"
        showThemeToggle={false}
        onBackPress={() => router.back()}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : kycs.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons
            name="shield-checkmark-outline"
            size={40}
            color={colors.textLight}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No KYC Found
          </Text>
          <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
            You have not submitted KYC yet.
          </Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(tabs)/browse-lenders")}
          >
            <Text style={[styles.actionBtnText, { color: colors.buttonText }]}>
              Browse Lenders
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {kycs.map((item) => {
            const statusColor = getStatusColor(item.status);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, { backgroundColor: colors.card }]}
                activeOpacity={0.85}
                onPress={() => router.push(`/kyc/${item.id}` as any)}
              >
                <View style={styles.rowBetween}>
                  <Text
                    style={[styles.cardTitle, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {item.fullName}
                  </Text>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: `${statusColor}20` },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[styles.cardMeta, { color: colors.textSecondary }]}
                >
                  Submitted: {new Date(item.createdAt).toLocaleDateString()}
                </Text>
                <Text
                  style={[styles.cardMeta, { color: colors.textSecondary }]}
                >
                  Occupation: {item.occupation || "-"}
                </Text>
                <View style={styles.viewRow}>
                  <Text style={[styles.viewText, { color: colors.primary }]}>
                    View full details
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={colors.primary}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    container: { flex: 1 },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.xl,
    },
    content: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      gap: spacing.sm,
    },
    card: {
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    rowBetween: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "800",
      flex: 1,
      marginRight: spacing.sm,
    },
    statusPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
    },
    statusText: { fontSize: 11, fontWeight: "700" },
    cardMeta: { fontSize: 12, fontWeight: "500", marginTop: 6 },
    viewRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: spacing.sm,
    },
    viewText: { fontSize: 12, fontWeight: "700" },
    emptyTitle: { fontSize: 20, fontWeight: "800", marginTop: spacing.sm },
    emptyBody: {
      fontSize: 13,
      textAlign: "center",
      marginTop: 4,
      marginBottom: spacing.md,
    },
    actionBtn: {
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.lg,
      paddingVertical: 12,
    },
    actionBtnText: { fontSize: 14, fontWeight: "700" },
  });
