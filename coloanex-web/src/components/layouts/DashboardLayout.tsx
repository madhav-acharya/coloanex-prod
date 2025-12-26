import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfileDropdown } from "@/components/shared/ProfileDropdown";
import { NotificationsDropdown } from "@/components/shared/NotificationsDropdown";
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
  const [isCollapsed, setIsCollapsed] = useState(() => window.innerWidth < 768);
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const accessControlItems = [
    {
      title: "Roles",
      icon: <Shield className="w-4 h-4" />,
      href: "/roles",
    },
    {
      title: "Permissions",
      icon: <Key className="w-4 h-4" />,
      href: "/permissions",
    },
  ];

  const managementItems = [
    {
      title: "Users",
      icon: <Users className="w-4 h-4" />,
      href: "/users",
    },
    {
      title: "Tenants",
      icon: <Building2 className="w-4 h-4" />,
      href: "/tenants",
    },
    {
      title: "KYC Requests",
      icon: <FileText className="w-4 h-4" />,
      href: "/kyc-requests",
    },
  ];

  const NavSection = ({
    title,
    items,
    isOpen: initialOpen,
  }: {
    title: string;
    items: { title: string; icon: React.ReactNode; href: string }[];
    isOpen: boolean;
  }) => {
    const [isOpen, setIsOpen] = useState(initialOpen);

    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
            isCollapsed && "justify-center"
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
              return (
                <Link
                  key={item.title}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer",
                    isActive
                      ? "bg-green-100 text-green-700 font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    isCollapsed && "justify-center px-2"
                  )}
                >
                  {item.icon}
                  {!isCollapsed && <span>{item.title}</span>}
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
          onClick={() => setIsCollapsed(!isCollapsed)}
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
            <Link
              to="/dashboard"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer",
                location.pathname === "/dashboard"
                  ? "bg-green-100 text-green-700 font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                isCollapsed && "justify-center px-2"
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              {!isCollapsed && <span>Dashboard</span>}
            </Link>
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
        </div>
      </ScrollArea>

      <Separator />

      <div className="p-4">
        {!isCollapsed ? (
          <ProfileDropdown />
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-medium">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={cn(
          "flex flex-col bg-background border-r transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="px-3 sm:px-4 md:px-6 py-3 md:py-4">
            <div className="mb-3 md:mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  {title}
                </h1>
                {description && (
                  <p className="text-sm text-gray-500 mt-1">{description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <NotificationsDropdown />
                <ProfileDropdown />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-start md:items-center justify-between">
              <div className="flex flex-1 flex-col sm:flex-row gap-3 md:gap-4 items-stretch sm:items-center w-full">
                {onSearchChange && (
                  <div className="relative w-full sm:flex-1 sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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

              {/* Right side: Action Buttons */}
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
