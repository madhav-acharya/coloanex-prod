import type { ComponentType, CSSProperties, ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { ProfileDropdown } from "@/components/shared/ProfileDropdown";
import { NotificationsDropdown } from "@/components/shared/NotificationsDropdown";
import { cn } from "@/lib/utils";
import {
  ArrowLeftRight,
  Building2,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  User,
  Wallet,
} from "lucide-react";

interface BorrowerLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  section?: string;
  matchPaths?: string[];
  focus?: string;
  requiresNoFocus?: boolean;
};

export default function BorrowerLayout({
  children,
  title,
  description,
  className,
}: BorrowerLayoutProps) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeSection = searchParams.get("section");
  const focus = searchParams.get("focus");

  const primaryNav: NavItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/borrower/dashboard",
      icon: LayoutDashboard,
      matchPaths: ["/borrower/dashboard"],
    },
    {
      id: "lenders",
      label: "Lenders",
      href: "/borrower/lenders",
      icon: Building2,
      matchPaths: ["/borrower/lenders"],
    },
    {
      id: "loans",
      label: "My Loans",
      href: "/borrower/my-loans",
      icon: FileText,
      matchPaths: ["/borrower/my-loans"],
      requiresNoFocus: true,
    },
    {
      id: "transactions",
      label: "Transactions",
      href: "/borrower/my-loans?focus=transactions",
      icon: ArrowLeftRight,
      matchPaths: ["/borrower/my-loans"],
      focus: "transactions",
    },
    {
      id: "kyc",
      label: "KYC",
      href: "/borrower/kyc",
      icon: ShieldCheck,
      matchPaths: ["/borrower/kyc"],
    },
  ];

  const accountNav: NavItem[] = [
    {
      id: "wallet",
      label: "Wallet",
      href: "/borrower/profile?section=wallet",
      icon: Wallet,
      section: "wallet",
      matchPaths: ["/borrower/profile"],
    },
    {
      id: "account",
      label: "Account",
      href: "/borrower/profile",
      icon: User,
      section: "account",
      matchPaths: ["/borrower/profile"],
    },
  ];

  const mobileNav: NavItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/borrower/dashboard",
      icon: LayoutDashboard,
      matchPaths: ["/borrower/dashboard"],
    },
    {
      id: "lenders",
      label: "Lenders",
      href: "/borrower/lenders",
      icon: Building2,
      matchPaths: ["/borrower/lenders"],
    },
    {
      id: "loans",
      label: "Loans",
      href: "/borrower/my-loans",
      icon: FileText,
      matchPaths: ["/borrower/my-loans"],
    },
    {
      id: "kyc",
      label: "KYC",
      href: "/borrower/kyc",
      icon: ShieldCheck,
      matchPaths: ["/borrower/kyc"],
    },
    {
      id: "account",
      label: "Account",
      href: "/borrower/profile",
      icon: User,
      section: "account",
      matchPaths: ["/borrower/profile"],
    },
  ];

  const matchesPath = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const isActiveItem = (item: NavItem) => {
    if (item.section && location.pathname === "/borrower/profile") {
      return (activeSection || "account") === item.section;
    }
    if (item.focus) {
      return (
        Boolean(item.matchPaths?.some(matchesPath)) && focus === item.focus
      );
    }
    if (item.requiresNoFocus && focus) {
      return false;
    }
    if (item.matchPaths) {
      return item.matchPaths.some(matchesPath);
    }
    return matchesPath(item.href.split("?")[0]);
  };

  const headerLinkClass = (active: boolean) =>
    cn(
      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors border",
      active
        ? "bg-primary/10 text-primary border-primary/30 shadow-sm"
        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50",
    );

  const mobileLinkClass = (active: boolean) =>
    cn(
      "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition-colors",
      active
        ? "text-primary bg-primary/10"
        : "text-muted-foreground hover:text-foreground",
    );

  const borrowerTheme: CSSProperties = {
    "--background": "210 33% 98%",
    "--foreground": "222 47% 11%",
    "--card": "0 0% 100%",
    "--card-foreground": "222 47% 11%",
    "--muted": "210 20% 95%",
    "--muted-foreground": "215 16% 40%",
    "--border": "214 18% 88%",
    "--input": "214 18% 88%",
    "--ring": "221 83% 53%",
    "--primary": "221 83% 53%",
    "--primary-foreground": "0 0% 100%",
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={borrowerTheme}
    >
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="px-4 md:px-6">
          <div className="grid grid-cols-[auto_1fr_auto] items-center h-16 gap-4">
            <Link to="/borrower/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <img src="/images/logo.png" alt="C" className="w-full h-full" />
              </div>
              <span className="text-lg font-bold">Coloanex</span>
            </Link>

            <div className="hidden lg:flex items-center justify-center gap-3">
              <nav className="flex flex-wrap items-center gap-2">
                {primaryNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveItem(item);
                  return (
                    <Link
                      key={item.id}
                      to={item.href}
                      className={headerLinkClass(isActive)}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <Separator orientation="vertical" className="h-6" />

              <nav className="flex flex-wrap items-center gap-2">
                {accountNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveItem(item);
                  return (
                    <Link
                      key={item.id}
                      to={item.href}
                      className={headerLinkClass(isActive)}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center justify-end gap-2 md:gap-3">
              <ThemeSwitcher />
              <NotificationsDropdown />
              <ProfileDropdown />
            </div>
          </div>
        </div>

        {(title || description) && (
          <div className="border-t border-border/40 bg-muted/5">
            <div className="px-4 md:px-6 py-3">
              {title && (
                <h1 className="text-lg md:text-xl font-bold text-foreground">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="bg-background">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${location.pathname}${location.search}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "container mx-auto p-4 md:p-8 pb-24 lg:pb-12",
              className,
            )}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {mobileNav.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveItem(item);
            return (
              <Link
                key={item.id}
                to={item.href}
                className={mobileLinkClass(isActive)}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
