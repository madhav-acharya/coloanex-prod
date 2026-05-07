import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import type { ComponentType } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useGetTenantsQuery } from "@/apis/tenantsApi";
import { useGetUnreadCountQuery } from "@/apis/notificationsApi";
import { useGetLoansQuery } from "@/apis/loansApi";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Bell,
  Building2,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BorrowerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: lendersData, isLoading: isLoadingLenders } = useGetTenantsQuery(
    { limit: 6, page: 1 },
  );
  const { data: unreadData } = useGetUnreadCountQuery();
  const { data: loansData, isLoading: isLoadingLoans } = useGetLoansQuery({
    page: 1,
    limit: 4,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const unreadCount = unreadData?.count ?? 0;
  const lenders = lendersData?.data || [];
  const activeLenders = lenders.filter((l) => l.isActive).length;
  const recentLoans = loansData?.data || [];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const stats = [
    {
      label: "Lenders",
      value: lenders.length,
      icon: Building2,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      label: "Active",
      value: activeLenders,
      icon: ShieldCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Alerts",
      value: unreadCount,
      icon: Bell,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  const quickActions: Array<{
    label: string;
    note: string;
    icon: ComponentType<{ className?: string }>;
    path: string;
    color: string;
    bg: string;
  }> = [
    {
      label: "Lenders",
      note: "Discover trusted partners",
      icon: Building2,
      path: "/lenders",
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      label: "My Loans",
      note: "Track your loan lifecycle",
      icon: FileText,
      path: "/my-loans",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "KYC",
      note: "Manage verification status",
      icon: ShieldCheck,
      path: "/kyc",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
  ];

  const statusClass = (status?: string) => {
    if (!status) return "bg-muted/40 text-muted-foreground border-border";
    if (status === "APPROVED" || status === "PAID") {
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    }
    if (status === "REJECTED") {
      return "bg-red-500/10 text-red-600 border-red-500/20";
    }
    if (status === "UNDER_REVIEW" || status === "PARTIALLY_PAID") {
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    }
    return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
  };

  const formatStatus = (value?: string) =>
    String(value || "DRAFT")
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());

  return (
    <BorrowerLayout>
      <div className="space-y-6">
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="pointer-events-none absolute -top-14 right-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
            <CardContent className="relative p-5 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <Badge className="rounded-full border-border/30 bg-muted/50 px-3 py-0.5 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Borrower overview
                  </Badge>
                  <p className="text-sm text-muted-foreground font-medium mt-2">
                    {greeting},
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-foreground">
                    {user?.fullName?.split(" ")[0] || "Welcome"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Find the best loan for you
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    to={action.path}
                    className="rounded-xl border border-border bg-muted/20 p-3 flex flex-col items-start gap-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:bg-muted/40 cursor-pointer"
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        action.bg,
                      )}
                    >
                      <action.icon className={cn("w-4 h-4", action.color)} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {action.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                        {action.note}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
            {stats.map((stat) => (
              <Card
                key={stat.label}
                className="rounded-xl border border-border bg-card shadow-sm"
              >
                <CardContent className="p-4 flex lg:flex-row items-start lg:items-center gap-3">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                      stat.bg,
                    )}
                  >
                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="rounded-xl border border-border bg-card shadow-sm col-span-full">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-md">
                  <h2 className="text-lg font-bold text-foreground">Portfolio Distribution</h2>
                  <p className="text-sm text-muted-foreground">
                    Your financial health at a glance. Manage your loan utilization and tracking metrics efficiently across different lenders.
                  </p>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Monthly Goal Progress</span>
                    <span className="text-primary font-bold">75%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted/30 overflow-hidden flex">
                    <div className="h-full bg-primary w-[45%] transition-all" />
                    <div className="h-full bg-emerald-500 w-[30%] transition-all" />
                  </div>
                  <div className="flex flex-wrap gap-4 pt-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-[11px] text-muted-foreground font-medium uppercase">Applied</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[11px] text-muted-foreground font-medium uppercase">Active</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                      <span className="text-[11px] text-muted-foreground font-medium uppercase">Pending</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-xl border border-border bg-card shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  Featured Lenders
                </h2>
                <Link
                  to="/lenders"
                  className="text-xs font-semibold text-primary"
                >
                  See all
                </Link>
              </div>
              {isLoadingLenders ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <Skeleton key={idx} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : lenders.length === 0 ? (
                <div className="rounded-xl border border-border bg-muted/10 p-6 text-center">
                  <Building2 className="w-8 h-8 mx-auto text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No lenders available
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lenders.slice(0, 4).map((lender) => (
                    <button
                      key={lender.id}
                      type="button"
                      onClick={() => navigate(`/lenders/${lender.id}`)}
                      className="w-full rounded-xl border border-border/20 bg-muted/10 px-4 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:bg-muted/20 hover:shadow-md cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
                            {lender.logo ? (
                              <img
                                src={lender.logo}
                                alt={lender.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-bold text-primary">
                                {lender.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {lender.name}
                            </p>
                            {lender.address && (
                              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                {lender.address}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-widest shrink-0",
                            lender.isActive
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-muted/40 text-muted-foreground border-border",
                          )}
                        >
                          {lender.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-border bg-card shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  Recent Loans
                </h2>
                <Link
                  to="/my-loans"
                  className="text-xs font-semibold text-primary"
                >
                  View all
                </Link>
              </div>
              {isLoadingLoans ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <Skeleton key={idx} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : recentLoans.length === 0 ? (
                <div className="rounded-xl border border-border bg-muted/10 p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No loans found
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentLoans.map((loan) => (
                    <button
                      key={loan.id}
                      type="button"
                      onClick={() => navigate(`/my-loans/${loan.id}`)}
                      className="w-full rounded-xl border border-border/20 bg-muted/10 px-4 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:bg-muted/20 hover:shadow-md cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {loan.purpose || "Loan request"}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {loan.createdAt
                              ? format(new Date(loan.createdAt), "MMM dd, yyyy")
                              : "-"}
                          </p>
                        </div>
                        <Badge className={statusClass(loan.status)}>
                          {formatStatus(loan.status)}
                        </Badge>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <IconCurrencyRupeeNepalese className="w-3.5 h-3.5 text-primary" />
                        {Number(loan.requestedAmount || 0).toLocaleString(
                          "en-IN",
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </BorrowerLayout>
  );
}
