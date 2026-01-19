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
import { useToast } from "@/components/ui";
import { Colors } from "@/constants/theme";
import type { NotificationItem, ActivityAction } from "@/types/notification";

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
      return "log-out";
    case "VISIT":
      return "eye";
    default:
      return "document-text";
  }
};

const getActivityColor = (action: ActivityAction) => {
  switch (action) {
    case "CREATE":
      return "#3B82F6";
    case "UPDATE":
      return "#F59E0B";
    case "DELETE":
      return "#EF4444";
    case "KYC_VERIFY":
      return "#10B981";
    case "KYC_REJECT":
      return "#EF4444";
    case "LOGIN":
      return "#3B82F6";
    case "LOGOUT":
      return "#6B7280";
    case "VISIT":
      return "#8B5CF6";
    default:
      return "#6B7280";
  }
};

const getActivityBackgroundColor = (
  action: ActivityAction,
  isRead: boolean,
) => {
  if (isRead) return "#F9FAFB";

  switch (action) {
    case "KYC_VERIFY":
      return "#D1FAE5";
    case "KYC_REJECT":
      return "#FEE2E2";
    case "CREATE":
      return "#DBEAFE";
    case "DELETE":
      return "#FED7AA";
    default:
      return "#FFFFFF";
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
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);

  const loadNotifications = async () => {
    try {
      const [notificationsData, unreadData] = await Promise.all([
        notificationsApi.getNotifications({ limit: 50, offset: 0 }),
        notificationsApi.getUnreadCount(),
      ]);
      setNotifications(notificationsData);
      setUnreadCount(unreadData.count);
    } catch (error: any) {
      showToast(
        error.response?.data?.message || "Failed to load notifications",
        "error",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
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
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Activity Logs</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            disabled={markingAllAsRead}
            style={styles.markAllButton}
          >
            {markingAllAsRead ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons
                name="checkmark-done"
                size={24}
                color={Colors.primary}
              />
            )}
          </TouchableOpacity>
        )}
        {unreadCount === 0 && <View style={{ width: 40 }} />}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="notifications-off-outline"
            size={64}
            color={Colors.textSecondary}
          />
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubtext}>
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
                  ),
                },
                index === notifications.length - 1 && styles.lastItem,
              ]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: getActivityColor(notification.action) },
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
                    !notification.isRead && styles.notificationTextUnread,
                  ]}
                >
                  {formatDescription(notification)}
                </Text>

                <View style={styles.notificationMeta}>
                  <Text style={styles.metaText}>
                    {formatTimeAgo(notification.createdAt)}
                  </Text>
                  {notification.actorUser && (
                    <>
                      <Text style={styles.metaDot}>•</Text>
                      <Text style={styles.metaText}>
                        {notification.actorUser.fullName}
                      </Text>
                    </>
                  )}
                </View>

                {notification.entityType && (
                  <View style={styles.entityBadge}>
                    <Text style={styles.entityBadgeText}>
                      {notification.entityType}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.notificationRight}>
                {!notification.isRead && <View style={styles.unreadDot} />}
                {notification.isRead && (
                  <Ionicons name="checkmark" size={18} color="#10B981" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  badge: {
    backgroundColor: Colors.primary,
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
    color: Colors.textSecondary,
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
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
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
    borderBottomColor: Colors.border,
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
    color: Colors.text,
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
    color: Colors.textSecondary,
  },
  metaDot: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  entityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "#fff",
  },
  entityBadgeText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  notificationRight: {
    alignItems: "center",
    justifyContent: "center",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});
