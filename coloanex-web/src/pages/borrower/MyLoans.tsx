import { useEffect, useMemo, useState } from "react";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import { useGetLoansQuery } from "@/apis/loansApi";
import {
  useGetBorrowerAnalyticsQuery,
} from "@/apis/analyticsApi";
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
  Filter
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

  const { data: loansData, isLoading, isFetching } = useGetLoansQuery(filters);
  const { data: analytics } = useGetBorrowerAnalyticsQuery();

  const loans = loansData?.data || [];
  const total = loansData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / (filters.limit || 10)));

  const totalBorrowed = Number(analytics?.totalBorrowed || 0);
  const totalPaid = Number(analytics?.totalPaid || 0);
  const outstanding = Math.max(Number(analytics?.totalAmountDue || 0) - totalPaid, 0);

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
  }, [searchInput, loansData?.data]);

  const getStatusConfig = (status: LoanStatus) => {
    const configs: Record<LoanStatus, { className: string; label: string }> = {
      [LoanStatus.DRAFT]: { className: "bg-muted text-muted-foreground", label: "Draft" },
      [LoanStatus.SUBMITTED]: { className: "bg-blue-50 text-blue-600 ring-1 ring-blue-500/20", label: "Submitted" },
      [LoanStatus.UNDER_REVIEW]: { className: "bg-amber-50 text-amber-600 ring-1 ring-amber-500/20", label: "Review" },
      [LoanStatus.APPROVED]: { className: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20", label: "Approved" },
      [LoanStatus.REJECTED]: { className: "bg-rose-50 text-rose-600 ring-1 ring-rose-500/20", label: "Rejected" },
      [LoanStatus.CONTRACT_GENERATED]: { className: "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/20", label: "Contract" },
      [LoanStatus.CONTRACT_SIGNED]: { className: "bg-violet-50 text-violet-600 ring-1 violet-500/20", label: "Signed" },
      [LoanStatus.LOAN_PROVIDED]: { className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30", label: "Disbursed" },
      [LoanStatus.PARTIALLY_PAID]: { className: "bg-orange-50 text-orange-600 ring-1 ring-orange-500/20", label: "Partial" },
      [LoanStatus.PAID]: { className: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20", label: "Paid" },
    };
    return configs[status] || configs[LoanStatus.DRAFT];
  };

  return (
    <BorrowerLayout>
      <div className="max-w-7xl mx-auto space-y-10 pb-12">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-8 mt-4">
          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-1">Portfolio</h2>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">My Loan Facilities</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-64 lg:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchInput}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by purpose..."
                className="h-11 w-full rounded-xl border border-border/60 bg-background/50 pl-10 pr-4 text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-[130] mt-2 w-full overflow-hidden rounded-xl border border-border/60 bg-background shadow-xl">
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
                      <p className="text-sm font-bold text-foreground">{item}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button 
               onClick={() => navigate("/lenders")}
               className="rounded-xl h-11 px-6 font-semibold"
            >
               Request Loan
            </Button>
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SummaryCard label="Total Borrowed" value={totalBorrowed} icon={<ArrowUpRight className="w-5 h-5" />} color="text-indigo-600 bg-indigo-50" />
          <SummaryCard label="Total Repaid" value={totalPaid} icon={<ArrowDownRight className="w-5 h-5" />} color="text-emerald-600 bg-emerald-50" />
          <SummaryCard label="Outstanding Principal" value={outstanding} icon={<Clock3 className="w-5 h-5" />} color="text-amber-600 bg-amber-50" />
        </div>

        <div className="bg-background border border-border/60 rounded-2xl overflow-hidden shadow-sm">
           <div className="p-5 border-b border-border/40 bg-muted/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                 <FileText className="w-4 h-4 text-primary" />
                 Active Applications ({total})
              </h3>
              <div className="flex items-center gap-2">
                 <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-bold text-muted-foreground">
                    <Filter className="w-3.5 h-3.5 mr-1.5" /> Filter
                 </Button>
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b border-border/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                       <th className="px-6 py-4 font-black">Purpose & Institution</th>
                       <th className="px-6 py-4 font-black">Amount</th>
                       <th className="px-6 py-4 font-black">Term</th>
                       <th className="px-6 py-4 font-black">Status</th>
                       <th className="px-6 py-4 font-black">Submitted</th>
                       <th className="px-6 py-4"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border/40">
                    {isLoading || isFetching ? (
                       Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i}><td colSpan={6} className="px-6 py-4"><Skeleton className="h-12 w-full rounded-lg" /></td></tr>
                       ))
                    ) : loans.length === 0 ? (
                       <tr>
                          <td colSpan={6} className="px-6 py-20 text-center">
                             <div className="flex flex-col items-center opacity-40">
                                <Search className="w-10 h-10 mb-3" />
                                <p className="text-sm font-bold">No facilities found</p>
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
                                className="group hover:bg-muted/10 cursor-pointer transition-colors"
                             >
                                <td className="px-6 py-5">
                                   <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center shrink-0 border border-border/40">
                                         <Building2 className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                      </div>
                                      <div className="min-w-0">
                                         <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{loan.purpose || "Business Capital"}</p>
                                         <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Asset ID: {loan.id.slice(0,8)}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-6 py-5">
                                   <div className="flex items-center gap-1 font-bold text-foreground">
                                      <IconCurrencyRupeeNepalese className="w-3.5 h-3.5 text-muted-foreground" />
                                      {Number(loan.requestedAmount).toLocaleString("en-IN")}
                                   </div>
                                </td>
                                <td className="px-6 py-5">
                                   <div className="text-xs font-bold text-foreground">{loan.requestedTermMonths} Months</div>
                                   <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Fixed Term</div>
                                </td>
                                <td className="px-6 py-5">
                                   <span className={cn("inline-flex px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest", status.className)}>
                                      {status.label}
                                   </span>
                                </td>
                                <td className="px-6 py-5 text-xs font-bold text-muted-foreground whitespace-nowrap">
                                   {loan.createdAt ? format(new Date(loan.createdAt), "MMM dd, yyyy") : "N/A"}
                                </td>
                                <td className="px-6 py-5 text-right">
                                   <div className="w-8 h-8 rounded-lg border border-border/40 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
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
              <div className="p-4 border-t border-border/40 bg-muted/5 flex items-center justify-center gap-2">
                 <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 rounded-lg border border-border/40 bg-background"
                    disabled={filters.page === 1}
                    onClick={() => setFilters(p => ({ ...p, page: (p.page || 1) - 1 }))}
                 >
                    <ChevronLeft className="w-4 h-4" />
                 </Button>
                 <div className="text-xs font-black text-muted-foreground px-4 uppercase tracking-widest">
                    Page {filters.page} of {totalPages}
                 </div>
                 <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 rounded-lg border border-border/40 bg-background"
                    disabled={filters.page === totalPages}
                    onClick={() => setFilters(p => ({ ...p, page: (p.page || 1) + 1 }))}
                 >
                    <ChevronRight className="w-4 h-4" />
                 </Button>
              </div>
           )}
        </div>
      </div>
    </BorrowerLayout>
  );
}

function SummaryCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-background border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-5", color)}>
        {icon}
      </div>
      <div>
        <div className="flex items-baseline gap-1">
           <span className="text-[10px] font-bold text-muted-foreground/60">NPR</span>
           <p className="text-2xl font-bold text-foreground tracking-tight">{value.toLocaleString("en-IN")}</p>
        </div>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">{label}</p>
      </div>
    </div>
  );
}
