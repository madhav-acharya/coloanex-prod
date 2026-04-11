import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { notificationsApi } from "@/api";
import { useToast, AppHeader } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import type { NotificationItem, ActivityAction } from "@/types/notification";
import { spacing } from "@/constants/theme";

const getActivityIcon = (action: ActivityAction) => {
  switch (action) {
    case "CREATE":
      return "add-circle";
    case "UPDATE":
      return "create";
    case "DELETE":
      return "trash";
    case "KYC_VERIFY":
      return "shield-checkmark";
    case "KYC_REJECT":
      return "shield";
    case "LOGIN":
      return "log-in";
    case "LOGOUT":
    case "LEAVE":
      return "log-out";
    case "VISIT":
      return "eye";
    case "LOAN_APPROVE":
      return "checkmark-done-circle";
    case "LOAN_REJECT":
      return "close-circle";
    case "LOAN_DISBURSE":
      return "cash";
    case "CONTRACT_SIGN":
      return "document-attach";
    case "PAYMENT_RECEIVED":
      return "wallet";
    default:
      return "document-text";
  }
};

const getActivityColor = (action: ActivityAction, isDark: boolean) => {
  const colors: Record<string, string> = {
    CREATE: "#3B82F6",
    UPDATE: "#F59E0B",
    DELETE: "#EF4444",
    KYC_VERIFY: "#10B981",
    KYC_REJECT: "#EF4444",
    LOGIN: "#3B82F6",
    LOGOUT: isDark ? "#9CA3AF" : "#6B7280",
    VISIT: "#8B5CF6",
    PASSWORD_RESET: "#F59E0B",
    LEAVE: isDark ? "#9CA3AF" : "#6B7280",
    LOAN_APPROVE: "#10B981",
    LOAN_REJECT: "#EF4444",
    LOAN_DISBURSE: "#8B5CF6",
    CONTRACT_SIGN: "#3B82F6",
    PAYMENT_RECEIVED: "#10B981",
  };
  return colors[action] || (isDark ? "#9CA3AF" : "#6B7280");
};

const getActivityBackgroundColor = (
  action: ActivityAction,
  isRead: boolean,
  cardColor: string,
  surfaceColor: string,
) => {
  if (isRead) return surfaceColor;

  switch (action) {
    case "KYC_VERIFY":
    case "LOAN_APPROVE":
    case "PAYMENT_RECEIVED":
      return "rgba(16, 185, 129, 0.12)";
    case "KYC_REJECT":
    case "LOAN_REJECT":
    case "DELETE":
      return "rgba(239, 68, 68, 0.1)";
    case "CONTRACT_SIGN":
    case "LOAN_DISBURSE":
    case "CREATE":
      return "rgba(59, 130, 246, 0.12)";
    default:
      return cardColor;
  }
};

const formatDescription = (notification: NotificationItem) => {
  const actor = notification.actorUser?.fullName || "Someone";
  const entity = notification.entityType.toLowerCase();
  const action = notification.action.toLowerCase().replace("_", " ");

  if (notification.description) {
    return notification.description;
  }

  return `${actor} ${action} ${entity}`;
};

const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
};

