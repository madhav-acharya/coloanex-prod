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
import { ShieldCheck } from "lucide-react";

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

  return (
    <BorrowerLayout title="KYC" description="Track your verification status">
      <div className="space-y-6">
        <Card className="relative overflow-hidden rounded-[28px] border-border/30 bg-gradient-to-br from-primary/5 via-card to-card shadow-sm">
          <div className="pointer-events-none absolute -top-12 right-0 h-28 w-28 rounded-full bg-primary/10 blur-3xl" />
          <CardContent className="relative grid gap-6 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
            <div className="space-y-4">
              <Badge className="rounded-full border-border/30 bg-white/70 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Verification status
              </Badge>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                  One place for every borrower identity check
                </h2>
                <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                  Review submitted documents, monitor review progress, and open
                  any KYC entry for the full verification history.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => navigate("/borrower/lenders")}>
                  Browse lenders
                </Button>
                <Button
                  variant="outline"
                  className="border-border/40 bg-white/70"
                  onClick={() => navigate("/borrower/dashboard")}
                >
                  Back to dashboard
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
              {[
                { label: "Verified", value: verifiedCount, tone: "emerald" },
                { label: "Pending", value: pendingCount, tone: "amber" },
                { label: "Rejected", value: rejectedCount, tone: "rose" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border/30 bg-white/75 p-4 shadow-sm"
                >
                  <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-3 text-2xl font-bold text-foreground">
                    {item.value}
                  </p>
                  <div
                    className={`mt-3 h-1.5 rounded-full ${
                      item.tone === "emerald"
                        ? "bg-emerald-500/30"
                        : item.tone === "amber"
                          ? "bg-amber-500/30"
                          : "bg-rose-500/30"
                    }`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-border/30 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border/30 pb-4">
            <div className="space-y-1">
              <CardTitle>{headerText}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Open a submission to inspect documents and status notes.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-20 w-full rounded-2xl" />
                ))}
              </div>
            ) : kycs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/30 bg-white/70 p-8 text-center shadow-sm">
                <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">
                  You have not submitted KYC yet.
                </p>
                <Button
                  className="mt-5"
                  onClick={() => navigate("/borrower/lenders")}
                >
                  Browse lenders
                </Button>
              </div>
            ) : (
              kycs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/borrower/kyc/${item.id}`)}
                  className="w-full rounded-2xl border border-border/20 bg-white/75 px-4 py-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {item.fullName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Submitted{" "}
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getStatusChip(item.status)}>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Occupation: {item.occupation || "-"}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </BorrowerLayout>
  );
}
