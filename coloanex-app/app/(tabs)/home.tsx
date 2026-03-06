import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { spacing, borderRadius } from "@/constants/theme";
import { lendersApi, notificationsApi } from "@/api";
import type { Lender } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { useAppSelector } from "@/store/hooks";

type QuickAction = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
  color: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: "business-outline",
    label: "Lenders",
    route: "/(tabs)/browse-lenders",
    color: "#6366F1",
  },
  {
    icon: "document-text-outline",
    label: "My Loans",
    route: "/(tabs)/my-loans",
    color: "#16A34A",
  },
  {
    icon: "wallet-outline",
    label: "Wallet",
    route: "/wallet",
    color: "#F59E0B",
  },
  {
    icon: "shield-checkmark-outline",
    label: "KYC",
    route: "/kyc",
    color: "#3B82F6",
  },
];

export default function HomeScreen() {
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const user = useAppSelector((state) => state.auth.user);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const loadData = async () => {
    try {
      const [lenderResult, notifData] = await Promise.all([
        lendersApi.getAll({ limit: 6, offset: 0 }),
        notificationsApi.getUnreadCount().catch(() => ({ count: 0 })),
      ]);
      setLenders(lenderResult.data);
      setUnreadCount(notifData.count);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={[styles.heroSection, { backgroundColor: colors.card }]}>
          <View style={styles.heroTop}>
            <View style={styles.greetingCol}>
              <Text
                style={[styles.greetingText, { color: colors.textSecondary }]}
              >
                {greeting},
              </Text>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user?.fullName?.split(" ")[0] ?? "Welcome"}
              </Text>
              <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
                Find the best loan for you
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.notifBtn, { backgroundColor: colors.surface }]}
              onPress={() => router.push("/activity-logs")}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={colors.text}
              />
              {unreadCount > 0 && (
                <View
                  style={[styles.notifBadge, { backgroundColor: colors.error }]}
                >
                  <Text style={styles.notifBadgeText}>
                    {unreadCount > 99 ? "99+" : String(unreadCount)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={[styles.appBrand, { borderTopColor: colors.border }]}>
            <View
              style={[styles.brandDot, { backgroundColor: colors.primary }]}
            />
            <Text style={[styles.brandName, { color: colors.primary }]}>
              CoLoanex
            </Text>
            <Text
              style={[styles.brandTagline, { color: colors.textSecondary }]}
            >
              — Peer lending simplified
            </Text>
          </View>
        </View>

        <View style={[styles.section, { marginTop: spacing.md }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Featured Lenders
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/browse-lenders")}
            >
              <Text style={[styles.seeAll, { color: colors.primary }]}>
                See all
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : lenders.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.card }]}>
              <Ionicons
                name="business-outline"
                size={32}
                color={colors.textLight}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No lenders available
              </Text>
            </View>
          ) : (
            lenders.map((lender) => (
              <TouchableOpacity
                key={lender.id}
                style={[styles.lenderCard, { backgroundColor: colors.card }]}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: "/lenders/lender-details",
                    params: { id: lender.id },
                  })
                }
              >
                <View style={styles.lenderCardLeft}>
                  <View
                    style={[
                      styles.lenderAvatar,
                      { backgroundColor: colors.primaryLight },
                    ]}
                  >
                    {lender.logo ? (
                      <Image
                        source={{ uri: lender.logo }}
                        style={styles.lenderAvatarImg}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.lenderAvatarInitial,
                          { color: colors.primary },
                        ]}
                      >
                        {lender.name.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.lenderInfo}>
                    <Text
                      style={[styles.lenderName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {lender.name}
                    </Text>
                    {lender.address && (
                      <View style={styles.lenderMetaRow}>
                        <Ionicons
                          name="location-outline"
                          size={11}
                          color={colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.lenderMetaText,
                            { color: colors.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {lender.address}
                        </Text>
                      </View>
                    )}
                    {lender.contactPhone && (
                      <View style={styles.lenderMetaRow}>
                        <Ionicons
                          name="call-outline"
                          size={11}
                          color={colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.lenderMetaText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {lender.contactPhone}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.lenderCardRight}>
                  <View
                    style={[
                      styles.lenderStatus,
                      {
                        backgroundColor: lender.isActive
                          ? "#D1FAE5"
                          : colors.surface,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: lender.isActive
                            ? "#16A34A"
                            : colors.textLight,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.lenderStatusText,
                        {
                          color: lender.isActive
                            ? "#16A34A"
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      {lender.isActive ? "Active" : "Inactive"}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textLight}
                    style={{ marginTop: 8 }}
                  />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    container: { flex: 1 },
    heroSection: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      marginBottom: spacing.sm,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 3,
    },
    heroTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    greetingCol: { flex: 1 },
    greetingText: { fontSize: 13, fontWeight: "500" },
    userName: { fontSize: 24, fontWeight: "800", marginVertical: 2 },
    heroSub: { fontSize: 12, fontWeight: "500" },
    notifBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    notifBadge: {
      position: "absolute",
      top: -2,
      right: -2,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 3,
    },
    notifBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
    appBrand: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
    },
    brandDot: { width: 8, height: 8, borderRadius: 4 },
    brandName: { fontSize: 14, fontWeight: "800" },
    brandTagline: { fontSize: 12, fontWeight: "500" },
    quickActions: {
      flexDirection: "row",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    quickBtn: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 12,
      borderRadius: borderRadius.lg,
      gap: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    quickIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    quickLabel: { fontSize: 11, fontWeight: "600" },
    section: { paddingHorizontal: spacing.md },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.sm,
    },
    sectionTitle: { fontSize: 17, fontWeight: "700" },
    seeAll: { fontSize: 13, fontWeight: "600" },
    loadingBox: { paddingVertical: 48, alignItems: "center" },
    emptyBox: {
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xl,
      borderRadius: borderRadius.lg,
      gap: spacing.sm,
    },
    emptyText: { fontSize: 13, fontWeight: "500" },
    lenderCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    lenderCardLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: spacing.sm,
    },
    lenderAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    lenderAvatarImg: { width: "100%", height: "100%" },
    lenderAvatarInitial: { fontSize: 20, fontWeight: "800" },
    lenderInfo: { flex: 1 },
    lenderName: { fontSize: 14, fontWeight: "700", marginBottom: 3 },
    lenderMetaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    lenderMetaText: { fontSize: 11, fontWeight: "500", flex: 1 },
    lenderCardRight: { alignItems: "flex-end" },
    lenderStatus: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    lenderStatusText: { fontSize: 11, fontWeight: "600" },
  });
