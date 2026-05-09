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
  center?: boolean;
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
    { label: "Loans", path: "/my-loans", icon: HandCoins, center: true },
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
      <nav className="flex items-end justify-around border-t border-border/40 bg-background/95 backdrop-blur-xl px-2 pb-safe">
        {tabs.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;

          if (tab.center) {
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className="flex flex-col items-center justify-center -mt-5 mb-1"
              >
                <div
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all border-4",
                    active
                      ? "bg-primary text-primary-foreground border-primary/30 scale-110"
                      : "bg-primary text-primary-foreground border-background"
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider mt-1.5",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="flex flex-col items-center justify-center gap-1 py-2.5 px-3"
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center transition-all",
                  active
                    ? "text-primary"
                    : "text-muted-foreground/70 hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "transition-all",
                    active ? "w-5 h-5" : "w-4.5 h-4.5"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold leading-none tracking-tight",
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
