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
      <nav className="flex items-stretch justify-between border-t border-border/40 bg-background/95 backdrop-blur-xl px-1 min-[360px]:px-2 h-14 min-[360px]:h-16 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="relative flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 min-[360px]:gap-1 h-full px-0.5 transition-all"
            >
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 min-[360px]:w-10 h-0.5 min-[360px]:h-1 bg-primary rounded-b-full" />
              )}
              <Icon
                className={cn(
                  "shrink-0 transition-all",
                  active
                    ? "w-5 h-5 min-[360px]:w-6 min-[360px]:h-6 text-primary"
                    : "w-[18px] h-[18px] min-[360px]:w-5 min-[360px]:h-5 text-muted-foreground/70",
                )}
              />
              <span
                className={cn(
                  "text-[9px] min-[360px]:text-[10px] font-bold leading-tight tracking-tight truncate max-w-full px-0.5",
                  active ? "text-primary" : "text-muted-foreground/60",
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
