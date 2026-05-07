import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useGetKycsQuery } from "@/apis/kycApi";
import { KycStatus } from "@/types/kyc";
import { CheckCircle2, Clock, ShieldCheck, XCircle } from "lucide-react";

export default function KycOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const getStatusChip = (status?: KycStatus) => {
    if (status === KycStatus.VERIFIED) {
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";
    }
    if (status === KycStatus.REJECTED) {
      return "bg-red-500/10 text-red-600 border-red-500/30";
    }
    return "bg-amber-500/10 text-amber-600 border-amber-500/30";
  };

  const headerText = useMemo(() => {
    if (isLoading) return "Loading KYC submissions";
    if (kycs.length === 0) return "No KYC submissions yet";
    return `KYC submissions (${kycs.length})`;
  }, [isLoading, kycs.length]);

  const statItems = [
    {
      label: "Verified",
      value: verifiedCount,
      icon: CheckCircle2,
      tone: "emerald",
      barClass: "bg-emerald-500/40",
      iconClass: "text-emerald-500",
      bgClass: "bg-emerald-500/10",
    },
    {
      label: "Pending",
      value: pendingCount,
      icon: Clock,
      tone: "amber",
      barClass: "bg-amber-500/40",
      iconClass: "text-amber-500",
      bgClass: "bg-amber-500/10",
    },
    {
      label: "Rejected",
      value: rejectedCount,
      icon: XCircle,
      tone: "rose",
      barClass: "bg-rose-500/40",
      iconClass: "text-rose-500",
      bgClass: "bg-rose-500/10",
    },
  ];

  return (
    <BorrowerLayout>
      <div className="space-y-6">
        <Card className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="pointer-events-none absolute -top-12 right-0 h-28 w-28 rounded-full bg-primary/10 blur-3xl" />
          <CardContent className="relative grid gap-6 p-5 md:grid-cols-[1.1fr_0.9fr] md:p-6">
            <div className="space-y-4">
              <Badge className="rounded-full border-border/30 bg-muted/50 px-3 py-0.5 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Verification status
              </Badge>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground md:text-2xl">
                  One place for every borrower identity check
                </h2>
                <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                  Review submitted documents, monitor review progress, and open
                  any KYC entry for the full verification history.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => navigate("/lenders")}>
                  Browse lenders
                </Button>
                <Button
                  variant="outline"
                  className="border-border text-foreground bg-muted/20"
                  onClick={() => navigate("/dashboard")}
                >
                  Back to dashboard
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-1 lg:grid-cols-3 gap-3">
              {statItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-xl border border-border/30 bg-card p-4 shadow-sm flex flex-col gap-3"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.bgClass}`}
                    >
                      <Icon className={`w-4 h-4 ${item.iconClass}`} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {item.value}
                    </p>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                        {item.label}
                      </p>
                      <div className={`mt-2 h-1.5 rounded-full ${item.barClass}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border/30 bg-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="font-bold text-foreground">Bank-Grade Security</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your documents are encrypted and stored in secure data vaults. We use industry-standard encryption protocols to ensure your data remains private and protected.
            </p>
          </div>
          <div className="rounded-2xl border border-border/30 bg-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-foreground">Fast Verification</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Our automated review system processed 90% of requests within 24 hours. Keep your profile updated to avoid any delays in your loan application process.
            </p>
          </div>
        </section>

        <Card className="rounded-2xl border-border/30 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border/30 pb-4">
            <div className="space-y-1">
              <CardTitle className="text-base">{headerText}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Open a submission to inspect documents and status notes.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : kycs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/30 bg-muted/10 p-8 text-center">
                <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">
                  You have not submitted KYC yet.
                </p>
                <Button
                  className="mt-5"
                  onClick={() => navigate("/lenders")}
                >
                  Browse lenders
                </Button>
              </div>
            ) : (
              kycs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/kyc/${item.id}`)}
                  className="w-full rounded-xl border border-border bg-muted/10 px-4 py-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:bg-muted/20 hover:shadow-md cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {item.fullName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Submitted{" "}
                        {new Date(item.createdAt).toLocaleDateString()}
                        {item.occupation ? ` · ${item.occupation}` : ""}
                      </p>
                    </div>
                    <Badge className={getStatusChip(item.status)}>
                      {item.status}
                    </Badge>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </BorrowerLayout>
  );
}
