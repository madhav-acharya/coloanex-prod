import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      icon: <Shield className="w-4 h-4" />,
      href: "/roles",
      permission: "Read Roles",
    },
    {
      title: "Permissions",
      icon: <Key className="w-4 h-4" />,
      href: "/permissions",
      permission: "Read Permissions",
    },
  ];

  const managementItems = [
    {
      title: "Users",
      icon: <Users className="w-4 h-4" />,
      href: "/users",
      permission: "Read Users",
    },
    {
      title: "Tenants",
      icon: <Building2 className="w-4 h-4" />,
      href: "/tenants",
      permission: "Read Tenants",
    },
    {
      title: "KYC Requests",
      icon: <FileText className="w-4 h-4" />,
      href: "/kyc-requests",
      permission: "Read KYC Documents",
    },
    {
      title: "Loan Requests",
      icon: <Landmark className="w-4 h-4" />,
      href: "/loan-requests",
      permission: "Read Loans",
    },
  ];

  const loanManagementItems = [
    {
      title: "Loan Rules",
      icon: <ScrollText className="w-4 h-4" />,
      href: "/rules",
      permission: "Read Loans",
    },
    {
      title: "Contracts",
      icon: <FileText className="w-4 h-4" />,
      href: "/contracts",
      permission: "Read Loans",
    },
    {
      title: "Transactions",
      icon: <Wallet className="w-4 h-4" />,
      href: "/transactions",
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
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150 cursor-pointer",
                    isActive
                      ? "bg-primary/20 text-primary font-semibold border-l-2 border-primary pl-[10px]"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary active:bg-primary/15",
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
              <img src="/logo.png" alt="C" className="w-full h-full" />
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
                <LayoutDashboard className="w-4 h-4" />
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
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150 cursor-pointer",
                  location.pathname === "/dashboard"
                    ? "bg-primary/20 text-primary font-semibold border-l-2 border-primary pl-[10px]"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary active:bg-primary/15",
                  isCollapsed && "justify-center px-2 border-l-0 pl-2",
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
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
              <AvatarFallback className="bg-green-600 text-white font-medium">
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
        <div className="bg-background backdrop-blur supports-[backdrop-filter]:bg-background border-b sticky top-0 z-10 shadow-sm">
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
                      className="pl-9 w-full"
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
                        <SelectTrigger className="cursor-pointer">
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
                      />
                    )}
                  </div>
                ))}
              </div>

              {actions && actions.length > 0 ? (
                <div className="flex gap-2">
                  {actions.map((action, index) => (
                    <Button
                      key={index}
                      onClick={action.onClick}
                      disabled={action.disabled}
                      variant={action.variant || "default"}
                      className={
                        action.variant === "default" || !action.variant
                          ? "bg-green-600 hover:bg-green-700 text-white whitespace-nowrap cursor-pointer"
                          : "whitespace-nowrap cursor-pointer"
                      }
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              ) : actionLabel && onActionClick ? (
                <Button
                  onClick={onActionClick}
                  className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap cursor-pointer ml-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {actionLabel}
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="container mx-auto p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
