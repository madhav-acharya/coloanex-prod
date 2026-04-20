import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetKycQuery } from "@/apis/kycApi";
import { KycStatus } from "@/types/kyc";

export default function BorrowerKycStatus() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: kyc, isLoading } = useGetKycQuery(id || "", {
    skip: !id,
  });

  const statusLabel = useMemo(() => {
    if (!kyc?.status) return "Unknown";
    if (kyc.status === KycStatus.VERIFIED) return "Verified";
    if (kyc.status === KycStatus.PENDING) return "Under Review";
    if (kyc.status === KycStatus.REJECTED) return "Rejected";
    return kyc.status;
  }, [kyc?.status]);

  const statusStyle =
    kyc?.status === KycStatus.VERIFIED
      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
      : kyc?.status === KycStatus.PENDING
        ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
        : "bg-red-500/10 text-red-600 border-red-500/30";

  return (
    <BorrowerLayout
      title="KYC Status"
      description="Review your verification request status"
    >
      <div className="max-w-3xl space-y-4">
        <Card className="border-border/25 bg-card">
          <CardHeader>
            <CardTitle className="text-base">Verification Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading KYC status...
              </p>
            ) : !kyc ? (
              <p className="text-sm text-muted-foreground">
                KYC request not found.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge className={statusStyle}>{statusLabel}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-foreground">
                    Name: <span className="font-medium">{kyc.fullName}</span>
                  </p>
                  <p className="text-sm text-foreground">
                    Submitted:{" "}
                    <span className="font-medium">
                      {new Date(kyc.createdAt).toLocaleDateString()}
                    </span>
                  </p>
                  {kyc.rejectionReason && (
                    <p className="text-sm text-red-500">
                      Rejection reason: {kyc.rejectionReason}
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </BorrowerLayout>
  );
}
