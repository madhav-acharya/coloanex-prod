import { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Button } from "@/components/ui/button";
import { useGetTenantQuery } from "@/apis/tenantsApi";
import { useParams } from "react-router-dom";
import {
  MapPin,
  Building2,
  ChevronLeft,
  ShieldCheck,
  Mail,
  Phone,
  Info,
  ExternalLink,
  ShieldAlert,
  FileText,
} from "lucide-react";
import { ApplyLoanModal } from "./ApplyLoan";
import { KycVerificationModal } from "./KycVerification";
import { useGetKycStatusQuery } from "@/apis/kycApi";
import { KycStatus } from "@/types/kyc";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { useGetRulesByTenantQuery } from "@/apis/rulesApi";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/shared/PageShell";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { GlassCard } from "@/components/shared/GlassCard";
import { Bone } from "@/components/shared/Bone";
import { ParallaxLayer } from "@/components/shared/ParallaxLayer";
import { useRevealOnMount } from "@/hooks/useReveal";

const SceneCanvas = lazy(() => import("@/components/shared/SceneCanvas"));

export default function LenderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const revealRef = useRevealOnMount([]);
  const { data: lender, isLoading, error } = useGetTenantQuery(id || "", {
    skip: !id,
  });
  const { user } = useAuth();

  const [showApply, setShowApply] = useState(false);
  const [showKyc, setShowKyc] = useState(false);

  const { data: kycStatusData } = useGetKycStatusQuery(
    { tenantId: id },
    { skip: !user?.id || !id },
  );
  const { data: rules = [] } = useGetRulesByTenantQuery(id || "", {
    skip: !id,
  });

  const kycStatus = (kycStatusData?.status as KycStatus | null) ?? null;
  const isKycVerified = kycStatus === KycStatus.VERIFIED;
  const isKycPending = kycStatus === KycStatus.PENDING;

  const visibleRules = rules.filter((r) => r.isActive && r.isPubliclyVisible);

  if (error) {
    return (
      <BorrowerLayout>
        <div className="relative overflow-hidden min-h-[60vh]">
          <Suspense fallback={null}>
            <SceneCanvas
              variant="knot"
              density={22}
              className="opacity-30 h-[220px]"
            />
          </Suspense>
          <PageShell className="relative z-10 flex flex-col items-center justify-center min-h-[400px] gap-6 text-center py-16">
            <ShieldAlert className="w-12 h-12 text-destructive" />
            <h2 className="text-2xl font-bold font-[family-name:var(--font-headline)]">
              Lender Profile Unavailable
            </h2>
            <Button
              onClick={() => navigate("/lenders")}
              className="rounded-2xl px-10 h-11 font-semibold"
            >
              Directory
            </Button>
          </PageShell>
        </div>
      </BorrowerLayout>
    );
  }

  return (
    <BorrowerLayout>
      <div className="relative overflow-hidden min-h-[70vh]">
        <Suspense fallback={null}>
          <SceneCanvas
            variant="prism"
            density={22}
            className="opacity-40 h-[280px]"
          />
        </Suspense>
        <PageShell className="relative z-10 space-y-8 pb-16 pt-6">
          <ParallaxLayer speed={0.2} clamp={100}>
            <SectionHeader
              title="Institutional Profile"
              description="Lender details, facilities, and KYC access"
              actions={
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/lenders")}
                    className="rounded-2xl h-11 text-muted-foreground"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Marketplace
                  </Button>
                  <Badge
                    variant="outline"
                    className="rounded-lg h-7 px-3 text-[11px] font-bold tracking-wider text-primary bg-primary/10 border-primary/20"
                  >
                    Verified Lender
                  </Badge>
                </div>
              }
            />
          </ParallaxLayer>

          <Bone
            name="borrower-lender-details"
            loading={isLoading || !lender}
            minHeight={420}
          >
            {lender ? (
              <div
                ref={revealRef as React.RefObject<HTMLDivElement>}
                className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-start"
              >
                <div className="lg:col-span-8 space-y-8" data-reveal>
                  <GlassCard className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-muted/30 border border-border/40 flex items-center justify-center shrink-0 overflow-hidden">
                      {lender.logo ? (
                        <img
                          src={lender.logo}
                          alt={lender.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-10 h-10 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <h2 className="text-2xl font-bold text-foreground font-[family-name:var(--font-headline)]">
                          {lender.name}
                        </h2>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary text-[11px] font-bold tracking-wider w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Online
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                        {lender.description ||
                          "A registered financial services provider delivering institutional-grade credit solutions via the CoLoanEx platform."}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 pt-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span className="text-[11px] font-bold tracking-wider">
                            {lender.address || "Kathmandu, Nepal"}
                          </span>
                        </div>
                        {(lender as any).website && (
                          <a
                            href={(lender as any).website}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-primary hover:underline"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span className="text-[11px] font-bold tracking-wider">
                              Official Site
                            </span>
                          </a>
                        )}
                      </div>
                    </div>
                  </GlassCard>

                  <div className="space-y-5">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-sm font-bold tracking-wider text-muted-foreground font-[family-name:var(--font-headline)]">
                        Catalog of Services
                      </h3>
                      <span className="text-[11px] font-bold text-primary tracking-wider bg-primary/10 px-2.5 py-1 rounded-lg">
                        {visibleRules.length} Facilities
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {visibleRules.map((rule) => (
                        <GlassCard
                          key={rule.id}
                          className="p-5 sm:p-6 flex flex-col justify-between hover:border-primary/40 transition-colors"
                        >
                          <div className="space-y-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <Badge
                                  className="rounded-lg h-5 px-2 text-[11px] font-bold tracking-wider"
                                  variant="secondary"
                                >
                                  {rule.ruleType.replace(/_/g, " ")}
                                </Badge>
                                <p className="text-base font-bold text-foreground">
                                  {rule.name}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">
                                  {rule.interestRate}%
                                </p>
                                <p className="text-[11px] font-bold tracking-wider text-muted-foreground">
                                  APR
                                </p>
                              </div>
                            </div>
                            <p className="text-[11px] font-bold text-muted-foreground tracking-wider line-clamp-2 opacity-70">
                              {rule.description ||
                                "Compliant loan facility with flexible terms."}
                            </p>
                          </div>
                          <div className="pt-5 mt-5 border-t border-border/40 grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[11px] font-bold text-muted-foreground tracking-wider opacity-60">
                                Principal Limit
                              </p>
                              <p className="text-xs font-bold text-foreground flex items-center mt-0.5">
                                <IconCurrencyRupeeNepalese className="w-3.5 h-3.5 mr-0.5 text-muted-foreground" />
                                {(rule.loanLimits.minAmount / 1000).toFixed(0)}K
                                -{" "}
                                {(rule.loanLimits.maxAmount / 1000).toFixed(0)}K
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-muted-foreground tracking-wider opacity-60">
                                Max Term
                              </p>
                              <p className="text-xs font-bold text-foreground mt-0.5">
                                {rule.loanLimits.maxTermMonths} Months
                              </p>
                            </div>
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-5" data-reveal>
                  <GlassCard
                    className={cn(
                      "p-5 sm:p-6 space-y-5",
                      isKycVerified
                        ? "bg-primary/5 border-primary/20"
                        : "bg-card/80",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {isKycVerified ? (
                        <ShieldCheck className="w-5 h-5 text-primary" />
                      ) : (
                        <ShieldAlert className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className="text-xs font-bold tracking-wider">
                        Access Verification
                      </span>
                    </div>
                    <p className="text-xs font-medium leading-relaxed text-muted-foreground">
                      {isKycVerified
                        ? "Identity recognized. You are authorized to submit loan requests to this partner."
                        : isKycPending
                          ? "Awaiting KYC assessment. Actions unlock once compliance is finalized."
                          : "Regulatory compliance requires verification before facility access."}
                    </p>
                    <Button
                      className="w-full h-11 rounded-2xl text-xs font-bold tracking-wider"
                      onClick={() => {
                        if (isKycVerified) {
                          setShowApply(true);
                        } else if (isKycPending && kycStatusData?.kycId) {
                          navigate(`/borrower/kyc/${kycStatusData.kycId}`);
                        } else {
                          setShowKyc(true);
                        }
                      }}
                    >
                      {isKycVerified ? (
                        <FileText className="w-3.5 h-3.5 mr-2" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 mr-2" />
                      )}
                      {isKycVerified
                        ? "Apply for Loan"
                        : isKycPending
                          ? "Check Status"
                          : "Initialize KYC"}
                    </Button>
                  </GlassCard>

                  <GlassCard className="overflow-hidden">
                    <div className="p-5 border-b border-border/40">
                      <h3 className="text-[11px] font-bold tracking-wider text-muted-foreground">
                        Support Pipeline
                      </h3>
                    </div>
                    <div className="divide-y divide-border/40">
                      <ContactItem
                        icon={<Mail className="w-4 h-4" />}
                        label="Liaison Email"
                        value={lender.contactEmail || "finance@co-loan.com"}
                        href={`mailto:${lender.contactEmail}`}
                      />
                      <ContactItem
                        icon={<Phone className="w-4 h-4" />}
                        label="Desk Line"
                        value={lender.contactPhone || "+977-1-4XXXXXX"}
                        href={`tel:${lender.contactPhone}`}
                      />
                    </div>
                  </GlassCard>

                  <GlassCard className="p-5 sm:p-6 space-y-4 bg-primary/5 border-primary/15">
                    <div className="flex items-center gap-3 text-primary">
                      <Info className="w-4 h-4" />
                      <span className="text-[11px] font-bold tracking-wider">
                        Platform Trust
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-primary/80 leading-relaxed tracking-wider">
                      Transactions on CoLoanEx settle via distributed ledger
                      technology for transparency.
                    </p>
                  </GlassCard>
                </div>
              </div>
            ) : null}
          </Bone>
        </PageShell>
      </div>

      <ApplyLoanModal
        open={showApply}
        onOpenChange={setShowApply}
        defaultTenantId={id}
        isLockedTenant={true}
      />
      <KycVerificationModal
        open={showKyc}
        onOpenChange={setShowKyc}
        defaultTenantId={id}
        isLockedTenant={true}
      />
    </BorrowerLayout>
  );
}

function ContactItem({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-4 p-4 sm:p-5 hover:bg-muted/20 transition-colors group">
      <div className="w-9 h-9 rounded-xl border border-border/40 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors bg-card">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-muted-foreground/60 tracking-wider">
          {label}
        </p>
        <p className="text-sm font-bold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block">
      {content}
    </a>
  ) : (
    <div className="block">{content}</div>
  );
}
