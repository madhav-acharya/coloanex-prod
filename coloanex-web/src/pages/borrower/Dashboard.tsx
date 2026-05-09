import BorrowerLayout from "@/components/layouts/BorrowerLayout";
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
  ChevronRight,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function BorrowerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: lendersData, isLoading: isLoadingLenders } = useGetTenantsQuery({ limit: 6, page: 1 });
  const { data: unreadData } = useGetUnreadCountQuery();
  const { data: loansData, isLoading: isLoadingLoans } = useGetLoansQuery({
    page: 1, limit: 4, sortBy: "createdAt", sortOrder: "desc",
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

  const formatStatus = (value?: string) => String(value || "DRAFT").toLowerCase().replace(/_/g, " ").replace(/\b\w/g, m => m.toUpperCase());

  return (
    <BorrowerLayout>
      <div className="max-w-6xl mx-auto space-y-10 pb-12">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-8 mt-4">
          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">{greeting}, {user?.fullName?.split(" ")[0]}</h2>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Overview</h1>
          </div>
          <Button 
            onClick={() => navigate("/lenders")}
            className="rounded-xl h-11 px-6 font-semibold shadow-sm hover:translate-y-[-1px] transition-all"
          >
            <Plus className="w-4 h-4 mr-2" /> New Application
          </Button>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            title="Lenders Available" 
            value={lenders.length} 
            icon={<Building2 className="w-5 h-5" />} 
            color="text-blue-600 bg-blue-50"
          />
          <MetricCard 
            title="Active Partnerships" 
            value={activeLenders} 
            icon={<ShieldCheck className="w-5 h-5" />} 
            color="text-emerald-600 bg-emerald-50"
          />
          <MetricCard 
            title="Pending Alerts" 
            value={unreadCount} 
            icon={<Bell className="w-5 h-5" />} 
            color="text-amber-600 bg-amber-50"
          />
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 flex flex-col justify-between group cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => navigate("/my-loans")}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Total Loans</span>
              <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-3xl font-bold text-foreground mt-2">{loansData?.total || 0}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-lg font-bold text-foreground">Recent Activity</h3>
              <Link to="/my-loans" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center">
                History <ChevronRight className="w-4 h-4 ml-0.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {isLoadingLoans ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl bg-muted/40" />)
              ) : recentLoans.length === 0 ? (
                <EmptyState icon={<FileText className="w-8 h-8" />} message="No recent loan activity found." />
              ) : (
                recentLoans.map((loan) => (
                  <div 
                    key={loan.id} 
                    onClick={() => navigate(`/my-loans/${loan.id}`)}
                    className="group bg-background border border-border/60 hover:border-primary/30 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all hover:bg-muted/5 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-muted-foreground/70" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {loan.purpose || "Loan Request"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-muted/60 text-[10px] font-bold uppercase tracking-wider">{formatStatus(loan.status)}</span>
                          <span>•</span>
                          <span>{loan.createdAt ? format(new Date(loan.createdAt), "MMM dd, yyyy") : ""}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-6">
                      <div className="hidden sm:block">
                        <p className="text-lg font-bold text-foreground flex items-center gap-0.5">
                          <IconCurrencyRupeeNepalese className="w-4 h-4 text-primary" />
                          {Number(loan.requestedAmount || 0).toLocaleString("en-IN")}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Amount</p>
                      </div>
                      <div className="w-8 h-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-lg font-bold text-foreground">Top Lenders</h3>
              <Link to="/lenders" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center">
                Directory <ChevronRight className="w-4 h-4 ml-0.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {isLoadingLenders ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl bg-muted/40" />)
              ) : lenders.length === 0 ? (
                <EmptyState icon={<Building2 className="w-8 h-8" />} message="No lenders available." />
              ) : (
                lenders.slice(0, 5).map((lender) => (
                  <div 
                    key={lender.id} 
                    onClick={() => navigate(`/lenders/${lender.id}`)}
                    className="p-3 rounded-2xl bg-muted/20 border border-transparent hover:border-border/60 hover:bg-background transition-all flex items-center gap-4 cursor-pointer group shadow-sm hover:shadow-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-background border border-border/40 flex items-center justify-center overflow-hidden shrink-0 text-lg font-bold text-primary">
                      {lender.logo ? <img src={lender.logo} alt={lender.name} className="w-full h-full object-cover" /> : lender.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{lender.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={cn("w-1.5 h-1.5 rounded-full", lender.isActive ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{lender.isActive ? "Active" : "Inactive"}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </BorrowerLayout>
  );
}

function MetricCard({ title, value, icon, color }: { title: string; value: number | string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-background border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
      <div className={cn("inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4", color)}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground tracking-tight leading-none">{value}</p>
        <p className="text-xs font-semibold text-muted-foreground mt-2 uppercase tracking-wider">{title}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="py-12 px-6 rounded-2xl border-2 border-dashed border-border/40 flex flex-col items-center text-center">
      <div className="text-muted-foreground/30 mb-3">{icon}</div>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}
