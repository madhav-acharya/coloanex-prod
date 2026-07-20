import { lazy, Suspense } from "react";
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
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/shared/PageShell";
import { StatCard } from "@/components/shared/StatCard";
import { GlassCard } from "@/components/shared/GlassCard";
import { Bone } from "@/components/shared/Bone";
import { ParallaxLayer } from "@/components/shared/ParallaxLayer";
import { useRevealOnMount } from "@/hooks/useReveal";

const SceneCanvas = lazy(() => import("@/components/shared/SceneCanvas"));

export default function BorrowerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const revealRef = useRevealOnMount([]);
  const { data: lendersData, isLoading: isLoadingLenders } = useGetTenantsQuery({
    limit: 6,
    page: 1,
  });
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
  const isLoading = isLoadingLenders || isLoadingLoans;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const formatStatus = (value?: string) =>
    String(value || "DRAFT")
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());

  return (
    <BorrowerLayout>
      <div className="relative overflow-hidden min-h-[70vh]">
        <Suspense fallback={null}>
          <SceneCanvas
            variant="network"
            density={22}
            className="opacity-45 h-[min(420px,55vh)]"
          />
        </Suspense>
        <PageShell className="relative z-10 space-y-12 pb-16 pt-6">
          <ParallaxLayer speed={0.22} clamp={120}>
            <div className="space-y-8 max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                CoLoanEx
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground font-[family-name:var(--font-headline)] leading-[1.1]">
                {greeting}, {user?.fullName?.split(" ")[0] || "there"}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                Your borrowing workspace — track facilities, browse lenders, and
                stay ahead of repayments.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  onClick={() => navigate("/lenders")}
                  className="rounded-2xl h-12 px-7 font-semibold text-sm"
                >
                  <Plus className="w-4 h-4 mr-2" /> New Application
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/my-loans")}
                  className="rounded-2xl h-12 px-7 font-semibold text-sm border-border"
                >
                  View Portfolio
                </Button>
              </div>
            </div>
          </ParallaxLayer>

          <Bone name="borrower-dashboard" loading={isLoading} minHeight={280}>
            <div
              ref={revealRef as React.RefObject<HTMLDivElement>}
              className="space-y-12"
            >
              <div className="grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
                <div data-reveal>
                  <StatCard
                    title="Lenders Available"
                    value={lenders.length}
                    icon={<Building2 className="w-5 h-5" />}
                  />
                </div>
                <div data-reveal>
                  <StatCard
                    title="Active Partnerships"
                    value={activeLenders}
                    icon={<ShieldCheck className="w-5 h-5" />}
                  />
                </div>
                <div data-reveal>
                  <StatCard
                    title="Pending Alerts"
                    value={unreadCount}
                    icon={<Bell className="w-5 h-5" />}
                    onClick={() => navigate("/activity-logs")}
                  />
                </div>
                <div data-reveal>
                  <StatCard
                    title="Total Loans"
                    value={loansData?.total || 0}
                    icon={<FileText className="w-5 h-5" />}
                    onClick={() => navigate("/my-loans")}
                    hint="View portfolio"
                  />
                </div>
              </div>

              <div className="grid lg:grid-cols-5 gap-8 lg:gap-10">
                <section className="lg:col-span-3 space-y-5" data-reveal>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-foreground font-[family-name:var(--font-headline)]">
                      Recent Activity
                    </h2>
                    <Link
                      to="/my-loans"
                      className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors inline-flex items-center"
                    >
                      History <ChevronRight className="w-4 h-4 ml-0.5" />
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {recentLoans.length === 0 ? (
                      <EmptyState
                        icon={<FileText className="w-8 h-8" />}
                        message="No recent loan activity found."
                      />
                    ) : (
                      recentLoans.map((loan) => (
                        <GlassCard
                          key={loan.id}
                          onClick={() => navigate(`/my-loans/${loan.id}`)}
                          className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:border-primary/30"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {loan.purpose || "Loan Request"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1.5 flex flex-wrap items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-lg bg-muted text-[11px] font-bold tracking-wider text-foreground">
                                  {formatStatus(loan.status)}
                                </span>
                                <span>
                                  {loan.createdAt
                                    ? format(
                                        new Date(loan.createdAt),
                                        "MMM dd, yyyy",
                                      )
                                    : ""}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-3 sm:gap-5 shrink-0">
                            <div className="hidden sm:block">
                              <p className="text-base font-bold text-foreground flex items-center gap-0.5 justify-end">
                                <IconCurrencyRupeeNepalese className="w-3.5 h-3.5 text-primary" />
                                {Number(
                                  loan.requestedAmount || 0,
                                ).toLocaleString("en-IN")}
                              </p>
                              <p className="text-[11px] font-bold text-muted-foreground tracking-wider">
                                Amount
                              </p>
                            </div>
                            <div className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground">
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        </GlassCard>
                      ))
                    )}
                  </div>
                </section>

                <section className="lg:col-span-2 space-y-5" data-reveal>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-foreground font-[family-name:var(--font-headline)]">
                      Top Lenders
                    </h2>
                    <Link
                      to="/lenders"
                      className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors inline-flex items-center"
                    >
                      Directory <ChevronRight className="w-4 h-4 ml-0.5" />
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {lenders.length === 0 ? (
                      <EmptyState
                        icon={<Building2 className="w-8 h-8" />}
                        message="No lenders available."
                      />
                    ) : (
                      lenders.slice(0, 5).map((lender) => (
                        <GlassCard
                          key={lender.id}
                          onClick={() => navigate(`/lenders/${lender.id}`)}
                          className="p-3.5 flex items-center gap-4"
                        >
                          <div className="w-11 h-11 rounded-2xl bg-muted/60 border border-border/40 flex items-center justify-center overflow-hidden shrink-0 text-lg font-bold text-primary">
                            {lender.logo ? (
                              <img
                                src={lender.logo}
                                alt={lender.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              lender.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">
                              {lender.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  lender.isActive
                                    ? "bg-primary"
                                    : "bg-muted-foreground/30",
                                )}
                              />
                              <span className="text-[11px] font-bold text-muted-foreground tracking-wider">
                                {lender.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                        </GlassCard>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </div>
          </Bone>
        </PageShell>
      </div>
    </BorrowerLayout>
  );
}

function EmptyState({
  icon,
  message,
}: {
  icon: React.ReactNode;
  message: string;
}) {
  return (
    <div className="py-12 px-6 rounded-2xl border border-dashed border-border/50 flex flex-col items-center text-center bg-card/40">
      <div className="text-muted-foreground/40 mb-3">{icon}</div>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}
