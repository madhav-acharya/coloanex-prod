import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import type { ComponentType } from "react";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  Building2,
  FileText,
  Bell,
  ShieldCheck,
  Shield,
  Wallet,
  ChevronRight,
  ArrowUpRight,
  Clock3,
  Sparkles,
  User,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useGetTenantsQuery } from "@/apis/tenantsApi";
import { useGetUnreadCountQuery } from "@/apis/notificationsApi";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Landing from "@/pages/public/Landing";
import { TenantSimpleCard } from "@/components/shared/TenantSimpleCard";

export default function BorrowerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: lendersData, isLoading: isLoadingLenders } = useGetTenantsQuery(
    { limit: 6, page: 1 },
  );
  const { data: unreadData } = useGetUnreadCountQuery();
  const unreadCount = unreadData?.count ?? 0;

  const lenders = lendersData?.data || [];
  const activeLenders = lenders.filter((l) => l.isActive).length;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const stats = [
    {
      label: "Total Lenders",
      value: lenders.length,
      icon: Building2,
      color: "text-primary",
      bg: "bg-primary/10",
      hint: "Available in network",
    },
    {
      label: "Active Partners",
      value: activeLenders,
      icon: ShieldCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      hint: "Ready for onboarding",
    },
    {
      label: "Open Alerts",
      value: unreadCount,
      icon: Bell,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      hint: "Action required",
    },
    {
      label: "Risk Profile",
      value: "A+",
      icon: Sparkles,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
      hint: "Stable borrower stance",
    },
  ];

  const primaryQuickActions: Array<{
    label: string;
    note: string;
    icon: ComponentType<{ className?: string }>;
    path: string;
    color: string;
    bg: string;
  }> = [
    {
      label: "Browse Lenders",
      note: "Discover verified institutions",
      icon: Building2,
      path: "/borrower/lenders",
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      label: "My Loans",
      note: "Track your active contracts",
      icon: FileText,
      path: "/borrower/profile?section=my-loans",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Account",
      note: "Manage borrower identity",
      icon: User,
      path: "/borrower/profile",
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      label: "Wallet",
      note: "Connect and manage wallets",
      icon: Wallet,
      path: "/borrower/wallet",
      color: "text-teal-500",
      bg: "bg-teal-500/10",
    },
  ];

  const secondaryQuickActions: Array<{
    label: string;
    note: string;
    icon: ComponentType<{ className?: string }>;
    path: string;
    color: string;
    bg: string;
  }> = [
    {
      label: "Transactions",
      note: "Review repayment movements",
      icon: Wallet,
      path: "/borrower/profile?section=my-loans",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "KYC",
      note: "Manage identity status",
      icon: Shield,
      path: "/borrower/profile?section=account",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
  ];

  const topLenders = lenders.slice(0, 3);

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace("#", "");
    const timer = setTimeout(() => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: "smooth" });
    }, 120);

    return () => clearTimeout(timer);
  }, [location.hash]);

  return (
    <BorrowerLayout>
      <div id="dashboard" className="space-y-6 lg:space-y-10 scroll-mt-32">
        <section className="lg:hidden space-y-5 animate-fade-up">
          <Card className="rounded-3xl border-border/30 bg-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <p className="text-sm text-muted-foreground font-medium">
                    {greeting},
                  </p>
                  <h1 className="text-2xl font-bold leading-tight text-foreground">
                    {user?.fullName?.split(" ")[0] || "Welcome"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Find the best loan for you
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate("/borrower/profile?modal=notifications")
                  }
                  className="relative w-10 h-10 rounded-xl border border-border/40 bg-muted/30 text-foreground flex items-center justify-center"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="mt-5 pt-4 border-t border-border/30 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm font-semibold text-primary">
                  Coloanex
                </span>
                <span className="text-xs text-muted-foreground">
                  - Peer lending simplified
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">
              Overview
            </h2>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {stats.slice(0, 3).map((stat, idx) => (
                <Card
                  key={stat.label}
                  className={cn(
                    "rounded-2xl border-border/30 bg-card",
                    idx === 2 && "col-span-2",
                  )}
                >
                  <CardContent className="p-3">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center mb-1.5",
                        stat.bg,
                      )}
                    >
                      <stat.icon className={cn("w-4 h-4", stat.color)} />
                    </div>
                    <p className="text-base sm:text-lg font-bold text-foreground leading-none">
                      {stat.value}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 leading-tight">
                      {stat.label}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {primaryQuickActions.map((action) => (
                <Link
                  key={action.label}
                  to={action.path}
                  className="rounded-2xl border border-border/30 bg-card p-3.5 flex items-center gap-3"
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center",
                      action.bg,
                    )}
                  >
                    <action.icon className={cn("w-4 h-4", action.color)} />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">
              More Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {secondaryQuickActions.map((action) => (
                <Link
                  key={action.label}
                  to={action.path}
                  className="rounded-2xl border border-border/30 bg-card p-3.5 flex items-center gap-3"
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center",
                      action.bg,
                    )}
                  >
                    <action.icon className={cn("w-4 h-4", action.color)} />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                Featured Lenders
              </h2>
              <Link
                to="/borrower/lenders"
                className="text-sm font-medium text-primary"
              >
                See more
              </Link>
            </div>
            {isLoadingLenders ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-24 w-full rounded-2xl" />
                ))}
              </div>
            ) : lenders.length === 0 ? (
              <Card className="rounded-2xl border-border/30 bg-card">
                <CardContent className="p-6 text-center">
                  <Building2 className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No lenders available
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {lenders.slice(0, 4).map((lender) => (
                  <TenantSimpleCard
                    key={lender.id}
                    className="rounded-2xl"
                    compact
                    narrow
                    onClick={() => navigate(`/borrower/lenders/${lender.id}`)}
                    tenant={lender}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">
              Borrower Journey
            </h2>
            <Card className="rounded-2xl border-border/30 bg-card">
              <CardContent className="p-4 space-y-3">
                {[
                  "Compare lending partners by requirements and trust level",
                  "Complete identity checks once and reuse verification",
                  "Track repayment lifecycle with transparent updates",
                ].map((item, idx) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {item}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="hidden lg:block animate-fade-up">
          <Card className="border-border/40 rounded-3xl overflow-hidden bg-gradient-to-br from-primary/10 via-background to-emerald-500/10">
            <CardContent className="p-5 sm:p-8 md:p-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-4 max-w-2xl">
                  <Badge className="rounded-full bg-primary/15 text-primary border-primary/20 px-3 py-1 text-[10px] uppercase tracking-widest font-black">
                    Borrower Command Center
                  </Badge>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight">
                    {greeting}, {user?.fullName?.split(" ")[0] || "Welcome"}
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Compare lenders, review your loan health, and manage actions
                    from one command center.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto">
                  {primaryQuickActions.map((action) => (
                    <Link
                      key={`${action.path}-${action.label}`}
                      to={action.path}
                      className="group rounded-2xl border border-border/40 bg-background/80 p-4 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            action.bg,
                          )}
                        >
                          <action.icon
                            className={cn("w-5 h-5", action.color)}
                          />
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <p className="mt-4 text-sm font-bold text-foreground">
                        {action.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {action.note}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="hidden lg:block animate-fade-up delay-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {secondaryQuickActions.map((action) => (
              <Link
                key={`desktop-${action.label}`}
                to={action.path}
                className="group rounded-2xl border border-border/20 bg-surface/20 p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      action.bg,
                    )}
                  >
                    <action.icon className={cn("w-5 h-5", action.color)} />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="mt-3 text-sm font-bold text-foreground">
                  {action.label}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {action.note}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="hidden lg:block animate-fade-up delay-200 pb-10">
          <div className="flex items-center justify-between mb-5 px-1">
            <h2 className="text-sm sm:text-base font-black text-foreground uppercase tracking-[0.2em]">
              Partner Lenders
            </h2>
            <Link
              to="/borrower/lenders"
              className="group flex items-center gap-2 text-[10px] font-black text-primary hover:opacity-80 transition-all uppercase tracking-widest"
            >
              See More
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingLenders ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-60 w-full rounded-3xl" />
              ))
            ) : lenders.length === 0 ? (
              <div className="col-span-full py-16 sm:py-20 bg-surface/20 rounded-3xl border border-dashed border-border/20 flex flex-col items-center justify-center text-muted-foreground">
                <Building2 className="w-12 h-12 mb-4 opacity-10" />
                <p className="text-base font-black uppercase tracking-widest">
                  No lending partners found
                </p>
              </div>
            ) : (
              topLenders.map((lender) => (
                <TenantSimpleCard
                  key={lender.id}
                  className="rounded-3xl"
                  compact
                  narrow
                  onClick={() => navigate(`/borrower/lenders/${lender.id}`)}
                  tenant={lender}
                />
              ))
            )}
          </div>
        </section>

        <section className="hidden lg:block animate-fade-up delay-[260ms]">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <Card className="xl:col-span-2 rounded-3xl border-border/20 bg-surface/20">
              <CardContent className="p-5 sm:p-6">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">
                  Borrower Journey
                </h3>
                <div className="mt-5 grid md:grid-cols-3 gap-4">
                  {[
                    {
                      title: "Discover",
                      desc: "Compare lenders and terms with confidence before you apply.",
                    },
                    {
                      title: "Qualify",
                      desc: "Complete KYC and submit documents through guided steps.",
                    },
                    {
                      title: "Repay",
                      desc: "Track schedules and maintain healthy repayment records.",
                    },
                  ].map((step, i) => (
                    <div
                      key={step.title}
                      className="rounded-2xl border border-border/20 bg-background/70 p-4"
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                        Step {i + 1}
                      </p>
                      <p className="mt-2 text-sm font-bold text-foreground">
                        {step.title}
                      </p>
                      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/20 bg-surface/20">
              <CardContent className="p-5 sm:p-6 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">
                  Platform Benefits
                </h3>
                {[
                  "Faster lender discovery",
                  "Transparent approvals",
                  "Structured repayment tracking",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2.5 text-sm text-foreground/90"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="hidden lg:block animate-fade-up delay-300">
          <Card className="rounded-3xl border-border/20 bg-surface/20">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">
                    Next Step
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Continue where you left off and complete your loan journey.
                  </p>
                </div>
                <Link
                  to="/borrower/profile?section=my-loans"
                  className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/15 transition-colors"
                >
                  Resume Loan Activity <Clock3 className="w-3.5 h-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="hidden lg:block h-px" />

        <section className="pt-10 border-t border-border/20">
          <Landing isSubcomponent />
        </section>
      </div>
    </BorrowerLayout>
  );
}
