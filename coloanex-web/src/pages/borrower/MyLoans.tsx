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
  CalendarClock,
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
      <div className="space-y-6 lg:space-y-8">
        {/* Header Section */}
        <section className="bg-emerald-500/5 border border-border rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="space-y-3 flex-1">
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/15 transition-colors">Portfolio Insights</Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Track Your Financial Growth</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-3xl">
                Stay updated on your repayment schedules and loan performance. Timely payments help improve your borrower score, unlocking lower interest rates and higher credit limits for future financing.
              </p>
            </div>
            <div className="shrink-0">
               <div className="flex flex-col gap-2 p-4 bg-background/50 backdrop-blur-sm rounded-xl border border-border/40 min-w-[180px]">
                 <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Global Status</span>
                 <div className="flex items-center gap-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                   <span className="text-sm font-bold text-foreground">Healthy Portfolio</span>
                 </div>
               </div>
            </div>
          </div>
        </section>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryItems.map((item) => (
            <Card key={item.label} className="border-border/40 bg-card/30 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </p>
                  <div className={cn("p-2 rounded-lg bg-background border border-border/40 shadow-sm", item.color)}>
                    <item.icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-primary font-bold text-lg">NPR</span>
                  <p className="text-2xl font-bold text-foreground tracking-tight">
                    {item.value.toLocaleString("en-IN")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main List Section */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-primary/10">
                 <Activity className="w-5 h-5 text-primary" />
               </div>
               <div>
                  <h3 className="text-lg font-bold text-foreground">Active Facilities</h3>
                  <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">{total} Total Records Found</p>
               </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              {renderSearch("w-full md:w-[320px]")}
              <Button
                className="h-10 px-6 font-bold uppercase tracking-wider text-[11px] shrink-0"
                onClick={() => navigate("/lenders")}
              >
                Request Loan
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {isLoading || isFetching ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="h-32 w-full rounded-2xl" />
              ))
            ) : loans.length === 0 ? (
              <Card className="border-border/30 bg-card/20 border-dashed">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h4 className="text-lg font-bold text-foreground mb-1">No Loans Found</h4>
                  <p className="text-sm text-muted-foreground">You haven't applied for any loans yet or your search matched no records.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {loans.map((loan) => (
                  <Card
                    key={loan.id}
                    className="border border-border/40 bg-card/40 hover:bg-card/60 hover:border-primary/40 hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden rounded-2xl"
                    onClick={() => navigate(`/my-loans/${loan.id}`)}
                  >
                    <CardContent className="p-0">
                      <div className="p-5 md:p-6 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_1fr_160px] gap-6 items-center">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-background border border-border/40 flex items-center justify-center shrink-0 group-hover:border-primary/20 transition-colors">
                            <Building2 className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Institution & Purpose</p>
                            <h4 className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {loan.purpose || "Business Growth"}
                            </h4>
                            <div className="flex items-center gap-2 mt-1.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground/60">
                              <span>ID: {loan.tenantId.slice(0,10)}</span>
                              <span className="w-1 h-1 rounded-full bg-border" />
                              <span>Financial Corp</span>
                            </div>
                          </div>
                        </div>

                        <div>
                           <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Principal Amount</p>
                           <div className="flex items-baseline gap-1.5">
                             <span className="text-xs font-bold text-primary">NPR</span>
                             <span className="text-xl font-bold text-foreground tracking-tight">
                               {Number(loan.requestedAmount).toLocaleString("en-IN")}
                             </span>
                           </div>
                        </div>

                        <div className="hidden sm:block">
                           <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Loan Duration</p>
                           <p className="text-sm font-bold text-foreground flex items-center gap-2">
                             <Clock3 className="w-4 h-4 text-primary" />
                             {loan.requestedTermMonths} Months Term
                           </p>
                        </div>

                        <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 py-2 lg:py-0 border-t lg:border-t-0 border-border/10 mt-2 lg:mt-0">
                          {getStatusBadge(loan.status)}
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
                            <CalendarClock className="w-3 h-3" />
                            {loan.createdAt ? format(new Date(loan.createdAt), "MMM dd, yyyy") : "N/A"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="py-4">
             {renderPagination()}
          </div>
        </div>

        {/* Analytics Section at Bottom */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-8 border-t border-border/20">
          <Card className="border-border/40 bg-card/20 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Portfolio Distribution
                  </h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Status breakdown of facilities</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {isStatusLoading ? (
                  Array.from({ length: 4 }).map((_, idx) => <Skeleton key={idx} className="h-14 w-full" />)
                ) : loansByStatus.length === 0 ? (
                  <p className="col-span-2 text-xs text-muted-foreground py-10 text-center">No distribution data</p>
                ) : (
                  loansByStatus.slice(0, 6).map((item) => (
                    <div key={item.status} className="p-3 rounded-xl border border-border/40 bg-background/40 flex items-center justify-between group hover:border-primary/20 transition-all">
                      <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">{item.status.replace(/_/g, " ")}</span>
                      <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{item.count}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/20 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Application Momentum
                  </h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Monthly trend analysis</p>
                </div>
              </div>

              <div className="space-y-4">
                {isMonthlyLoading ? (
                  Array.from({ length: 4 }).map((_, idx) => <Skeleton key={idx} className="h-4 w-full" />)
                ) : monthlyLoans.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-10 text-center">No momentum statistics found</p>
                ) : (
                  monthlyLoans.map((row) => {
                    const width = Math.max((Number(row.count || 0) / maxMonthlyCount) * 100, 4);
                    return (
                      <div key={row.month} className="grid grid-cols-[60px_1fr_40px] items-center gap-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{row.month}</span>
                        <div className="h-2.5 rounded-full bg-muted/30 overflow-hidden border border-border/10">
                          <div className="h-full rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.3)] transition-all duration-1000 ease-out" style={{ width: `${width}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-foreground text-right">{row.count}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </BorrowerLayout>
  );
}
