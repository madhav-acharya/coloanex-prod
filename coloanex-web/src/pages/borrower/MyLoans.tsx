import { useEffect, useMemo, useState } from "react";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import { useGetLoansQuery } from "@/apis/loansApi";
import {
  useGetBorrowerAnalyticsQuery,
  useGetBorrowerMonthlyLoansQuery,
  useGetLoansByStatusQuery,
} from "@/apis/analyticsApi";
import type { LoanQuery } from "@/types/loan";
import { LoanStatus } from "@/types/loan";
import { format } from "date-fns";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  ChevronDown,
  Clock3,
  Search,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MyLoans() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: _user } = useAuth();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [filters, setFilters] = useState<LoanQuery>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      search: debouncedSearch || undefined,
    }));
  }, [debouncedSearch]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("focus") !== "transactions") return;
    params.delete("focus");
    const nextSearch = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true },
    );
  }, [location.pathname, location.search, navigate]);

  const { data: loansData, isLoading, isFetching } = useGetLoansQuery(filters);
  const { data: analytics } = useGetBorrowerAnalyticsQuery();
  const { data: monthlyLoans = [], isLoading: isMonthlyLoading } =
    useGetBorrowerMonthlyLoansQuery({ months: 12 });
  const { data: loansByStatus = [], isLoading: isStatusLoading } =
    useGetLoansByStatusQuery();

  const loans = loansData?.data || [];
  const total = loansData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / (filters.limit || 10)));

  const totalBorrowed = Number(analytics?.totalBorrowed || 0);
  const totalPaid = Number(analytics?.totalPaid || 0);
  const totalAmountDue = Number(analytics?.totalAmountDue || 0);
  const totalInterest = Number(analytics?.totalInterest || 0);
  const outstanding = Math.max(totalAmountDue - totalPaid, 0);

  const maxMonthlyCount = Math.max(
    ...monthlyLoans.map((m) => Number(m.count || 0)),
    1,
  );

  const suggestions = useMemo(() => {
    if (!searchInput.trim()) return [];
    const q = searchInput.toLowerCase();
    const seen = new Set<string>();
    return loans
      .filter((loan) => (loan.purpose || "").toLowerCase().includes(q))
      .filter((loan) => {
        const purpose = loan.purpose || "Loan";
        if (seen.has(purpose)) return false;
        seen.add(purpose);
        return true;
      })
      .slice(0, 5)
      .map((loan) => loan.purpose || "Loan");
  }, [searchInput, loans]);

  const getStatusBadge = (status: LoanStatus) => {
    const statusConfig: Record<
      LoanStatus,
      { className: string; label: string }
    > = {
      [LoanStatus.DRAFT]: {
        className: "bg-muted/40 text-muted-foreground border-border",
        label: "Draft",
      },
      [LoanStatus.SUBMITTED]: {
        className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        label: "Submitted",
      },
      [LoanStatus.UNDER_REVIEW]: {
        className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        label: "Under review",
      },
      [LoanStatus.APPROVED]: {
        className: "bg-green-500/10 text-green-600 border-green-500/20",
        label: "Approved",
      },
      [LoanStatus.REJECTED]: {
        className: "bg-red-500/10 text-red-600 border-red-500/20",
        label: "Rejected",
      },
      [LoanStatus.CONTRACT_GENERATED]: {
        className: "bg-purple-500/10 text-purple-600 border-purple-500/20",
        label: "Contract generated",
      },
      [LoanStatus.CONTRACT_SIGNED]: {
        className: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
        label: "Contract signed",
      },
      [LoanStatus.LOAN_PROVIDED]: {
        className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        label: "Loan provided",
      },
      [LoanStatus.PARTIALLY_PAID]: {
        className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
        label: "Partially paid",
      },
      [LoanStatus.PAID]: {
        className: "bg-green-500/10 text-green-600 border-green-500/20",
        label: "Paid",
      },
    };
    const config = statusConfig[status] || statusConfig[LoanStatus.DRAFT];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const renderSearch = (className?: string) => (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        value={searchInput}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Search loans by purpose"
        className="h-10 w-full rounded-lg border border-border/30 bg-muted/20 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary/30"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border/30 bg-card shadow-lg overflow-hidden">
          {suggestions.map((item) => (
            <button
              key={item}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-muted/40 transition-colors"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setSearchInput(item);
                setDebouncedSearch(item);
                setShowSuggestions(false);
              }}
            >
              <p className="text-sm text-foreground truncate">{item}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const currentPage = filters.page || 1;
    return (
      <div className="flex justify-center">
        <div className="flex items-center gap-1 p-1 rounded-lg border border-border/20 bg-card">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={currentPage === 1}
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: currentPage - 1 }))
            }
          >
            <ChevronDown className="w-4 h-4 -rotate-90" />
          </Button>
          {Array.from({ length: totalPages })
            .slice(0, 7)
            .map((_, i) => {
              const pageNo = i + 1;
              return (
                <Button
                  key={pageNo}
                  variant={currentPage === pageNo ? "default" : "ghost"}
                  className={cn(
                    "h-7 w-7 text-xs px-0",
                    currentPage === pageNo &&
                      "bg-primary text-primary-foreground",
                  )}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: pageNo }))
                  }
                >
                  {pageNo}
                </Button>
              );
            })}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={currentPage === totalPages}
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: currentPage + 1 }))
            }
          >
            <ChevronDown className="w-4 h-4 rotate-90" />
          </Button>
        </div>
      </div>
    );
  };

  const summaryItems = [
    {
      label: "Borrowed",
      value: totalBorrowed,
      icon: ArrowUpRight,
      color: "text-primary",
    },
    {
      label: "Paid",
      value: totalPaid,
      icon: ArrowDownRight,
      color: "text-emerald-500",
    },
    {
      label: "Outstanding",
      value: outstanding,
      icon: Clock3,
      color: "text-amber-500",
    },
    {
      label: "Interest",
      value: totalInterest,
      icon: AlertCircle,
      color: "text-rose-500",
    },
  ];

  return (
    <BorrowerLayout>
      <div className="space-y-5 lg:space-y-6">
        <section className="bg-emerald-500/5 border border-border rounded-xl p-5 md:p-6 mb-2">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="space-y-2 flex-1">
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/15 transition-colors mb-2">Portfolio Insights</Badge>
              <h2 className="text-xl font-bold text-foreground">Track Your Financial Growth</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Stay updated on your repayment schedules and loan performance. Timely payments help improve your borrower score, unlocking lower interest rates and higher credit limits for future financing.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 shrink-0">
               <div className="flex flex-col gap-1">
                 <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Global Status</span>
                 <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-sm font-bold text-foreground">Healthy Portfolio</span>
                 </div>
               </div>
            </div>
          </div>
        </section>

        <div className="space-y-3 lg:hidden">
          {renderSearch()}

          <Card className="border-border bg-card">
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-2">
                {summaryItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-border bg-muted/10 p-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground">
                        {item.label}
                      </p>
                      <item.icon className={cn("w-3.5 h-3.5", item.color)} />
                    </div>
                    <p className="mt-1 text-sm font-semibold text-foreground flex items-center gap-1">
                      <IconCurrencyRupeeNepalese className="w-3.5 h-3.5 text-primary" />
                      {item.value.toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  Loans by Status
                </p>
                <Activity className="w-4 h-4 text-primary" />
              </div>
              {isStatusLoading ? (
                <Skeleton className="h-20 w-full rounded-lg" />
              ) : loansByStatus.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No status records found.
                </p>
              ) : (
                loansByStatus.slice(0, 5).map((item) => (
                  <div
                    key={item.status}
                    className="rounded-lg border border-border/20 px-2.5 py-2 flex items-center justify-between"
                  >
                    <span className="text-xs text-foreground">
                      {item.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs font-semibold text-primary">
                      {item.count}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  Monthly Loan Trend
                </p>
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              {isMonthlyLoading ? (
                <Skeleton className="h-20 w-full rounded-lg" />
              ) : monthlyLoans.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No monthly trend records found.
                </p>
              ) : (
                monthlyLoans.map((row) => {
                  const width = Math.max(
                    (Number(row.count || 0) / maxMonthlyCount) * 100,
                    4,
                  );
                  return (
                    <div
                      key={row.month}
                      className="grid grid-cols-[56px_1fr_auto] gap-2 items-center"
                    >
                      <span className="text-[11px] text-muted-foreground">
                        {row.month}
                      </span>
                      <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-foreground">
                        {row.count}
                      </span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">My Loans</p>
            <Button
              size="sm"
              className="h-8"
              onClick={() => navigate("/lenders")}
            >
              Request
            </Button>
          </div>

          {isLoading || isFetching ? (
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          ) : loans.length === 0 ? (
            <Card className="border-border/30 bg-card">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">No loans found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {loans.map((loan) => (
                <Card
                  key={loan.id}
                  className="border border-border/60 bg-card hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => navigate(`/my-loans/${loan.id}`)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground/60 mb-0.5">Loan Facility</p>
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          {loan.purpose || "Business Growth"}
                        </p>
                      </div>
                      {getStatusBadge(loan.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 py-3 border-y border-border/10">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground/60">Amount</p>
                        <p className="text-sm font-bold text-foreground flex items-center gap-1">
                          <IconCurrencyRupeeNepalese className="w-3.5 h-3.5 text-primary" />
                          {Number(loan.requestedAmount).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground/60">Duration</p>
                        <p className="text-sm font-bold text-foreground">
                          {loan.requestedTermMonths} Months
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className="w-5 h-5 rounded bg-muted/20 flex items-center justify-center">
                            <Building2 className="w-3 h-3 text-muted-foreground" />
                         </div>
                         <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{loan.tenantId.slice(0,8)}...</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        {loan.createdAt ? format(new Date(loan.createdAt), "MMM dd, yyyy") : "N/A"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {renderPagination()}
        </div>

        <div className="hidden lg:block space-y-5">
          <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Loan Portfolio</span>
            <span>{total} total records</span>
          </div>

          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-8 space-y-4">
              <Card className="border-border bg-card">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    {renderSearch("w-full")}
                    <Button
                      className="h-9 px-4 shrink-0"
                      onClick={() => navigate("/lenders")}
                    >
                      Request Loan
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {isLoading || isFetching ? (
                      Array.from({ length: 4 }).map((_, idx) => (
                        <Skeleton
                          key={idx}
                          className="h-16 w-full rounded-lg"
                        />
                      ))
                    ) : loans.length === 0 ? (
                      <div className="rounded-lg border border-border/20 bg-muted/10 p-6 text-center">
                        <p className="text-sm text-muted-foreground">
                          No loans found
                        </p>
                      </div>
                    ) : (
                      loans.map((loan) => (
                        <button
                          key={loan.id}
                          type="button"
                          onClick={() => navigate(`/my-loans/${loan.id}`)}
                          className="w-full rounded-xl border border-border bg-card p-4 text-left hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group"
                        >
                          <div className="grid grid-cols-[1.5fr_1fr_80px_130px] gap-4 items-center">
                            <div className="min-w-0">
                              <p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground/60 mb-0.5">Facility Purpose</p>
                              <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                {loan.purpose || "Loan facility"}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <div className="w-4 h-4 rounded bg-muted/20 flex items-center justify-center">
                                  <Building2 className="w-2.5 h-2.5 text-muted-foreground" />
                                </div>
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{loan.tenantId.slice(0,10)} FINANCIAL</span>
                              </div>
                            </div>
                            <div>
                               <p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground/60 mb-0.5">Total Principal</p>
                               <p className="text-sm font-bold text-foreground flex items-center gap-1">
                                <IconCurrencyRupeeNepalese className="w-3.5 h-3.5 text-primary" />
                                {Number(loan.requestedAmount).toLocaleString("en-IN")}
                               </p>
                            </div>
                            <div>
                               <p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground/60 mb-0.5">Term</p>
                               <p className="text-sm font-bold text-foreground uppercase">{loan.requestedTermMonths} Mo</p>
                            </div>
                            <div className="justify-self-end flex flex-col items-end gap-1.5">
                              {getStatusBadge(loan.status)}
                              <p className="text-[10px] text-muted-foreground font-medium">
                                {loan.createdAt ? format(new Date(loan.createdAt), "MMM dd, yyyy") : "N/A"}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {renderPagination()}
            </div>

            <div className="col-span-4 space-y-4 sticky top-24">
              <Card className="border-border bg-card">
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground">
                    Portfolio Summary
                  </p>
                  {summaryItems.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground inline-flex items-center gap-1.5">
                        <item.icon className={cn("w-3.5 h-3.5", item.color)} />
                        {item.label}
                      </span>
                      <span className="font-semibold text-foreground inline-flex items-center gap-1">
                        <IconCurrencyRupeeNepalese className="w-3.5 h-3.5 text-primary" />
                        {item.value.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">
                      Loans by Status
                    </p>
                    <Activity className="w-4 h-4 text-primary" />
                  </div>
                  {isStatusLoading ? (
                    <Skeleton className="h-24 w-full rounded-lg" />
                  ) : loansByStatus.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No status records found.
                    </p>
                  ) : (
                    loansByStatus.slice(0, 6).map((item) => (
                      <div
                        key={item.status}
                        className="rounded-xl border border-border px-3 py-2 flex items-center justify-between"
                      >
                        <span className="text-sm text-foreground">
                          {item.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-sm font-semibold text-primary">
                          {item.count}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">
                      Monthly Trend
                    </p>
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  {isMonthlyLoading ? (
                    <Skeleton className="h-20 w-full rounded-lg" />
                  ) : monthlyLoans.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No monthly trend records found.
                    </p>
                  ) : (
                    monthlyLoans.map((row) => {
                      const width = Math.max(
                        (Number(row.count || 0) / maxMonthlyCount) * 100,
                        4,
                      );
                      return (
                        <div
                          key={row.month}
                          className="grid grid-cols-[58px_1fr_auto] items-center gap-2.5"
                        >
                          <span className="text-xs text-muted-foreground">
                            {row.month}
                          </span>
                          <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-foreground">
                            {row.count}
                          </span>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </BorrowerLayout>
  );
}
