import { useState, useEffect, useRef } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  X,
  Loader2,
  Plus,
  Edit,
  Trash2,
  ShieldCheck,
  ShieldX,
  LogIn,
  LogOut,
  Eye,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "@/apis/notificationsApi";
import type { NotificationItem } from "@/types/notification";
import { formatDistanceToNow } from "date-fns";

const getActivityIcon = (action: string) => {
  switch (action) {
    case "CREATE":
      return <Plus className="h-5 w-5 text-blue-600" />;
    case "UPDATE":
      return <Edit className="h-5 w-5 text-amber-600" />;
    case "DELETE":
      return <Trash2 className="h-5 w-5 text-red-600" />;
    case "KYC_VERIFY":
      return <ShieldCheck className="h-5 w-5 text-green-600" />;
    case "KYC_REJECT":
      return <ShieldX className="h-5 w-5 text-red-600" />;
    case "LOGIN":
      return <LogIn className="h-5 w-5 text-blue-600" />;
    case "LOGOUT":
      return <LogOut className="h-5 w-5 text-gray-600" />;
    case "VISIT":
      return <Eye className="h-5 w-5 text-purple-600" />;
    default:
      return <FileText className="h-5 w-5 text-gray-600" />;
  }
};

const getActivityColor = (action: string, isRead: boolean) => {
  if (isRead) return "bg-gray-50";

  switch (action) {
    case "KYC_VERIFY":
      return "bg-green-50";
    case "KYC_REJECT":
      return "bg-red-50";
    case "CREATE":
      return "bg-blue-50";
    case "DELETE":
      return "bg-orange-50";
    default:
      return "bg-white";
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

export const NotificationsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: unreadCountData } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 10000,
  });

  const {
    data: notifications = [],
    isFetching: isFetchingNotifications,
    refetch: refetchNotifications,
  } = useGetNotificationsQuery(
    { limit: 50, offset: 0 },
    {
      skip: !isOpen,
    }
  );

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAllAsRead }] =
    useMarkAllAsReadMutation();

  const unreadCount = unreadCountData?.count || 0;

  useEffect(() => {
    if (isOpen) {
      refetchNotifications();
    }
  }, [isOpen, refetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id).unwrap();
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center bg-red-500 text-white rounded-full text-xs font-semibold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={isMarkingAllAsRead}
                  className="text-xs"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[500px]">
            {isFetchingNotifications ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-gray-400" />
                <p className="text-sm text-gray-500">
                  Loading notifications...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${getActivityColor(
                      notification.action,
                      notification.isRead
                    )}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getActivityIcon(notification.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm ${
                              !notification.isRead
                                ? "font-semibold"
                                : "font-normal"
                            }`}
                          >
                            {formatDescription(notification)}
                          </p>
                          {!notification.isRead && (
                            <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(
                              new Date(notification.createdAt),
                              {
                                addSuffix: true,
                              }
                            )}
                          </span>
                          {notification.actorUser && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {notification.actorUser.fullName}
                              </span>
                            </>
                          )}
                        </div>
                        {notification.entityType && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {notification.entityType}
                          </Badge>
                        )}
                      </div>
                      {notification.isRead && (
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {notifications.length > 0 && (
            <>
              <Separator />
              <div className="p-3 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-600 hover:text-gray-900"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
