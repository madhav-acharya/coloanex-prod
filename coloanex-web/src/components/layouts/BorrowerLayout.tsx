import type { ComponentType, ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { ProfileDropdown } from "@/components/shared/ProfileDropdown";
import { NotificationsDropdown } from "@/components/shared/NotificationsDropdown";
import { BottomNavbar } from "@/components/shared/BottomNavbar";
import { cn } from "@/lib/utils";
import {
  Building2,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  User,
} from "lucide-react";

interface BorrowerLayoutProps {
  children: ReactNode;
  className?: string;
}

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  matchPaths?: string[];
  section?: string;
};

export default function BorrowerLayout({
  children,
  className,
}: BorrowerLayoutProps) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeSection = searchParams.get("section");

  const primaryNav: NavItem[] = [
    { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, matchPaths: ["/dashboard"] },
    { id: "lenders", label: "Lenders", href: "/lenders", icon: Building2, matchPaths: ["/lenders"] },
    { id: "loans", label: "My Loans", href: "/my-loans", icon: FileText, matchPaths: ["/my-loans"] },
    { id: "kyc", label: "KYC", href: "/kyc", icon: ShieldCheck, matchPaths: ["/kyc"] },
  ];

  const mobileNav: NavItem[] = [
    { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, matchPaths: ["/dashboard"] },
    { id: "lenders", label: "Lenders", href: "/lenders", icon: Building2, matchPaths: ["/lenders"] },
    { id: "loans", label: "Loans", href: "/my-loans", icon: FileText, matchPaths: ["/my-loans"] },
    { id: "kyc", label: "KYC", href: "/kyc", icon: ShieldCheck, matchPaths: ["/kyc"] },
    { id: "account", label: "Account", href: "/profile", icon: User, section: "account", matchPaths: ["/profile"] },
  ];

  const matchesPath = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const isActiveItem = (item: NavItem) => {
    if (item.section && location.pathname === "/profile") {
      return (activeSection || "account") === item.section;
    }
    if (item.matchPaths) return item.matchPaths.some(matchesPath);
    return matchesPath(item.href.split("?")[0]);
  };

  const mobileLinkClass = (active: boolean) =>
    cn(
      "flex flex-col items-center gap-1 px-2 py-2 text-[11px] font-semibold transition-colors",
      active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground",
    );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link to="/dashboard" className="flex items-center gap-2.5 cursor-pointer group">
              <div className="w-8 h-8 flex items-center justify-center transition-transform group-hover:scale-105">
                <img src="/images/logo.png" alt="C" className="w-full h-full object-contain" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground hidden sm:block">Coloanex</span>
            </Link>

            <div className="hidden lg:flex items-center justify-center flex-1">
              <nav className="flex items-center justify-center gap-4">
                {primaryNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveItem(item);
                  return (
                    <Link
                      key={item.id}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer",
                        isActive
                          ? "text-primary font-bold border-b-2 border-primary pb-1 mt-1"
                          : "text-foreground/80 hover:text-foreground pb-1 mt-1"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center justify-end gap-1.5 md:gap-2">
              <ThemeSwitcher />
              <NotificationsDropdown />
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </header>

      <main className="bg-background">
        <div
          className={cn(
            "container mx-auto p-4 md:p-6 pt-20 md:pt-24 pb-24 lg:pb-8 max-w-7xl",
            className,
          )}
        >
          {children}
        </div>
      </main>

      <BottomNavbar variant="borrower" accountPath="/profile" />
    </div>
  );
}
