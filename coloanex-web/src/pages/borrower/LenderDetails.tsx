import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetTenantQuery } from "@/apis/tenantsApi";
import { useParams, Link } from "react-router-dom";
import {
  MapPin,
  Building2,
  Calendar,
  Globe,
  ArrowRight,
  FileText,
  ShieldAlert,
  ChevronRight,
  ShieldCheck,
  Mail,
  Phone,
  Info,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplyLoanModal } from "./ApplyLoan";
import { KycVerificationModal } from "./KycVerification";
import { useGetKycStatusQuery } from "@/apis/kycApi";
import { KycStatus } from "@/types/kyc";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { useGetRulesByTenantQuery } from "@/apis/rulesApi";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";

export default function LenderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    data: lender,
    isLoading,
    error,
  } = useGetTenantQuery(id || "", {
    skip: !id,
  });
  const [showApply, setShowApply] = useState(false);
  const [showKyc, setShowKyc] = useState(false);
  const { user } = useAuth();

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
  const isKycRejected = kycStatus === KycStatus.REJECTED;
  const kycPrimaryActionLabel = isKycVerified
    ? "Apply for Loan"
    : isKycPending
      ? "View KYC"
      : isKycRejected
        ? "Apply for KYC"
        : "Apply for KYC";
  const visibleRules = rules.filter(
    (rule) => rule.isActive && rule.isPubliclyVisible,
  );

  if (error) {
    return (
      <BorrowerLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-center">
          <h2 className="text-2xl font-bold text-red-500">
            Error Loading Lender
          </h2>
          <p className="text-muted-foreground">
            Could not fetch the requested lender profile.
          </p>
          <Link to="/borrower/lenders">
            <Button variant="outline">Back to directory</Button>
          </Link>
        </div>
      </BorrowerLayout>
    );
  }

  return (
    <BorrowerLayout>
      <div className="space-y-12 animate-fade-up">
        {/* Navigation & Breadcrumbs */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/borrower/lenders")}
            className="group text-muted-foreground hover:text-primary -ml-4 rounded-full px-6"
          >
            <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform mr-2" />
            Back to Marketplace
          </Button>
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-500/10 text-emerald-500 border-none rounded-full font-black text-[10px] tracking-widest uppercase px-4 py-1.5 shadow-sm">
              Certified
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full px-4 py-1.5 border-border text-muted-foreground font-black text-[10px] tracking-widest uppercase"
            >
              Institutional Profile
            </Badge>
          </div>
        </div>

        {isLoading || !lender ? (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Skeleton className="h-64 col-span-2 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="space-y-4 max-w-4xl mx-auto lg:hidden">
              <Card className="rounded-xl border-border bg-card">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
                    {lender.logo ? (
                      <img
                        src={lender.logo}
                        alt={lender.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-black text-primary">
                        {lender.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-4 text-2xl font-bold text-foreground">
                    {lender.name}
                  </h2>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-primary/10 text-primary text-xs font-semibold">
                    <span
                      className={
                        "w-2 h-2 rounded-full " +
                        (lender.isActive
                          ? "bg-emerald-500"
                          : "bg-muted-foreground/50")
                      }
                    />
                    {lender.isActive
                      ? "Active & Accepting Applications"
                      : "Currently Inactive"}
                  </div>
                </CardContent>
              </Card>

              {(lender.contactEmail ||
                lender.contactPhone ||
                lender.address) && (
                <Card className="rounded-xl border-border bg-card">
                  <CardContent className="p-0">
                    <h3 className="px-5 pt-5 pb-3 text-xs uppercase tracking-widest font-bold text-muted-foreground">
                      Contact Information
                    </h3>
                    {lender.contactEmail && (
                      <a
                        href={`mailto:${lender.contactEmail}`}
                        className="flex items-center gap-3 px-5 py-4 border-t border-border/20"
                      >
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-muted-foreground">
                            Email
                          </p>
                          <p className="text-sm font-semibold text-foreground truncate">
                            {lender.contactEmail}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </a>
                    )}
                    {lender.contactPhone && (
                      <a
                        href={`tel:${lender.contactPhone}`}
                        className="flex items-center gap-3 px-5 py-4 border-t border-border/20"
                      >
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-muted-foreground">
                            Phone
                          </p>
                          <p className="text-sm font-semibold text-foreground truncate">
                            {lender.contactPhone}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </a>
                    )}
                    {lender.address && (
                      <div className="flex items-center gap-3 px-5 py-4 border-t border-border/20">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-muted-foreground">
                            Address
                          </p>
                          <p className="text-sm font-semibold text-foreground truncate">
                            {lender.address}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="rounded-xl border-primary/20 bg-primary/5">
                <CardContent className="p-4 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-primary/90">
                    {isKycVerified
                      ? "Identity verified. You can apply for a loan with this lender."
                      : isKycPending
                        ? "Your KYC is under review for this lender. You can view your submission status."
                        : isKycRejected
                          ? "Your KYC was rejected for this lender. Please apply again with correct details."
                          : "Complete KYC verification first to apply for loans."}
                  </p>
                </CardContent>
              </Card>

              {isKycVerified ? (
                <Button
                  className="w-full h-12 rounded-xl font-semibold"
                  onClick={() => setShowApply(true)}
                >
                  <FileText className="w-4 h-4 mr-2" /> {kycPrimaryActionLabel}
                </Button>
              ) : (
                <Button
                  className="w-full h-12 rounded-xl font-semibold bg-amber-500 hover:bg-amber-600"
                  onClick={() => {
                    if (isKycPending && kycStatusData?.kycId) {
                      navigate(`/borrower/kyc/${kycStatusData.kycId}`);
                      return;
                    }
                    setShowKyc(true);
                  }}
                >
                  <ShieldAlert className="w-4 h-4 mr-2" />{" "}
                  {kycPrimaryActionLabel}
                </Button>
              )}

              {visibleRules.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-foreground">
                    Loan Products
                  </h3>
                  {visibleRules.map((rule) => (
                    <Card
                      key={rule.id}
                      className="rounded-xl border-border bg-card"
                    >
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="inline-flex rounded-full bg-primary/10 text-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest">
                              {rule.ruleType.replace(/_/g, " ")}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-foreground truncate">
                              {rule.name}
                            </p>
                            {rule.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {rule.description}
                              </p>
                            )}
                          </div>
                          <div className="rounded-xl bg-primary text-primary-foreground px-3 py-2 text-center shrink-0">
                            <p className="text-sm font-bold leading-none">
                              {rule.interestRate}%
                            </p>
                            <p className="text-[10px] opacity-80 mt-1">p.a.</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/20">
                          <div>
                            <p className="text-[11px] text-muted-foreground">
                              Loan Range
                            </p>
                            <p className="text-xs font-semibold text-foreground mt-1 flex items-center">
                              <IconCurrencyRupeeNepalese className="w-3.5 h-3.5 mr-0.5" />
                              {(rule.loanLimits.minAmount / 1000).toFixed(0)}K-
                              {(rule.loanLimits.maxAmount / 1000).toFixed(0)}K
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-muted-foreground">
                              Term
                            </p>
                            <p className="text-xs font-semibold text-foreground mt-1">
                              {rule.loanLimits.minTermMonths}-
                              {rule.loanLimits.maxTermMonths} mo
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-muted-foreground">
                              Grace
                            </p>
                            <p className="text-xs font-semibold text-foreground mt-1">
                              {rule.penaltyConfig.gracePeriodDays}d
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden lg:block space-y-8">
              <div className="grid grid-cols-12 gap-6">
                <Card className="col-span-12 xl:col-span-8 rounded-xl border-border bg-card overflow-hidden">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                        {lender.logo ? (
                          <img
                            src={lender.logo}
                            alt={lender.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-4xl font-black text-primary">
                            {lender.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-4xl font-black tracking-tight text-foreground leading-none">
                          {lender.name}
                        </h2>
                        <p className="mt-3 text-sm text-muted-foreground max-w-2xl leading-relaxed">
                          {lender?.description ||
                            "Institutional lending partner providing compliant and transparent credit products."}
                        </p>
                        <div className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-primary/10 text-primary text-xs font-semibold">
                          <span
                            className={
                              "w-2 h-2 rounded-full " +
                              (lender.isActive
                                ? "bg-emerald-500"
                                : "bg-muted-foreground/50")
                            }
                          />
                          {lender.isActive
                            ? "Active & Accepting Applications"
                            : "Currently Inactive"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="col-span-12 xl:col-span-4 rounded-xl border-border bg-card">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm text-foreground/90 leading-relaxed">
                        {isKycVerified
                          ? "Identity verified. You can proceed with loan application."
                          : isKycPending
                            ? "Your KYC is under review for this lender. You can view your submission status."
                            : isKycRejected
                              ? "Your KYC was rejected for this lender. Please apply again with correct details."
                              : "Complete KYC verification first to apply for loans."}
                      </p>
                    </div>
                    {isKycVerified ? (
                      <Button
                        className="w-full h-12 rounded-xl font-semibold"
                        onClick={() => setShowApply(true)}
                      >
                        <FileText className="w-4 h-4 mr-2" />{" "}
                        {kycPrimaryActionLabel}
                      </Button>
                    ) : (
                      <Button
                        className="w-full h-12 rounded-xl font-semibold bg-amber-500 hover:bg-amber-600"
                        onClick={() => {
                          if (isKycPending && kycStatusData?.kycId) {
                            navigate(`/borrower/kyc/${kycStatusData.kycId}`);
                            return;
                          }
                          setShowKyc(true);
                        }}
                      >
                        <ShieldAlert className="w-4 h-4 mr-2" />
                        {kycPrimaryActionLabel}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>

              {(lender.contactEmail ||
                lender.contactPhone ||
                lender.address) && (
                <Card className="rounded-xl border-border bg-card overflow-hidden">
                  <CardContent className="p-0">
                    <div className="px-6 py-4 border-b border-border/20">
                      <h3 className="text-sm uppercase tracking-widest font-black text-muted-foreground">
                        Contact Information
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3">
                      {lender.contactEmail && (
                        <a
                          href={`mailto:${lender.contactEmail}`}
                          className="flex items-center gap-3 px-6 py-5 border-b md:border-b-0 md:border-r border-border/20 hover:bg-muted/20 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">
                              Email
                            </p>
                            <p className="text-sm font-semibold text-foreground truncate">
                              {lender.contactEmail}
                            </p>
                          </div>
                        </a>
                      )}
                      {lender.contactPhone && (
                        <a
                          href={`tel:${lender.contactPhone}`}
                          className="flex items-center gap-3 px-6 py-5 border-b md:border-b-0 md:border-r border-border/20 hover:bg-muted/20 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <Phone className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">
                              Phone
                            </p>
                            <p className="text-sm font-semibold text-foreground truncate">
                              {lender.contactPhone}
                            </p>
                          </div>
                        </a>
                      )}
                      {lender.address && (
                        <div className="flex items-center gap-3 px-6 py-5 hover:bg-muted/20 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">
                              Address
                            </p>
                            <p className="text-sm font-semibold text-foreground truncate">
                              {lender.address}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {visibleRules.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-black tracking-tight text-foreground">
                    Loan Products
                  </h3>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    {visibleRules.map((rule) => (
                      <Card
                        key={rule.id}
                        className="rounded-xl border-border bg-card overflow-hidden"
                      >
                        <CardContent className="p-6 space-y-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="inline-flex rounded-full bg-primary/10 text-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest">
                                {rule.ruleType.replace(/_/g, " ")}
                              </p>
                              <p className="mt-2 text-lg font-bold text-foreground truncate">
                                {rule.name}
                              </p>
                              {rule.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {rule.description}
                                </p>
                              )}
                            </div>
                            <div className="rounded-xl bg-primary text-primary-foreground px-3.5 py-2.5 text-center shrink-0">
                              <p className="text-base font-bold leading-none">
                                {rule.interestRate}%
                              </p>
                              <p className="text-[10px] opacity-80 mt-1">
                                p.a.
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/20">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Loan Range
                              </p>
                              <p className="text-sm font-semibold text-foreground mt-1 flex items-center">
                                <IconCurrencyRupeeNepalese className="w-4 h-4 mr-1" />
                                {(rule.loanLimits.minAmount / 1000).toFixed(0)}
                                K-
                                {(rule.loanLimits.maxAmount / 1000).toFixed(0)}K
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Term
                              </p>
                              <p className="text-sm font-semibold text-foreground mt-1">
                                {rule.loanLimits.minTermMonths}-
                                {rule.loanLimits.maxTermMonths} mo
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Grace
                              </p>
                              <p className="text-sm font-semibold text-foreground mt-1">
                                {rule.penaltyConfig.gracePeriodDays}d
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
