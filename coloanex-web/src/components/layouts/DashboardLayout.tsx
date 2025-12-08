import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfileDropdown } from "@/components/shared/ProfileDropdown";
import {
  Search,
  Plus,
  Shield,
  Users,
  Key,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Bell,
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

export interface FilterField {
  name: string;
  label: string;
  type: "select" | "text";
  options?: { label: string; value: string }[];
  placeholder?: string;
}

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
}: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);

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
                      ? "bg-green-50 text-green-700 font-medium"
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
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-green-600 to-green-700 flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="font-bold text-lg">Coloanex</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="cursor-pointer hidden lg:flex"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <X className="w-4 h-4" />
          )}
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-6">
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
      {/* Mobile Toggle */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden cursor-pointer"
      >
        <Menu className="w-4 h-4" />
      </Button>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r z-50 lg:hidden">
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-background border-r transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      <main className="flex-1 overflow-y-auto bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            {/* Title, Description, Notifications, and Profile */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {description && (
                  <p className="text-sm text-gray-500 mt-1">{description}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative cursor-pointer"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </Button>
                {/* Profile Dropdown */}
                <ProfileDropdown />
              </div>
            </div>

            {/* Search, Filters, and Action Button */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              {/* Left side: Search and Filters */}
              <div className="flex flex-1 flex-col md:flex-row gap-4 items-start md:items-center">
                {/* Search Box */}
                {onSearchChange && (
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder={searchPlaceholder}
                      value={searchValue}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                )}

                {/* Filter Dropdowns */}
                {filters.map((filter) => (
                  <div key={filter.name} className="min-w-[180px]">
                    {filter.type === "select" ? (
                      <Select
                        value={filterValues[filter.name] || ""}
                        onValueChange={(value) =>
                          onFilterChange?.(filter.name, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={filter.placeholder || filter.label}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All {filter.label}</SelectItem>
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

              {/* Right side: Action Button */}
              {actionLabel && onActionClick && (
                <Button
                  onClick={onActionClick}
                  className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap cursor-pointer ml-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {actionLabel}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
