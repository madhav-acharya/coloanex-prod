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
        <Card className="border-border/30 bg-card">
          <CardHeader>
            <CardTitle>{headerText}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : kycs.length === 0 ? (
              <div className="rounded-xl border border-border/30 bg-muted/10 p-6 text-center">
                <ShieldCheck className="w-9 h-9 mx-auto text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">
                  You have not submitted KYC yet.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => navigate("/borrower/lenders")}
                >
                  Browse Lenders
                </Button>
              </div>
            ) : (
              kycs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/borrower/kyc/${item.id}`)}
                  className="w-full rounded-xl border border-border/30 bg-muted/5 px-4 py-3 text-left hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {item.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Submitted{" "}
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getStatusChip(item.status)}>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
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
