import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Button } from "@/components/ui/button";
import { useGetTenantQuery } from "@/apis/tenantsApi";
import { useParams, Link } from "react-router-dom";
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
  FileText
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
import { cn } from "@/lib/utils";

export default function LenderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: lender, isLoading, error } = useGetTenantQuery(id || "", { skip: !id });
  const { user } = useAuth();
  
  const [showApply, setShowApply] = useState(false);
  const [showKyc, setShowKyc] = useState(false);

  const { data: kycStatusData } = useGetKycStatusQuery({ tenantId: id }, { skip: !user?.id || !id });
  const { data: rules = [] } = useGetRulesByTenantQuery(id || "", { skip: !id });

  const kycStatus = (kycStatusData?.status as KycStatus | null) ?? null;
  const isKycVerified = kycStatus === KycStatus.VERIFIED;
  const isKycPending = kycStatus === KycStatus.PENDING;
  const isKycRejected = kycStatus === KycStatus.REJECTED;

  const visibleRules = rules.filter(r => r.isActive && r.isPubliclyVisible);

  if (error) {
    return (
      <BorrowerLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center">
          <ShieldAlert className="w-12 h-12 text-rose-500" />
          <h2 className="text-2xl font-bold">Lender Profile Unavailable</h2>
          <Button onClick={() => navigate("/lenders")} className="rounded-xl px-10 h-11 font-semibold border border-border/60">
             Directory
          </Button>
        </div>
      </BorrowerLayout>
    );
  }

  return (
    <BorrowerLayout>
      <div className="max-w-7xl mx-auto space-y-10 pb-12">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-8 mt-4">
          <div className="space-y-2">
            <button onClick={() => navigate("/lenders")} className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer uppercase tracking-widest">
              <ChevronLeft className="w-4 h-4" /> Marketplace
            </button>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Institutional Profile</h1>
          </div>
          <div className="flex items-center gap-3">
             <Badge variant="outline" className="rounded-lg h-7 px-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border-emerald-200">
                Verified Lender
             </Badge>
          </div>
        </section>

        {isLoading || !lender ? (
          <div className="grid lg:grid-cols-12 gap-8">
             <Skeleton className="lg:col-span-8 h-96 rounded-2xl bg-muted/40" />
             <Skeleton className="lg:col-span-4 h-96 rounded-2xl bg-muted/40" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-8 space-y-10">
              <div className="bg-background border border-border/60 rounded-2xl p-8 shadow-sm flex flex-col sm:flex-row gap-8 items-start">
                <div className="w-24 h-24 rounded-2xl bg-muted/30 border border-border/40 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                  {lender.logo ? (
                    <img src={lender.logo} alt={lender.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                     <h2 className="text-2xl font-bold text-foreground">{lender.name}</h2>
                     <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                     </div>
                  </div>
                  <p className="text-sm text-foreground/70 leading-relaxed font-medium">
                    {lender.description || "A registered financial services provider delivering institutional-grade credit solutions. This lender adheres to national regulatory frameworks and provides transparent lending operations via the CoLoanEx platform."}
                  </p>
                  <div className="flex items-center gap-6 pt-2">
                     <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs font-bold">{lender.address || "Kathmandu, Nepal"}</span>
                     </div>
                     {(lender as any).website && (
                        <a href={(lender as any).website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
                           <ExternalLink className="w-4 h-4" />
                           <span className="text-xs font-bold">Official Site</span>
                        </a>
                     )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                   <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Catalog of Services</h3>
                   <span className="text-[10px] font-black uppercase text-primary tracking-widest bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">{visibleRules.length} Facilities</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  {visibleRules.map(rule => (
                    <div key={rule.id} className="bg-background border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-colors">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                           <div className="space-y-1">
                              <Badge className="rounded-lg h-5 px-2 text-[9px] font-black uppercase tracking-widest" variant="secondary">{rule.ruleType.replace(/_/g, " ")}</Badge>
                              <p className="text-base font-bold text-foreground">{rule.name}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-lg font-bold text-primary">{rule.interestRate}%</p>
                              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">APR</p>
                           </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{rule.description || "Compliant loan facility with flexible terms."}</p>
                      </div>
                      <div className="pt-6 mt-6 border-t border-border/40 grid grid-cols-2 gap-4">
                         <div>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Principal Limit</p>
                            <p className="text-xs font-bold text-foreground flex items-center mt-0.5">
                               <IconCurrencyRupeeNepalese className="w-3.5 h-3.5 mr-0.5 text-muted-foreground" />
                               {(rule.loanLimits.minAmount / 1000).toFixed(0)}K - {(rule.loanLimits.maxAmount / 1000).toFixed(0)}K
                            </p>
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Max Term</p>
                            <p className="text-xs font-bold text-foreground mt-0.5">{rule.loanLimits.maxTermMonths} Months</p>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
               <div className={cn("p-6 rounded-2xl border border-border/60 shadow-sm space-y-5", isKycVerified ? "bg-emerald-50 border-emerald-100" : "bg-muted/5")}>
                 <div className="flex items-center gap-3">
                   {isKycVerified ? <ShieldCheck className="w-5 h-5 text-emerald-600" /> : <ShieldAlert className="w-5 h-5 text-amber-600" />}
                   <span className="text-xs font-black uppercase tracking-widest">Access Verification</span>
                 </div>
                 <p className="text-xs font-medium leading-relaxed opacity-80">
                   {isKycVerified 
                     ? "Identity recognized. You are authorized to submit loan requests to this partner immediately." 
                     : isKycPending 
                      ? "Awaiting KYC assessment. Action icons will activate once the compliance check is finalized."
                      : "Regulatory compliance requires a background verification before facility access is granted."
                   }
                 </p>
                 <Button 
                   className={cn("w-full h-11 rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm", !isKycVerified && "bg-amber-500 hover:bg-amber-600")}
                   onClick={() => {
                     if (isKycVerified) { setShowApply(true); }
                     else if (isKycPending && kycStatusData?.kycId) { navigate(`/borrower/kyc/${kycStatusData.kycId}`); }
                     else { setShowKyc(true); }
                   }}
                 >
                   {isKycVerified ? <FileText className="w-3.5 h-3.5 mr-2" /> : <ShieldCheck className="w-3.5 h-3.5 mr-2" />}
                   {isKycVerified ? "Apply for Loan" : isKycPending ? "Check Status" : "Initialize KYC"}
                 </Button>
               </div>

               <div className="bg-background border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-border/40 bg-muted/5">
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Support Pipeline</h3>
                  </div>
                  <div className="divide-y divide-border/40">
                     <ContactItem icon={<Mail className="w-4 h-4" />} label="Liaison Email" value={lender.contactEmail || "finance@co-loan.com"} href={`mailto:${lender.contactEmail}`} />
                     <ContactItem icon={<Phone className="w-4 h-4" />} label="Desk Line" value={lender.contactPhone || "+977-1-4XXXXXX"} href={`tel:${lender.contactPhone}`} />
                  </div>
               </div>

               <div className="bg-primary/5 rounded-2xl border border-primary/10 p-6 space-y-4">
                  <div className="flex items-center gap-3 text-primary">
                    <Info className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Platform Trust</span>
                  </div>
                  <p className="text-[10px] font-bold text-primary/70 leading-relaxed uppercase tracking-wider">All transactions on the CoLoanEx platform are settled via distributed ledger technology for absolute transparency.</p>
               </div>
            </div>
          </div>
        )}
      </div>

      <ApplyLoanModal open={showApply} onOpenChange={setShowApply} defaultTenantId={id} isLockedTenant={true} />
      <KycVerificationModal open={showKyc} onOpenChange={setShowKyc} defaultTenantId={id} isLockedTenant={true} />
    </BorrowerLayout>
  );
}

function ContactItem({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const content = (
    <div className="flex items-center gap-4 p-5 hover:bg-muted/10 transition-colors group">
      <div className="w-9 h-9 rounded-xl border border-border/40 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors bg-background">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
  return href ? <a href={href} className="block">{content}</a> : <div className="block">{content}</div>;
}
