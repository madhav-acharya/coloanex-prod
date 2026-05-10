import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileDropdown } from "@/components/shared/ProfileDropdown";
import { NotificationsDropdown } from "@/components/shared/NotificationsDropdown";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Plus,
  Shield,
  Users,
  Key,
  BadgeDollarSign,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  Building2,
  FileText,
  Landmark,
  ScrollText,
  Wallet,
  Lock,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { FilterField, ActionButton } from "@/types/layout";
import { hasPermission } from "@/lib/permissions";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: FilterField[];
  filterValues?: Record<string, string>;
  onFilterChange?: (name: string, value: string) => void;
  actionLabel?: string;
  onActionClick?: () => void;
  actions?: ActionButton[];
  className?: string;
  searchClassName?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isLoading?: boolean;
  skeletonType?: "table" | "cards";
}

export default function DashboardLayout({
  children,
  title,
  description,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  filters = [],
  filterValues = {},
  onFilterChange,
  actionLabel,
  onActionClick,
  actions,
  className,
  searchClassName,
  onRefresh,
  isRefreshing = false,
  isLoading = false,
  skeletonType = "table",
}: DashboardLayoutProps) {
  const COLLAPSED_WIDTH = 64;
  const DEFAULT_WIDTH = 256;
  const MIN_WIDTH = 64;
  const MAX_WIDTH = 360;

  const [sidebarWidth, setSidebarWidth] = useState(() =>
    window.innerWidth < 768 ? COLLAPSED_WIDTH : DEFAULT_WIDTH,
  );
  const isCollapsed = sidebarWidth <= 80;
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarWidth(COLLAPSED_WIDTH);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const delta = e.clientX - dragStartX.current;
    const newWidth = Math.min(
      Math.max(dragStartWidth.current + delta, MIN_WIDTH),
      MAX_WIDTH,
    );
    setSidebarWidth(newWidth);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, [handleMouseMove]);

  const handleDragHandleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      dragStartX.current = e.clientX;
      dragStartWidth.current = sidebarWidth;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [sidebarWidth, handleMouseMove, handleMouseUp],
  );

  const isSuperAdmin = user?.roles?.some(
    (ur) => ur.role?.name === "Super Admin",
  );
  const isAdminOrLender = user?.roles?.some(
    (ur) => ur.role?.name === "Admin" || ur.role?.name === "Lender",
  );
  const needsTenantId = !isSuperAdmin && isAdminOrLender && !user?.tenantId;

  const accessControlItems = [
    {
      title: "Roles",
      icon: <Shield className="w-4 h-4 text-blue-600" />,
      href: "/system/roles",
      permission: "Read Roles",
    },
    {
      title: "Permissions",
      icon: <Key className="w-4 h-4 text-amber-600" />,
      href: "/system/permissions",
      permission: "Read Permissions",
    },
    {
      title: "Subscriptions",
      icon: <BadgeDollarSign className="w-4 h-4 text-indigo-600" />,
      href: "/system/subscriptions",
      permission: "Read Roles",
    },
  ];

  const managementItems = [
    {
      title: "Users",
      icon: <Users className="w-4 h-4 text-green-600" />,
      href: "/users",
      permission: "Read Users",
    },
    {
      title: "Tenants",
      icon: <Building2 className="w-4 h-4 text-sky-600" />,
      href: "/tenants",
      permission: "Read Tenants",
    },
    {
      title: "KYC Requests",
      icon: <FileText className="w-4 h-4 text-rose-600" />,
      href: "/kyc-requests",
      permission: "Read KYC Documents",
    },
    {
      title: "Loan Requests",
      icon: <Landmark className="w-4 h-4 text-purple-600" />,
      href: "/loan-requests",
      permission: "Read Loans",
    },
  ];

  const loanManagementItems = [
    {
      title: "Loan Rules",
      icon: <ScrollText className="w-4 h-4 text-orange-600" />,
      href: "/rules",
      permission: "Read Loans",
    },
    {
      title: "Contracts",
      icon: <FileText className="w-4 h-4 text-cyan-600" />,
      href: "/contracts",
      permission: "Read Loans",
    },
    {
      title: "Wallet",
      icon: <Wallet className="w-4 h-4 text-emerald-600" />,
      href: "/wallet",
      permission: "Read Payments",
    },
  ];

  const NavSection = ({
    title,
    items,
    isOpen: initialOpen,
  }: {
    title: string;
    items: {
      title: string;
      icon: React.ReactNode;
      href: string;
      permission?: string;
      superAdminOnly?: boolean;
    }[];
    isOpen: boolean;
  }) => {
    const [isOpen, setIsOpen] = useState(initialOpen);

    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center justify-between w-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-sm hover:bg-muted/50",
            isCollapsed && "justify-center",
          )}
        >
          {!isCollapsed && <span>{title}</span>}
          {!isCollapsed &&
            (isOpen ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            ))}
        </button>

        {isOpen && (
          <div className="space-y-1">
            {items.map((item) => {
              if (item.superAdminOnly && !isSuperAdmin) {
                return null;
              }

              const isActive = location.pathname === item.href;
              const hasAccess =
                !item.permission || hasPermission(user, item.permission);
              const isLocked = !hasAccess || needsTenantId;

              if (isLocked) {
                return (
                  <div
                    key={item.title}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150 cursor-not-allowed opacity-50",
                      isActive
                        ? "bg-primary/20 text-primary font-semibold border-l-2 border-primary"
                        : "text-muted-foreground/60",
                      isCollapsed && "justify-center px-2",
                    )}
                    title={
                      needsTenantId
                        ? "Tenant assignment required"
                        : "No permission"
                    }
                  >
                    {item.icon}
                    {!isCollapsed && (
                      <>
                        <span className="flex-1">{item.title}</span>
                        <Lock className="w-3 h-3 text-muted-foreground" />
                      </>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.title}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm transition-all duration-150 cursor-pointer",
                    isActive
                      ? "bg-primary/15 text-primary font-bold"
                      : "text-foreground/80 font-medium hover:bg-muted hover:text-primary active:bg-muted",
                    isCollapsed && "justify-center px-2 border-l-0 pl-2",
                  )}
                >
                  {item.icon}
                  {!isCollapsed && <span className="flex-1">{item.title}</span>}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && (
          <Link to="/" className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <img src="/images/logo.png" alt="C" className="w-full h-full" />
            </div>
            <span className="text-xl font-bold">Coloanex</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            setSidebarWidth(isCollapsed ? DEFAULT_WIDTH : COLLAPSED_WIDTH)
          }
          className="cursor-pointer ml-auto"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-6">
          <div className="space-y-1">
            {needsTenantId ? (
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150 cursor-not-allowed opacity-50",
                  location.pathname === "/dashboard"
                    ? "bg-primary/20 text-primary font-semibold border-l-2 border-primary"
                    : "text-muted-foreground/60",
                  isCollapsed && "justify-center px-2",
                )}
                title="Tenant assignment required"
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">Dashboard</span>
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/dashboard"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm transition-all duration-150 cursor-pointer",
                  location.pathname === "/dashboard"
                    ? "bg-primary/15 text-primary font-bold"
                    : "text-foreground/80 font-medium hover:bg-muted hover:text-primary active:bg-muted",
                  isCollapsed && "justify-center px-2 border-l-0 pl-2",
                )}
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                {!isCollapsed && <span>Dashboard</span>}
              </Link>
            )}
          </div>
          <NavSection
            title="Access Control"
            items={accessControlItems}
            isOpen={true}
          />
          <NavSection
            title="Management"
            items={managementItems}
            isOpen={true}
          />
          <NavSection
            title="Loan Management"
            items={loanManagementItems}
            isOpen={true}
          />
        </div>
      </ScrollArea>

      <Separator />

      <div className="p-4">
        {!isCollapsed ? (
          <ProfileDropdown />
        ) : (
          <div className="flex justify-center">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.profileImage} alt={user?.fullName} />
              <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className="flex flex-col bg-background border-r relative shrink-0"
        style={{ width: sidebarWidth }}
      >
        {sidebarContent}
        <div
          className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize group z-20 flex items-center justify-center"
          onMouseDown={handleDragHandleMouseDown}
        >
          <div className="w-0.5 h-16 rounded-full bg-border group-hover:bg-primary/60 group-active:bg-primary transition-colors duration-150" />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-background">
        <div className="bg-background backdrop-blur supports-[backdrop-filter]:bg-background border-b sticky top-0 z-10">
          <div className="px-3 sm:px-4 md:px-6 py-3 md:py-4">
            <div className="mb-3 md:mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                  {title}
                </h1>
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <ThemeSwitcher />
                <NotificationsDropdown />
                <ProfileDropdown />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-start md:items-center justify-between">
              <div className="flex flex-1 flex-col sm:flex-row gap-3 md:gap-4 items-stretch sm:items-center w-full">
                {onSearchChange && (
                  <div className="relative w-full sm:flex-1 sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={searchPlaceholder}
                      value={searchValue}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className={cn("pl-9 w-full", searchClassName)}
                    />
                  </div>
                )}

                {filters.map((filter) => (
                  <div
                    key={filter.name}
                    className="w-full sm:w-auto sm:min-w-[180px] cursor-pointer"
                  >
                    {filter.type === "select" ? (
                      <Select
                        value={filterValues[filter.name] || "all"}
                        onValueChange={(value) =>
                          onFilterChange?.(filter.name, value)
                        }
                      >
                        <SelectTrigger
                          className={cn(
                            "cursor-pointer h-11 bg-background border-border",
                            filter.className,
                          )}
                        >
                          <SelectValue
                            placeholder={filter.placeholder || filter.label}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            All {filter.label}
                          </SelectItem>
                          {filter.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder={filter.placeholder || filter.label}
                        value={filterValues[filter.name] || ""}
                        onChange={(e) =>
                          onFilterChange?.(filter.name, e.target.value)
                        }
                        className={cn(
                          "h-11 bg-background border-border",
                          filter.className,
                        )}
                      />
                    )}
                  </div>
                ))}

                {onRefresh && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className={cn(
                      "h-11 w-11 shrink-0 bg-background border-border hover:bg-muted transition-all duration-200",
                      isRefreshing && "animate-spin-slow",
                    )}
                    title="Refresh Data"
                  >
                    <RefreshCw
                      className={cn("w-4 h-4", isRefreshing && "animate-spin")}
                    />
                  </Button>
                )}
              </div>

              {actions && actions.length > 0 ? (
                <div className="flex gap-2">
                  {actions.map((action, index) => (
                    <Button
                      key={index}
                      onClick={action.onClick}
                      disabled={action.disabled}
                      variant={action.variant || "default"}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              ) : actionLabel && onActionClick ? (
                <Button
                  onClick={onActionClick}
                  className="whitespace-nowrap cursor-pointer ml-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {actionLabel}
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={cn("container mx-auto p-4 md:p-8 shadow-none", className)}
          >
            {isLoading ? (
              <div className="space-y-6">
                {skeletonType === "cards" ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Skeleton className="h-32 rounded-xl" />
                      <Skeleton className="h-32 rounded-xl" />
                      <Skeleton className="h-32 rounded-xl" />
                    </div>
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                  </>
                ) : (
                  <div className="rounded-xl border bg-card overflow-hidden">
                    <div className="p-4 border-b flex gap-4">
                      <Skeleton className="h-5 w-1/4 rounded" />
                      <Skeleton className="h-5 w-1/4 rounded" />
                      <Skeleton className="h-5 w-1/4 rounded" />
                      <Skeleton className="h-5 w-1/4 rounded" />
                    </div>
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div
                        key={i}
                        className="p-4 border-b flex gap-4 items-center"
                      >
                        <Skeleton className="h-4 w-1/4 rounded" />
                        <Skeleton className="h-4 w-1/4 rounded" />
                        <Skeleton className="h-4 w-1/6 rounded" />
                        <Skeleton className="h-6 w-16 rounded-full ml-auto" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              children
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
