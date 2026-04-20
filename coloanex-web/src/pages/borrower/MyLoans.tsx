import { useEffect, useMemo, useState } from "react";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useGetLoansQuery } from "@/apis/loansApi";
import {
  useGetBorrowerAnalyticsQuery,
  useGetBorrowerMonthlyLoansQuery,
  useGetLoansByStatusQuery,
} from "@/apis/analyticsApi";
import { useGetTransactionsByEntityQuery } from "@/apis/transactionsApi";
import type { LoanQuery } from "@/types/loan";
import { LoanStatus } from "@/types/loan";
import { format } from "date-fns";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  Clock3,
  History,
  Search,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MyLoans() {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const { data: loansData, isLoading, isFetching } = useGetLoansQuery(filters);
  const { data: analytics } = useGetBorrowerAnalyticsQuery();
  const { data: monthlyLoans = [], isLoading: isMonthlyLoading } =
    useGetBorrowerMonthlyLoansQuery({ months: 12 });
  const { data: loansByStatus = [], isLoading: isStatusLoading } =
    useGetLoansByStatusQuery();
  const { data: transactionsData, isLoading: isTransactionsLoading } =
    useGetTransactionsByEntityQuery(user?.id || "", { skip: !user?.id });

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
        className: "bg-gray-100 text-gray-700 border-gray-200",
        label: "Draft",
      },
      [LoanStatus.SUBMITTED]: {
        className: "bg-blue-100 text-blue-700 border-blue-200",
        label: "Submitted",
      },
      [LoanStatus.UNDER_REVIEW]: {
        className: "bg-amber-100 text-amber-700 border-amber-200",
        label: "Under review",
      },
      [LoanStatus.APPROVED]: {
        className: "bg-green-100 text-green-700 border-green-200",
        label: "Approved",
      },
      [LoanStatus.REJECTED]: {
        className: "bg-red-100 text-red-700 border-red-200",
        label: "Rejected",
      },
      [LoanStatus.CONTRACT_GENERATED]: {
        className: "bg-purple-100 text-purple-700 border-purple-200",
        label: "Contract generated",
      },
      [LoanStatus.CONTRACT_SIGNED]: {
        className: "bg-indigo-100 text-indigo-700 border-indigo-200",
        label: "Contract signed",
      },
      [LoanStatus.LOAN_PROVIDED]: {
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
        label: "Loan provided",
      },
      [LoanStatus.PARTIALLY_PAID]: {
        className: "bg-orange-100 text-orange-700 border-orange-200",
        label: "Partially paid",
      },
      [LoanStatus.PAID]: {
        className: "bg-green-100 text-green-700 border-green-200",
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
        className="h-10 w-full rounded-lg border border-border/30 bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70"
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

  return (
    <BorrowerLayout
      title="My Loans"
      description="Loans, repayments, and portfolio analytics in one place"
    >
      <div className="space-y-5 lg:space-y-7">
        <div className="space-y-3 lg:hidden">
          {renderSearch()}

          <Card className="border-border/30 bg-card">
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-2">
                {[
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
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-border/20 bg-muted/10 p-2.5"
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

          <Card className="border-border/30 bg-card">
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

          <Card className="border-border/30 bg-card">
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
              onClick={() => navigate("/borrower/lenders")}
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
            <div className="space-y-2.5">
              {loans.map((loan) => (
                <Card
                  key={loan.id}
                  className="border-border/30 bg-card cursor-pointer"
                  onClick={() => navigate(`/borrower/my-loans/${loan.id}`)}
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {loan.purpose || "Loan facility"}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {loan.createdAt
                            ? format(new Date(loan.createdAt), "MMM dd, yyyy")
                            : "N/A"}
                        </p>
                      </div>
                      {getStatusBadge(loan.status)}
                    </div>
                    <div className="rounded-lg border border-border/20 p-2.5 bg-muted/10 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-muted-foreground">
                          Amount
                        </p>
                        <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                          <IconCurrencyRupeeNepalese className="w-4 h-4 text-primary" />
                          {Number(loan.requestedAmount).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-muted-foreground">
                          Term
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {loan.requestedTermMonths} mo
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {renderPagination()}

          <Card className="border-border/30 bg-card">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  Recent Transactions
                </p>
                <History className="w-4 h-4 text-primary" />
              </div>
              {isTransactionsLoading ? (
                <Skeleton className="h-20 w-full rounded-lg" />
              ) : !transactionsData || transactionsData.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No recent transactions
                </p>
              ) : (
                transactionsData.slice(0, 5).map((tx: any) => (
                  <div
                    key={tx.id}
                    className="rounded-lg border border-border/20 px-2.5 py-2 flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-foreground truncate">
                        {String(tx.type || "TRANSACTION").replace(/_/g, " ")}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {format(new Date(tx.createdAt), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1 shrink-0 ml-2">
                      <IconCurrencyRupeeNepalese className="w-3.5 h-3.5 text-primary" />
                      {Number(tx.amount || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="hidden lg:block space-y-5">
          <div className="rounded-xl border border-border/30 bg-card px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Loan Portfolio</span>
            <span>{total} total records</span>
          </div>

          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-8 space-y-4">
              <Card className="border-border/20 bg-card">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    {renderSearch("w-full")}
                    <Button
                      className="h-9 px-4"
                      onClick={() => navigate("/borrower/lenders")}
                    >
                      Request Loan
                    </Button>
                  </div>

                  <div className="space-y-2.5">
                    {isLoading || isFetching ? (
                      Array.from({ length: 4 }).map((_, idx) => (
                        <Skeleton
                          key={idx}
                          className="h-20 w-full rounded-lg"
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
                          onClick={() =>
                            navigate(`/borrower/my-loans/${loan.id}`)
                          }
                          className="w-full rounded-lg border border-border/20 bg-muted/5 px-3.5 py-3 text-left hover:bg-muted/10 transition-colors"
                        >
                          <div className="grid grid-cols-[1.5fr_1fr_80px_130px] gap-3 items-center">
                            <div>
                              <p className="text-sm font-semibold text-foreground truncate">
                                {loan.purpose || "Loan facility"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {loan.createdAt
                                  ? format(
                                      new Date(loan.createdAt),
                                      "MMM dd, yyyy",
                                    )
                                  : "N/A"}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                              <IconCurrencyRupeeNepalese className="w-4 h-4 text-primary" />
                              {Number(loan.requestedAmount).toLocaleString(
                                "en-IN",
                              )}
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              {loan.requestedTermMonths} mo
                            </p>
                            <div className="justify-self-end">
                              {getStatusBadge(loan.status)}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {renderPagination()}

              <Card className="border-border/20 bg-card">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">
                      Recent Transactions
                    </p>
                    <History className="w-4 h-4 text-primary" />
                  </div>
                  {isTransactionsLoading ? (
                    <Skeleton className="h-24 w-full rounded-lg" />
                  ) : !transactionsData || transactionsData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No recent transactions
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {transactionsData.slice(0, 6).map((tx: any) => (
                        <div
                          key={tx.id}
                          className="rounded-lg border border-border/20 px-3 py-2.5 flex items-center justify-between"
                        >
                          <div className="min-w-0">
                            <p className="text-xs text-foreground truncate">
                              {String(tx.type || "TRANSACTION").replace(
                                /_/g,
                                " ",
                              )}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {format(new Date(tx.createdAt), "MMM dd, yyyy")}
                            </p>
                          </div>
                          <p className="text-xs font-semibold text-foreground flex items-center gap-1 shrink-0 ml-2">
                            <IconCurrencyRupeeNepalese className="w-3.5 h-3.5 text-primary" />
                            {Number(tx.amount || 0).toLocaleString("en-IN")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="col-span-4 space-y-4 sticky top-28">
              <Card className="border-border/20 bg-card">
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground">
                    Portfolio Summary
                  </p>
                  {[
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
                  ].map((item) => (
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

              <Card className="border-border/20 bg-card">
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
                        className="rounded-lg border border-border/20 px-3 py-2 flex items-center justify-between"
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

              <Card className="border-border/20 bg-card">
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
