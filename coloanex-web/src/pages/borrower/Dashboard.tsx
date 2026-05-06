import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import type { ComponentType } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useGetTenantsQuery } from "@/apis/tenantsApi";
import { useGetUnreadCountQuery } from "@/apis/notificationsApi";
import { useGetLoansQuery } from "@/apis/loansApi";
import { useGetTransactionsByEntityQuery } from "@/apis/transactionsApi";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeftRight,
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
  const { data: transactionsData, isLoading: isLoadingTransactions } =
    useGetTransactionsByEntityQuery(user?.id || "", { skip: !user?.id });

  const unreadCount = unreadData?.count ?? 0;
  const lenders = lendersData?.data || [];
  const activeLenders = lenders.filter((l) => l.isActive).length;
  const recentLoans = loansData?.data || [];
  const recentTransactions = transactionsData || [];

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
      path: "/borrower/lenders",
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      label: "My Loans",
      note: "Track your loan lifecycle",
      icon: FileText,
      path: "/borrower/my-loans",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Transactions",
      note: "Review repayment history",
      icon: ArrowLeftRight,
      path: "/borrower/my-loans?focus=transactions",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "KYC",
      note: "Manage verification status",
      icon: ShieldCheck,
      path: "/borrower/kyc",
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
      <div className="space-y-8">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="relative overflow-hidden rounded-[32px] border-border/30 bg-gradient-to-br from-primary/5 via-card to-card shadow-[0_18px_70px_rgba(15,23,42,0.06)]">
            <div className="pointer-events-none absolute -top-14 right-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
            <CardContent className="relative p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <Badge className="rounded-full border-border/30 bg-white/70 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Borrower overview
                  </Badge>
                  <p className="text-sm text-muted-foreground font-medium">
                    {greeting},
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-foreground">
                    {user?.fullName?.split(" ")[0] || "Welcome"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Find the best loan for you
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate("/borrower/profile?section=notifications")
                  }
                  className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-border/40 bg-white/70 text-foreground shadow-sm backdrop-blur"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    to={action.path}
                    className="rounded-2xl border border-border/30 bg-white/70 p-3.5 flex flex-col items-start gap-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                  >
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center",
                        action.bg,
                      )}
                    >
                      <action.icon className={cn("w-4 h-4", action.color)} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {action.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {action.note}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <Card
                key={stat.label}
                className="rounded-2xl border-border/30 bg-white/80 shadow-sm"
              >
                <CardContent className="p-4 space-y-2">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center",
                      stat.bg,
                    )}
                  >
                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-[28px] border-border/30 bg-card shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  Featured Lenders
                </h2>
                <Link
                  to="/borrower/lenders"
                  className="text-xs font-semibold text-primary"
                >
                  See all
                </Link>
              </div>
              {isLoadingLenders ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <Skeleton key={idx} className="h-20 w-full rounded-xl" />
                  ))}
                </div>
              ) : lenders.length === 0 ? (
                <div className="rounded-xl border border-border/30 bg-muted/10 p-6 text-center">
                  <Building2 className="w-8 h-8 mx-auto text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No lenders available
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lenders.slice(0, 4).map((lender) => (
                    <button
                      key={lender.id}
                      type="button"
                      onClick={() => navigate(`/borrower/lenders/${lender.id}`)}
                      className="w-full rounded-2xl border border-border/20 bg-white/70 px-4 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
                            {lender.logo ? (
                              <img
                                src={lender.logo}
                                alt={lender.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-base font-bold text-primary">
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
                            "rounded-full px-3 py-1 text-[10px] uppercase tracking-widest",
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

          <Card className="rounded-[28px] border-border/30 bg-card shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  Recent Loans
                </h2>
                <Link
                  to="/borrower/my-loans"
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
                <div className="rounded-xl border border-border/30 bg-muted/10 p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No loans found
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentLoans.map((loan) => (
                    <button
                      key={loan.id}
                      type="button"
                      onClick={() => navigate(`/borrower/my-loans/${loan.id}`)}
                      className="w-full rounded-2xl border border-border/20 bg-white/70 px-4 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {loan.purpose || "Loan request"}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {loan.createdAt
                              ? format(new Date(loan.createdAt), "MMM dd, yyyy")
                              : "-"}
                          </p>
                        </div>
                        <Badge className={statusClass(loan.status)}>
                          {formatStatus(loan.status)}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
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

        <section>
          <Card className="rounded-[28px] border-border/30 bg-card shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  Recent Transactions
                </h2>
                <Link
                  to="/borrower/my-loans?focus=transactions"
                  className="text-xs font-semibold text-primary"
                >
                  View all
                </Link>
              </div>
              {isLoadingTransactions ? (
                <Skeleton className="h-20 w-full rounded-xl" />
              ) : recentTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No recent transactions
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {recentTransactions.slice(0, 4).map((tx) => (
                    <div
                      key={tx.id}
                      className="rounded-2xl border border-border/20 bg-white/70 px-4 py-3 shadow-sm"
                    >
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tx.createdAt), "MMM dd, yyyy")}
                      </p>
                      <p className="text-sm font-semibold text-foreground mt-1">
                        {String(tx.type || "TRANSACTION").replace(/_/g, " ")}
                      </p>
                      <p className="text-xs font-semibold text-foreground mt-2 flex items-center gap-1">
                        <IconCurrencyRupeeNepalese className="w-3.5 h-3.5 text-primary" />
                        {Number(tx.amount || 0).toLocaleString("en-IN")}
                      </p>
                    </div>
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
