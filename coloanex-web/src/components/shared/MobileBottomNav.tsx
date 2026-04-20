import { Link, useLocation } from "react-router-dom";
import {
  HandCoins,
  Home,
  Layers3,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";

type Variant = "borrower" | "public";

type MobileBottomNavProps = {
  variant: Variant;
  accountPath?: string;
};

export function MobileBottomNav({
  variant,
  accountPath = "/login",
}: MobileBottomNavProps) {
  const location = useLocation();

  const borrowerTabs = [
    { label: "Home", path: "/borrower/dashboard", icon: Home },
    { label: "Lenders", path: "/borrower/lenders", icon: Users },
    { label: "Loans", path: "/borrower/my-loans", icon: HandCoins },
    {
      label: "Pricing",
      path: "/borrower/pricing",
      icon: IconCurrencyRupeeNepalese,
    },
    { label: "Account", path: "/borrower/profile", icon: User },
  ];

  const publicTabs = [
    { label: "Home", path: "/", icon: Home },
    { label: "Features", path: "/features", icon: Layers3 },
    { label: "Pricing", path: "/pricing", icon: IconCurrencyRupeeNepalese },
    { label: "Security", path: "/security", icon: ShieldCheck },
    { label: "Account", path: accountPath, icon: User },
  ];

  const tabs = variant === "borrower" ? borrowerTabs : publicTabs;

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[120] border-t border-border/40 bg-background/95 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-2xl grid-cols-5 px-1 py-2">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="flex flex-col items-center justify-center gap-1 rounded-xl py-1.5"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  active
                    ? "bg-emerald-500/15 text-emerald-500"
                    : "text-muted-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
              </div>
              <span
                className={`text-[10px] font-medium leading-none ${
                  active ? "text-emerald-500" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
