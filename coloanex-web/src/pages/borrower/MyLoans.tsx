import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Button } from "@/components/ui/button";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useGetLoansQuery } from "@/apis/loansApi";
import { useGetBorrowerAnalyticsQuery } from "@/apis/analyticsApi";
import type { LoanQuery } from "@/types/loan";
import { LoanStatus } from "@/types/loan";
import { format } from "date-fns";
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Clock3,
  Search,
  ChevronRight,
  ChevronLeft,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/shared/PageShell";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { StatCard } from "@/components/shared/StatCard";
import { GlassCard } from "@/components/shared/GlassCard";
import { Bone } from "@/components/shared/Bone";
import { ParallaxLayer } from "@/components/shared/ParallaxLayer";
import { useRevealOnMount } from "@/hooks/useReveal";

const SceneCanvas = lazy(() => import("@/components/shared/SceneCanvas"));

export default function MyLoans() {
  const navigate = useNavigate();
  useAuth();
  const revealRef = useRevealOnMount([]);

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

  const loans = loansData?.data || [];
  const total = loansData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / (filters.limit || 10)));

  const totalBorrowed = Number(analytics?.totalBorrowed || 0);
  const totalPaid = Number(analytics?.totalPaid || 0);
  const outstanding = Math.max(
    Number(analytics?.totalAmountDue || 0) - totalPaid,
    0,
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

  const getStatusConfig = (status: LoanStatus) => {
    const configs: Record<LoanStatus, { className: string; label: string }> = {
      [LoanStatus.DRAFT]: {
        className: "bg-muted text-muted-foreground",
        label: "Draft",
      },
      [LoanStatus.SUBMITTED]: {
        className: "bg-primary/10 text-primary",
        label: "Submitted",
      },
      [LoanStatus.UNDER_REVIEW]: {
        className: "bg-muted text-foreground",
        label: "Review",
      },
      [LoanStatus.APPROVED]: {
        className: "bg-primary/15 text-primary",
        label: "Approved",
      },
      [LoanStatus.REJECTED]: {
        className: "bg-destructive/10 text-destructive",
        label: "Rejected",
      },
      [LoanStatus.CONTRACT_GENERATED]: {
        className: "bg-primary/10 text-primary",
        label: "Contract",
      },
      [LoanStatus.CONTRACT_SIGNED]: {
        className: "bg-primary/15 text-primary",
        label: "Signed",
      },
      [LoanStatus.LOAN_PROVIDED]: {
        className: "bg-primary/20 text-primary",
        label: "Disbursed",
      },
      [LoanStatus.PARTIALLY_PAID]: {
        className: "bg-muted text-foreground",
        label: "Partial",
      },
      [LoanStatus.PAID]: {
        className: "bg-primary/15 text-primary",
        label: "Paid",
      },
    };
    return configs[status] || configs[LoanStatus.DRAFT];
  };

  return (
    <BorrowerLayout>
      <div className="relative overflow-hidden min-h-[70vh]">
        <Suspense fallback={null}>
          <SceneCanvas
            variant="helix"
            density={22}
            className="opacity-40 h-[260px]"
          />
        </Suspense>
        <PageShell className="relative z-10 space-y-8 pb-16 pt-6">
          <ParallaxLayer speed={0.2} clamp={100}>
            <SectionHeader
              title="My Loan Facilities"
              description="Track applications, balances, and repayment progress"
              actions={
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64 lg:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={searchInput}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() =>
                        setTimeout(() => setShowSuggestions(false), 120)
                      }
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search by purpose..."
                      className="h-11 w-full rounded-2xl border border-border/60 bg-card/60 pl-10 pr-4 text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/20 text-foreground"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-[130] mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-none">
                        {suggestions.map((item) => (
                          <button
                            key={item}
                            className="w-full px-4 py-2.5 text-left transition-colors hover:bg-muted/40 border-b border-border/20 last:border-0"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setSearchInput(item);
                              setDebouncedSearch(item);
                              setShowSuggestions(false);
                            }}
                          >
                            <p className="text-sm font-bold text-foreground">
                              {item}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => navigate("/lenders")}
                    className="rounded-2xl h-11 px-6 font-semibold"
                  >
                    Request Loan
                  </Button>
                </div>
              }
            />
          </ParallaxLayer>

          <div
            ref={revealRef as React.RefObject<HTMLDivElement>}
            className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-4"
          >
            <div data-reveal>
              <StatCard
                title="Total Borrowed"
                value={
                  <span className="flex items-center gap-1">
                    <IconCurrencyRupeeNepalese className="w-5 h-5 text-primary" />
                    {totalBorrowed.toLocaleString("en-IN")}
                  </span>
                }
                icon={<ArrowUpRight className="w-5 h-5" />}
              />
            </div>
            <div data-reveal>
              <StatCard
                title="Total Repaid"
                value={
                  <span className="flex items-center gap-1">
                    <IconCurrencyRupeeNepalese className="w-5 h-5 text-primary" />
                    {totalPaid.toLocaleString("en-IN")}
                  </span>
                }
                icon={<ArrowDownRight className="w-5 h-5" />}
              />
            </div>
            <div data-reveal>
              <StatCard
                title="Outstanding"
                value={
                  <span className="flex items-center gap-1">
                    <IconCurrencyRupeeNepalese className="w-5 h-5 text-primary" />
                    {outstanding.toLocaleString("en-IN")}
                  </span>
                }
                icon={<Clock3 className="w-5 h-5" />}
              />
            </div>
          </div>

          <Bone
            name="borrower-my-loans"
            loading={isLoading || isFetching}
            minHeight={360}
          >
            <GlassCard className="overflow-hidden">
              <div className="p-5 border-b border-border/40 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-foreground tracking-wider flex items-center gap-2 font-[family-name:var(--font-headline)]">
                  <FileText className="w-4 h-4 text-primary" />
                  Applications ({total})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[720px]">
                  <thead>
                    <tr className="border-b border-border/40 text-[11px] font-bold tracking-wider text-muted-foreground">
                      <th className="px-5 py-4 font-bold">Purpose</th>
                      <th className="px-5 py-4 font-bold">Amount</th>
                      <th className="px-5 py-4 font-bold">Term</th>
                      <th className="px-5 py-4 font-bold">Status</th>
                      <th className="px-5 py-4 font-bold">Submitted</th>
                      <th className="px-5 py-4" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {loans.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center text-muted-foreground/50">
                            <Search className="w-10 h-10 mb-3" />
                            <p className="text-sm font-bold">
                              No facilities found
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      loans.map((loan) => {
                        const status = getStatusConfig(loan.status);
                        return (
                          <tr
                            key={loan.id}
                            onClick={() => navigate(`/my-loans/${loan.id}`)}
                            className="group hover:bg-muted/20 cursor-pointer transition-colors"
                          >
                            <td className="px-5 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-muted/40 flex items-center justify-center shrink-0 border border-border/40">
                                  <Building2 className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                    {loan.purpose || "Business Capital"}
                                  </p>
                                  <p className="text-[11px] font-bold text-muted-foreground tracking-wider mt-0.5">
                                    ID: {loan.id.slice(0, 8)}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-5">
                              <div className="flex items-center gap-1 font-bold text-foreground">
                                <IconCurrencyRupeeNepalese className="w-3.5 h-3.5 text-muted-foreground" />
                                {Number(loan.requestedAmount).toLocaleString(
                                  "en-IN",
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-5">
                              <div className="text-xs font-bold text-foreground">
                                {loan.requestedTermMonths} Months
                              </div>
                            </td>
                            <td className="px-5 py-5">
                              <span
                                className={cn(
                                  "inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wider",
                                  status.className,
                                )}
                              >
                                {status.label}
                              </span>
                            </td>
                            <td className="px-5 py-5 text-xs font-bold text-muted-foreground whitespace-nowrap">
                              {loan.createdAt
                                ? format(
                                    new Date(loan.createdAt),
                                    "MMM dd, yyyy",
                                  )
                                : "N/A"}
                            </td>
                            <td className="px-5 py-5 text-right">
                              <div className="w-8 h-8 rounded-xl border border-border/40 inline-flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="p-4 border-t border-border/40 flex items-center justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 rounded-xl border border-border/40"
                    disabled={filters.page === 1}
                    onClick={() =>
                      setFilters((p) => ({
                        ...p,
                        page: (p.page || 1) - 1,
                      }))
                    }
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="text-xs font-bold text-muted-foreground px-4 tracking-wider">
                    Page {filters.page} of {totalPages}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 rounded-xl border border-border/40"
                    disabled={filters.page === totalPages}
                    onClick={() =>
                      setFilters((p) => ({
                        ...p,
                        page: (p.page || 1) + 1,
                      }))
                    }
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </GlassCard>
          </Bone>
        </PageShell>
      </div>
    </BorrowerLayout>
  );
}
