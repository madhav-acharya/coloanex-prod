import { baseApi } from "./baseApi";
import type {
  NotificationItem,
  UnreadCountResponse,
  MarkAllAsReadResponse,
} from "@/types/notification";

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      NotificationItem[],
      { limit?: number; offset?: number }
    >({
      query: ({ limit = 50, offset = 0 }) => ({
        url: "/activity-logs/notifications",
        method: "GET",
        params: { limit, offset },
      }),
      providesTags: ["Notifications"],
    }),

    getUnreadCount: builder.query<UnreadCountResponse, void>({
      query: () => ({
        url: "/activity-logs/notifications/unread-count",
        method: "GET",
      }),
      providesTags: ["Notifications"],
    }),

    markAsRead: builder.mutation<void, string>({
      query: (id) => ({
        url: `/activity-logs/notifications/${id}/read`,
        method: "POST",
      }),
      invalidatesTags: ["Notifications"],
    }),

    markAllAsRead: builder.mutation<MarkAllAsReadResponse, void>({
      query: () => ({
        url: "/activity-logs/notifications/read-all",
        method: "POST",
      }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} = notificationsApi;
