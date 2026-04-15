import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  FileCheck,
  BadgeCheck,
  Banknote,
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
      return <Plus className="h-5 w-5" style={{ color: 'var(--color-info)' }} />;
    case "UPDATE":
      return <Edit className="h-5 w-5" style={{ color: 'var(--color-warning)' }} />;
    case "DELETE":
      return <Trash2 className="h-5 w-5" style={{ color: 'var(--color-danger)' }} />;
    case "KYC_VERIFY":
      return <ShieldCheck className="h-5 w-5" style={{ color: 'var(--color-success)' }} />;
    case "KYC_REJECT":
      return <ShieldX className="h-5 w-5" style={{ color: 'var(--color-danger)' }} />;
    case "LOGIN":
      return <LogIn className="h-5 w-5" style={{ color: 'var(--color-info)' }} />;
    case "LOGOUT":
      return <LogOut className="h-5 w-5 text-muted-foreground" />;
    case "VISIT":
      return <Eye className="h-5 w-5" style={{ color: 'var(--color-warning)' }} />;
    case "LEAVE":
      return <LogOut className="h-5 w-5 text-muted-foreground" />;
    case "LOAN_APPROVE":
      return <BadgeCheck className="h-5 w-5" style={{ color: 'var(--color-success)' }} />;
    case "LOAN_REJECT":
      return <ShieldX className="h-5 w-5" style={{ color: 'var(--color-danger)' }} />;
    case "CONTRACT_SIGN":
      return <FileCheck className="h-5 w-5" style={{ color: 'var(--color-info)' }} />;
    case "PAYMENT_RECEIVED":
      return <Banknote className="h-5 w-5" style={{ color: 'var(--color-success)' }} />;
    default:
      return <FileText className="h-5 w-5 text-muted-foreground" />;
  }
};

const getActivityColor = (action: string, isRead: boolean) => {
  if (isRead) return "bg-muted/30";

  switch (action) {
    case "KYC_VERIFY":
      return "bg-primary/5 dark:bg-primary/10";
    case "KYC_REJECT":
      return "bg-destructive/5 dark:bg-destructive/10";
    case "CREATE":
      return "bg-blue-500/5 dark:bg-blue-500/10";
    case "DELETE":
      return "bg-orange-500/5 dark:bg-orange-500/10";
    default:
      return "bg-card";
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
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [allNotifications, setAllNotifications] = useState<NotificationItem[]>(
    [],
  );
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 20;
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: unreadCountData } = useGetUnreadCountQuery();

  const {
    data: rawNotifications,
    isFetching: isFetchingNotifications,
    refetch: refetchNotifications,
  } = useGetNotificationsQuery(
    { limit: LIMIT, offset },
    {
      skip: !isOpen,
    },
  );

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAllAsRead }] =
    useMarkAllAsReadMutation();

  const unreadCount = unreadCountData?.count || 0;

  useEffect(() => {
    if (isOpen && offset === 0) {
      refetchNotifications();
    }
  }, [isOpen, offset, refetchNotifications]);

  useEffect(() => {
    if (!rawNotifications) return;

    if (rawNotifications.length > 0) {
      if (offset === 0) {
        setAllNotifications(rawNotifications);
      } else {
        setAllNotifications((prev) => {
          // Prevent duplicate additions if the same page is refetched
          const existingIds = new Set(prev.map((n) => n.id));
          const newItems = rawNotifications.filter(
            (n) => !existingIds.has(n.id),
          );
          if (newItems.length === 0) return prev;
          return [...prev, ...newItems];
        });
      }
      setHasMore(rawNotifications.length === LIMIT);
    } else if (offset === 0) {
      setAllNotifications((prev) => (prev.length === 0 ? prev : []));
      setHasMore(false);
    }
  }, [rawNotifications, offset]);

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
    } catch (error) {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
    } catch (error) {}
  };

  const handleLoadMore = () => {
    if (!isFetchingNotifications && hasMore) {
      setOffset((prev) => prev + LIMIT);
    }
  };

  const handleOpen = () => {
    if (!isOpen) {
      setOffset(0);
      setHasMore(true);
    }
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    // Navigate based on entity type
    if (notification.entityType === "CONTRACT") {
      navigate("/contracts");
      setIsOpen(false);
    } else if (notification.entityType === "LOAN") {
      navigate("/loan-requests");
      setIsOpen(false);
    } else if (notification.entityType === "KYC") {
      navigate("/kyc");
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={handleOpen}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full text-xs font-semibold"
            style={{ backgroundColor: 'var(--color-badge-danger)', color: 'var(--color-danger-fg)' }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-96 !bg-popover rounded-lg shadow-lg border z-50"
          style={{ backgroundColor: "hsl(var(--popover))" }}
        >
          <div className="p-4 border-b flex items-center justify-between">
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
            {isFetchingNotifications && offset === 0 ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Loading notifications...
                </p>
              </div>
            ) : allNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {allNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${getActivityColor(
                      notification.action,
                      notification.isRead,
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
                            <div className="flex-shrink-0 w-2 h-2 rounded-full mt-1" style={{ backgroundColor: 'var(--color-unread-dot)' }}></div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(notification.createdAt),
                              {
                                addSuffix: true,
                              },
                            )}
                          </span>
                          {notification.actorUser && (
                            <>
                              <span className="text-xs text-muted-foreground/50">
                                •
                              </span>
                              <span className="text-xs text-muted-foreground">
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
                        <Check className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
                      )}
                    </div>
                  </div>
                ))}
                {hasMore && (
                  <div className="p-4 text-center border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLoadMore}
                      disabled={isFetchingNotifications}
                      className="text-xs"
                    >
                      {isFetchingNotifications ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Show More"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {allNotifications.length > 0 && (
            <>
              <Separator />
              <div className="p-3 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground"
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
