import { useMemo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useGetKycsQuery } from "@/apis/kycApi";
import { KycStatus } from "@/types/kyc";
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  XCircle,
  ArrowRight,
  ChevronLeft,
  Info,
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

export default function KycOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const revealRef = useRevealOnMount([]);

  const { data, isLoading } = useGetKycsQuery(
    user?.id
      ? {
          page: 1,
          limit: 20,
          sortBy: "createdAt",
          sortOrder: "desc",
          userId: user.id,
        }
      : undefined,
    { skip: !user?.id },
  );

  const kycs = data?.data || [];
  const verifiedCount = kycs.filter(
    (item) => item.status === KycStatus.VERIFIED,
  ).length;
  const pendingCount = kycs.filter(
    (item) => item.status === KycStatus.PENDING || !item.status,
  ).length;
  const rejectedCount = kycs.filter(
    (item) => item.status === KycStatus.REJECTED,
  ).length;

  const getStatusConfig = (status?: KycStatus) => {
    if (status === KycStatus.VERIFIED)
      return { className: "bg-primary/15 text-primary", label: "Verified" };
    if (status === KycStatus.REJECTED)
      return {
        className: "bg-destructive/10 text-destructive",
        label: "Rejected",
      };
    return { className: "bg-muted text-foreground", label: "Review" };
  };

  const headerText = useMemo(() => {
    if (isLoading) return "Fetching records...";
    if (kycs.length === 0) return "No records found";
    return `Verified Identities (${kycs.length})`;
  }, [isLoading, kycs.length]);

  return (
    <BorrowerLayout>
      <div className="relative overflow-hidden min-h-[70vh]">
        <Suspense fallback={null}>
          <SceneCanvas
            variant="shield"
            density={22}
            className="opacity-40 h-[260px]"
          />
        </Suspense>
        <PageShell className="relative z-10 space-y-8 pb-16 pt-6">
          <ParallaxLayer speed={0.2} clamp={100}>
            <SectionHeader
              title="Compliance Center"
              description="KYC & identity management across lenders"
              actions={
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/dashboard")}
                    className="rounded-2xl h-11 text-muted-foreground"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Dashboard
                  </Button>
                  <Button
                    onClick={() => navigate("/lenders")}
                    className="rounded-2xl h-11 px-6 font-semibold"
                  >
                    New Verification
                  </Button>
                </div>
              }
            />
          </ParallaxLayer>

          <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-4">
            <StatCard
              title="Active Identities"
              value={verifiedCount}
              icon={<CheckCircle2 className="w-5 h-5" />}
            />
            <StatCard
              title="Pending Approval"
              value={pendingCount}
              icon={<Clock className="w-5 h-5" />}
            />
            <StatCard
              title="Action Required"
              value={rejectedCount}
              icon={<XCircle className="w-5 h-5" />}
            />
          </div>

          <Bone name="borrower-kyc-overview" loading={isLoading} minHeight={280}>
            <GlassCard className="overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-border/40 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold tracking-wider font-[family-name:var(--font-headline)]">
                  {headerText}
                </h3>
                <Badge variant="outline" className="rounded-lg">
                  Institutional Logs
                </Badge>
              </div>
              <div
                ref={revealRef as React.RefObject<HTMLDivElement>}
                className="p-4 sm:p-6 space-y-3"
              >
                {kycs.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center text-muted-foreground/50">
                    <ShieldCheck className="w-12 h-12 mb-4" />
                    <p className="text-sm font-bold tracking-wider">
                      No identity profiles anchored
                    </p>
                  </div>
                ) : (
                  kycs.map((item) => {
                    const status = getStatusConfig(item.status);
                    return (
                      <GlassCard
                        key={item.id}
                        data-reveal
                        onClick={() => navigate(`/borrower/kyc/${item.id}`)}
                        className="group p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/40"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                              {item.fullName}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] font-bold text-muted-foreground tracking-wider">
                                ID: {item.id.slice(0, 8)}
                              </span>
                              {item.occupation && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-border" />
                                  <span className="text-[11px] font-bold text-muted-foreground tracking-wider truncate">
                                    {item.occupation}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <span
                            className={cn(
                              "px-3 py-1 rounded-lg text-[11px] font-bold tracking-wider",
                              status.className,
                            )}
                          >
                            {status.label}
                          </span>
                          <div className="w-9 h-9 rounded-xl border border-border/40 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })
                )}
              </div>
            </GlassCard>
          </Bone>

          <div className="grid sm:grid-cols-2 gap-4">
            <GlassCard className="p-6 space-y-3 border-primary/20 bg-primary/5">
              <h4 className="text-sm font-bold text-primary tracking-wider flex items-center gap-2 font-[family-name:var(--font-headline)]">
                <Info className="w-4 h-4" /> Compliance Standards
              </h4>
              <p className="text-xs font-medium text-foreground/80 leading-relaxed">
                Identity verification is mandatory for institutional credit.
                Documents are stored in encrypted vaults.
              </p>
            </GlassCard>
            <GlassCard className="p-6 space-y-3 border-primary/20 bg-primary/5">
              <h4 className="text-sm font-bold text-primary tracking-wider flex items-center gap-2 font-[family-name:var(--font-headline)]">
                <CheckCircle2 className="w-4 h-4" /> Real-time Settlement
              </h4>
              <p className="text-xs font-medium text-foreground/80 leading-relaxed">
                Verified status unlocks marketplace access and smart contract
                execution for disbursement.
              </p>
            </GlassCard>
          </div>
        </PageShell>
      </div>
    </BorrowerLayout>
  );
}