export default function ActivityLogsScreen() {
  const { showToast } = useToast();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  const loadNotifications = async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      const [notificationsData, unreadData] = await Promise.all([
        notificationsApi.getNotifications({
          limit: LIMIT,
          offset: currentOffset,
        }),
        notificationsApi.getUnreadCount(),
      ]);

      if (reset) {
        setNotifications(notificationsData);
        setOffset(LIMIT);
      } else {
        setNotifications([...notifications, ...notificationsData]);
        setOffset(currentOffset + LIMIT);
      }

      setHasMore(notificationsData.length === LIMIT);
      setUnreadCount(unreadData.count);

      // Auto-mark unread notifications as read after a short delay
      const unreadNotifications = notificationsData.filter((n) => !n.isRead);
      if (unreadNotifications.length > 0) {
        setTimeout(() => {
          markUnreadAsRead(unreadNotifications);
        }, 1000); // 1 second delay to ensure user sees them
      }
    } catch (error: any) {
      showToast(
        error.response?.data?.message || "Failed to load notifications",
        "error",
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    loadNotifications(true);
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const onRefresh = () => {
    setRefreshing(true);
    setOffset(0);
    loadNotifications(true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      loadNotifications(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const markUnreadAsRead = async (unreadNotifications: NotificationItem[]) => {
    try {
      // Mark all as read in parallel
      await Promise.all(
        unreadNotifications.map((notification) =>
          notificationsApi.markAsRead(notification.id),
        ),
      );

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          unreadNotifications.find((un) => un.id === n.id)
            ? { ...n, isRead: true }
            : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - unreadNotifications.length));
    } catch {}
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAllAsRead(true);
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showToast("All notifications marked as read", "success");
    } catch (error: any) {
      showToast(
        error.response?.data?.message || "Failed to mark all as read",
        "error",
      );
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  const handleNotificationPress = (notification: NotificationItem) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    // Navigate to relevant screen based on entity type
    if (notification.entityType === "CONTRACT" && notification.entityId) {
      router.push(`/contracts/${notification.entityId}` as any);
    } else if (notification.entityType === "CONTRACT") {
      router.push("/contracts" as any);
    } else if (notification.entityType === "LOAN" && notification.entityId) {
      router.push(`/loans/${notification.entityId}` as any);
    } else if (notification.entityType === "KYC" && notification.entityId) {
      router.push(`/kyc/${notification.entityId}` as any);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Activity Logs"
        rightComponent={
          <View style={styles.headerRight}>
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={handleMarkAllAsRead}
                disabled={markingAllAsRead}
                style={styles.markAllButton}
              >
                {markingAllAsRead ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons
                    name="checkmark-done"
                    size={24}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading notifications...
          </Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="notifications-off-outline"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No notifications yet
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Your activity logs will appear here
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {notifications.map((notification, index) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationItem,
                {
                  backgroundColor: getActivityBackgroundColor(
                    notification.action,
                    notification.isRead,
                    colors.card,
                    colors.surface,
                  ),
                  borderBottomColor: colors.border,
                },
                index === notifications.length - 1 && styles.lastItem,
              ]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: getActivityColor(
                      notification.action,
                      isDark,
                    ),
                  },
                ]}
              >
                <Ionicons
                  name={getActivityIcon(notification.action) as any}
                  size={20}
                  color="#fff"
                />
              </View>

              <View style={styles.notificationContent}>
                <Text
                  style={[
                    styles.notificationText,
                    { color: colors.text },
                    !notification.isRead && styles.notificationTextUnread,
                  ]}
                >
                  {formatDescription(notification)}
                </Text>

                <View style={styles.notificationMeta}>
                  <Text
                    style={[styles.metaText, { color: colors.textSecondary }]}
                  >
                    {formatTimeAgo(notification.createdAt)}
                  </Text>
                  {notification.actorUser && (
                    <>
                      <Text
                        style={[
                          styles.metaDot,
                          { color: colors.textSecondary },
                        ]}
                      >
                        •
                      </Text>
                      <Text
                        style={[
                          styles.metaText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {notification.actorUser.fullName}
                      </Text>
                    </>
                  )}
                </View>

                {notification.entityType && (
                  <View
                    style={[
                      styles.entityBadge,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.entityBadgeText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {notification.entityType}
                    </Text>
                  </View>
                )}

                {(notification.entityType === "CONTRACT" ||
                  notification.entityType === "LOAN" ||
                  notification.entityType === "KYC") && (
                  <View style={styles.tapToViewRow}>
                    <Text
                      style={[styles.tapToViewText, { color: colors.primary }]}
                    >
                      Tap to view
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={12}
                      color={colors.primary}
                    />
                  </View>
                )}
              </View>

              <View style={styles.notificationRight}>
                {!notification.isRead && (
                  <View
                    style={[
                      styles.unreadDot,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                )}
                {notification.isRead && (
                  <Ionicons name="checkmark" size={18} color={colors.success} />
                )}
              </View>
            </TouchableOpacity>
          ))}

          {hasMore && (
            <TouchableOpacity
              style={[
                styles.loadMoreButton,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text
                    style={[
                      styles.loadMoreText,
                      { color: colors.textSecondary, marginLeft: 8 },
                    ]}
                  >
                    Loading...
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    style={[styles.loadMoreText, { color: colors.primary }]}
                  >
                    Show More
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={colors.primary}
                  />
                </>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    badge: {
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 2,
      minWidth: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "600",
    },
    markAllButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: "600",
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      textAlign: "center",
    },
    content: {
      flex: 1,
    },
    notificationItem: {
      flexDirection: "row",
      padding: 16,
      gap: 12,
      borderBottomWidth: 1,
    },
    lastItem: {
      borderBottomWidth: 0,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    notificationContent: {
      flex: 1,
      gap: 6,
    },
    notificationText: {
      fontSize: 14,
      lineHeight: 20,
    },
    notificationTextUnread: {
      fontWeight: "600",
    },
    notificationMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    metaText: {
      fontSize: 12,
    },
    metaDot: {
      fontSize: 12,
    },
    entityBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      borderWidth: 1,
    },
    entityBadgeText: {
      fontSize: 11,
      fontWeight: "500",
    },
    tapToViewRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 2,
      marginTop: 4,
    },
    tapToViewText: {
      fontSize: 11,
      fontWeight: "600" as any,
    },
    notificationRight: {
      alignItems: "center",
      justifyContent: "center",
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    loadMoreButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      marginHorizontal: 16,
      marginVertical: 16,
      borderWidth: 1,
    },
    loadMoreText: {
      fontSize: 14,
      fontWeight: "600",
      marginRight: 6,
    },
  });
