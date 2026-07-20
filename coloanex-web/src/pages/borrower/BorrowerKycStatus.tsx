import { useMemo, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Button } from "@/components/ui/button";
import { useGetKycQuery } from "@/apis/kycApi";
import { KycStatus } from "@/types/kyc";
import {
  Clock,
  Home,
  ShieldCheck,
  UserCircle2,
  XCircle,
  Upload,
  ChevronLeft,
  Building2,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { PageShell } from "@/components/shared/PageShell";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { GlassCard } from "@/components/shared/GlassCard";
import { Bone } from "@/components/shared/Bone";
import { ParallaxLayer } from "@/components/shared/ParallaxLayer";
import { useRevealOnMount } from "@/hooks/useReveal";

const SceneCanvas = lazy(() => import("@/components/shared/SceneCanvas"));

interface KycDetails {
  gender?: string;
  maritalStatus?: string;
  fatherName?: string;
  motherName?: string;
  grandfatherName?: string;
}

interface AddressDetails {
  province?: string;
  district?: string;
  municipality?: string;
  ward?: string;
  tole?: string;
}

interface BankDetails {
  bankName?: string;
  bankBranch?: string;
  bankAccountNumber?: string;
}

export default function BorrowerKycStatus() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const revealRef = useRevealOnMount([]);
  const { data: kyc, isLoading } = useGetKycQuery(id || "", { skip: !id });

  const personalD = (kyc?.personalDetails as unknown as KycDetails) || {};
  const addressD = (kyc?.permanentAddress as unknown as AddressDetails) || {};
  const bankD = (kyc?.bankDetails as unknown as BankDetails) || {};

  const documents = useMemo(() => {
    if (!kyc?.files) return [];
    const groups: Record<string, any> = {};
    kyc.files.forEach((file) => {
      const meta = (file.documentMetadata as Record<string, any>) || {};
      const type = (meta.documentType as string) || "Other";
      if (!groups[type]) {
        groups[type] = {
          type,
          number: meta.documentNumber as string,
          issueDate: meta.issueDate as string,
          expiryDate: meta.expiryDate as string,
          issueDistrict: meta.issueDistrict as string,
          front: null as string | null,
          back: null as string | null,
        };
      }
      if (
        file.fileType.includes("FRONT") ||
        file.fileType.includes("PASSPORT") ||
        file.fileType.includes("SELFIE")
      )
        groups[type].front = file.fileUrl;
      else if (file.fileType.includes("BACK")) groups[type].back = file.fileUrl;
      else if (!groups[type].front) groups[type].front = file.fileUrl;
    });
    return Object.values(groups);
  }, [kyc?.files]);

  const getStatusConfig = (status?: KycStatus) => {
    if (status === KycStatus.VERIFIED)
      return {
        icon: ShieldCheck,
        className: "bg-primary/15 text-primary border-primary/20",
        label: "Identity Verified",
      };
    if (status === KycStatus.REJECTED)
      return {
        icon: XCircle,
        className: "bg-destructive/10 text-destructive border-destructive/20",
        label: "Request Denied",
      };
    return {
      icon: Clock,
      className: "bg-muted text-foreground border-border",
      label: "In Review",
    };
  };

  const statusTheme = getStatusConfig(kyc?.status);

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
              title="Identity Report"
              description={`Verification ID ${id?.slice(0, 12) || "—"}`}
              actions={
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="rounded-2xl h-11 text-muted-foreground"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Go Back
                  </Button>
                  {kyc?.status === KycStatus.REJECTED && (
                    <Button
                      onClick={() => navigate("/lenders")}
                      className="rounded-2xl h-11 px-6 font-semibold"
                      variant="destructive"
                    >
                      Repair Verification
                    </Button>
                  )}
                </div>
              }
            />
          </ParallaxLayer>

          <Bone
            name="borrower-kyc-status"
            loading={isLoading}
            minHeight={420}
          >
            {!kyc ? (
              <GlassCard className="py-20 flex flex-col items-center justify-center text-muted-foreground/50">
                <ShieldCheck className="w-12 h-12 mb-4" />
                <p className="font-bold tracking-wider text-sm">
                  Artifact not found
                </p>
              </GlassCard>
            ) : (
              <div
                ref={revealRef as React.RefObject<HTMLDivElement>}
                className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-start"
              >
                <div className="lg:col-span-8 space-y-6" data-reveal>
                  <GlassCard className="p-5 sm:p-8">
                    <h3 className="text-sm font-bold tracking-wider text-muted-foreground mb-6 flex items-center gap-2 font-[family-name:var(--font-headline)]">
                      <UserCircle2 className="w-4 h-4" /> Personal Record
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-6">
                      <DataPoint label="Legal Full Name" value={kyc.fullName} />
                      <DataPoint
                        label="Birth Date"
                        value={format(
                          new Date(kyc.dateOfBirth),
                          "MMM dd, yyyy",
                        )}
                      />
                      <DataPoint label="Gender" value={personalD.gender} />
                      <DataPoint
                        label="Marital Status"
                        value={personalD.maritalStatus}
                      />
                      <DataPoint
                        label="Father's Name"
                        value={personalD.fatherName}
                      />
                      <DataPoint
                        label="Grandfather"
                        value={personalD.grandfatherName}
                      />
                    </div>
                  </GlassCard>

                  <GlassCard className="p-5 sm:p-8">
                    <h3 className="text-sm font-bold tracking-wider text-muted-foreground mb-6 flex items-center gap-2 font-[family-name:var(--font-headline)]">
                      <Home className="w-4 h-4" /> Permanent Domicile
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-6">
                      <DataPoint label="Province" value={addressD.province} />
                      <DataPoint label="District" value={addressD.district} />
                      <DataPoint
                        label="Municipality"
                        value={addressD.municipality}
                      />
                      <DataPoint label="Ward" value={addressD.ward} />
                      <DataPoint
                        label="Tole / Address"
                        value={addressD.tole}
                        colSpan={2}
                      />
                    </div>
                  </GlassCard>

                  <GlassCard className="p-5 sm:p-8">
                    <h3 className="text-sm font-bold tracking-wider text-muted-foreground mb-6 flex items-center gap-2 font-[family-name:var(--font-headline)]">
                      <Building2 className="w-4 h-4" /> Financial Data
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-6">
                      <DataPoint label="Occupation" value={kyc.occupation} />
                      <DataPoint
                        label="Monthly Capacity"
                        value={`NPR ${Number(kyc.monthlyIncome).toLocaleString()}`}
                      />
                      <DataPoint label="Bank Partner" value={bankD.bankName} />
                      <DataPoint
                        label="Registered Account"
                        value={bankD.bankAccountNumber}
                        colSpan={3}
                      />
                    </div>
                  </GlassCard>

                  <GlassCard className="p-5 sm:p-8">
                    <h3 className="text-sm font-bold tracking-wider text-muted-foreground mb-6 flex items-center gap-2 font-[family-name:var(--font-headline)]">
                      <Layers className="w-4 h-4" /> Identity Artifacts
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <ImageArtifact
                        label="Official Portrait"
                        src={kyc.photoUrl}
                      />
                      {documents.map((doc, i) => (
                        <div
                          key={i}
                          className="space-y-5 sm:col-span-2 bg-muted/20 p-5 rounded-2xl border border-border/40"
                        >
                          <p className="text-[11px] font-bold tracking-wider text-primary">
                            {doc.type} Evidence
                          </p>
                          <div className="grid sm:grid-cols-2 gap-5">
                            <ImageArtifact
                              small
                              label="Front Surface"
                              src={doc.front}
                            />
                            {doc.back && (
                              <ImageArtifact
                                small
                                label="Reverse Surface"
                                src={doc.back}
                              />
                            )}
                          </div>
                          <div className="pt-4 border-t border-border/40 flex flex-wrap gap-4 text-[11px] font-bold tracking-wider text-muted-foreground">
                            <span>
                              Doc No:{" "}
                              <span className="text-foreground">
                                {doc.number || "N/A"}
                              </span>
                            </span>
                            <span>
                              Dist:{" "}
                              <span className="text-foreground">
                                {doc.issueDistrict || "N/A"}
                              </span>
                            </span>
                            <span>
                              Exp:{" "}
                              <span className="text-foreground">
                                {doc.expiryDate
                                  ? format(
                                      new Date(doc.expiryDate),
                                      "MMM dd, yyyy",
                                    )
                                  : "None"}
                              </span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </div>

                <div className="lg:col-span-4 space-y-5" data-reveal>
                  <GlassCard
                    className={cn(
                      "p-6 sm:p-8 text-center space-y-6 border",
                      statusTheme.className,
                    )}
                  >
                    <div className="inline-flex w-14 h-14 rounded-2xl bg-card border border-border/40 items-center justify-center">
                      <statusTheme.icon className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold tracking-wider opacity-60">
                        Verification State
                      </p>
                      <h3 className="text-xl font-bold tracking-tight font-[family-name:var(--font-headline)]">
                        {statusTheme.label}
                      </h3>
                    </div>
                    <div className="pt-4 border-t border-border/30">
                      <p className="text-xs font-semibold leading-relaxed opacity-80">
                        Timestamped on{" "}
                        {format(new Date(kyc.createdAt), "MMM dd, hh:mm a")}
                      </p>
                    </div>
                  </GlassCard>

                  {kyc.rejectionReason && (
                    <GlassCard className="p-5 bg-destructive/5 border-destructive/20 text-destructive">
                      <p className="text-[11px] font-bold tracking-wider mb-2 flex items-center gap-1.5">
                        <XCircle className="w-3 h-3" /> System Outlier Found
                      </p>
                      <p className="text-sm font-semibold leading-relaxed">
                        {kyc.rejectionReason}
                      </p>
                    </GlassCard>
                  )}

                  <GlassCard className="p-5 sm:p-6 space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-[11px] font-bold tracking-wider">
                        Digital Assurance
                      </span>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                      Identity profiles on CoLoanEx are encrypted before storage.
                      Once verified, this profile anchors trust for marketplace
                      facilities.
                    </p>
                  </GlassCard>
                </div>
              </div>
            )}
          </Bone>
        </PageShell>
      </div>
    </BorrowerLayout>
  );
}

function DataPoint({
  label,
  value,
  colSpan = 1,
}: {
  label: string;
  value: any;
  colSpan?: number;
}) {
  return (
    <div
      className={cn(
        "space-y-1",
        colSpan === 2 && "sm:col-span-2",
        colSpan === 3 && "sm:col-span-3",
      )}
    >
      <p className="text-[11px] font-bold text-muted-foreground tracking-wider opacity-60">
        {label}
      </p>
      <p className="text-base font-bold text-foreground break-words">
        {value || "—"}
      </p>
    </div>
  );
}

function ImageArtifact({
  label,
  src,
  small,
}: {
  label: string;
  src?: string;
  small?: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold text-muted-foreground tracking-wider px-1">
        {label}
      </p>
      <div
        className={cn(
          "rounded-2xl border border-border/40 bg-muted/10 overflow-hidden flex items-center justify-center",
          small ? "aspect-video" : "aspect-square",
        )}
      >
        {src ? (
          <img
            src={src}
            alt={label}
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-700"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-20">
            <Upload className="w-6 h-6" />
            <span className="text-[11px] font-bold tracking-wider">
              Awaiting
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
