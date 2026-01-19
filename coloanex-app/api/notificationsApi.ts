import apiClient from "./client";
import type {
  NotificationItem,
  UnreadCountResponse,
  MarkAllAsReadResponse,
} from "@/types/notification";

export const notificationsApi = {
  getNotifications: async (params?: { limit?: number; offset?: number }) => {
    const { limit = 50, offset = 0 } = params || {};
    const response = await apiClient.get<NotificationItem[]>(
      "/activity-logs/notifications",
      {
        params: { limit, offset },
      },
    );
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await apiClient.get<UnreadCountResponse>(
      "/activity-logs/notifications/unread-count",
    );
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await apiClient.post(
      `/activity-logs/notifications/${id}/read`,
    );
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.post<MarkAllAsReadResponse>(
      "/activity-logs/notifications/read-all",
    );
    return response.data;
  },
};
