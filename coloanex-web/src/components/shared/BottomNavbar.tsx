import { Link, useLocation } from "react-router-dom";
import {
  HandCoins,
  Home,
  Layers3,
  ShieldCheck,
  User,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";

type Variant = "borrower" | "public";

type Tab = {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
};

type MobileBottomNavProps = {
  variant: Variant;
  accountPath?: string;
};

export function BottomNavbar({
  variant,
  accountPath = "/login",
}: MobileBottomNavProps) {
  const location = useLocation();

  const borrowerTabs: Tab[] = [
    { label: "Home", path: "/dashboard", icon: Home },
    { label: "Lenders", path: "/lenders", icon: Users },
    { label: "Loans", path: "/my-loans", icon: HandCoins },
    { label: "KYC", path: "/kyc", icon: ShieldCheck },
    { label: "Account", path: "/profile", icon: User },
  ];

  const publicTabs: Tab[] = [
    { label: "Home", path: "/", icon: Home },
    { label: "Features", path: "/#features", icon: Layers3 },
    { label: "Pricing", path: "/pricing", icon: Zap },
    { label: "Security", path: "/#security", icon: ShieldCheck },
    { label: "Account", path: accountPath, icon: User },
  ];

  const tabs = variant === "borrower" ? borrowerTabs : publicTabs;

  const isActive = (tab: Tab) => {
    if (tab.path === "/") return location.pathname === "/" && !location.hash;
    if (tab.path.includes("#")) {
      const [base, hash] = tab.path.split("#");
      return location.pathname === base && location.hash === `#${hash}`;
    }
    return (
      location.pathname === tab.path ||
      location.pathname.startsWith(`${tab.path}/`)
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[120] md:hidden">
      <nav className="flex items-center justify-around border-t border-border/40 bg-background/95 backdrop-blur-xl px-2 h-16 pb-safe safe-area-bottom">
        {tabs.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="relative flex flex-col items-center justify-center gap-1.5 h-full px-4 transition-all overflow-hidden"
            >
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full transition-all duration-300" />
              )}
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center transition-all",
                  active
                    ? "text-primary"
                    : "text-muted-foreground/70"
                )}
              >
                <Icon
                  className={cn(
                    "transition-all",
                    active ? "w-6 h-6" : "w-5.5 h-5.5"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold leading-none tracking-tight transition-colors",
                  active ? "text-primary" : "text-muted-foreground/60"
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
