import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetTenantQuery } from "@/apis/tenantsApi";
import { useParams, Link } from "react-router-dom";
import { MapPin, Building2, Calendar, Globe, ArrowRight, FileText, ShieldAlert, ChevronRight, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplyLoanModal } from "./ApplyLoan";
import { KycVerificationModal } from "./KycVerification";
import { useGetKycsQuery } from "@/apis/kycApi";
import { KycStatus } from "@/types/kyc";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

export default function LenderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: lender, isLoading, error } = useGetTenantQuery(id || "", {
    skip: !id,
  });
  const [showApply, setShowApply] = useState(false);
  const [showKyc, setShowKyc] = useState(false);
  const { user } = useAuth();

  const { data: kycsData } = useGetKycsQuery({ 
    userId: user?.id, 
    tenantId: id, 
    status: KycStatus.VERIFIED 
  }, { skip: !user?.id || !id });

  const isKycVerified = kycsData && kycsData.total > 0;

  if (error) {
    return (
      <BorrowerLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-center">
           <h2 className="text-2xl font-bold text-red-500">Error Loading Lender</h2>
           <p className="text-muted-foreground">Could not fetch the requested lender profile.</p>
           <Link to="/borrower/lenders"><Button variant="outline">Back to directory</Button></Link>
        </div>
      </BorrowerLayout>
    );
  }

  return (
    <BorrowerLayout
      title={lender?.name || "Lender Profile"}
      description={(lender as any)?.description || "Institutional lending partner providing decentralized credit facilities."}
    >
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
              <Badge className="bg-emerald-500/10 text-emerald-500 border-none rounded-full font-black text-[10px] tracking-widest uppercase px-4 py-1.5 shadow-sm">Certified</Badge>
              <Badge variant="outline" className="rounded-full px-4 py-1.5 border-border/40 text-muted-foreground font-black text-[10px] tracking-widest uppercase">
                 Institutional Profile
              </Badge>
           </div>
        </div>

        {isLoading || !lender ? (
           <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <Skeleton className="h-64 col-span-2 rounded-[2.5rem]" />
                 <Skeleton className="h-64 rounded-[2.5rem]" />
              </div>
           </div>
        ) : (
           <div className="space-y-12">
              {/* Action Bar */}
              <div className="bg-surface/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-border/40 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
                 <div className="flex items-center gap-8">
                    <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/20 flex flex-shrink-0 items-center justify-center text-primary font-black text-4xl shadow-inner">
                       {lender.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-2">
                       <div className="flex items-center gap-4 text-muted-foreground font-medium">
                          <div className="flex items-center gap-2">
                             <MapPin className="w-4 h-4 text-primary" /> {lender.address || "On-Chain Registry"}
                          </div>
                          <div className="flex items-center gap-2">
                             <Globe className="w-4 h-4 text-primary" /> {lender.contactEmail || "Secure Communications"}
                          </div>
                       </div>
                       <div className="flex gap-4">
                          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                             <Building2 className="w-3.5 h-3.5 text-primary" /> Regulated Tier I
                          </div>
                          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                             <Calendar className="w-3.5 h-3.5 text-primary" /> Since {new Date(lender.createdAt).getFullYear()}
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="flex flex-col items-center gap-3">
                    {isKycVerified ? (
                       <Button size="lg" className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all" onClick={() => setShowApply(true)}>
                          <FileText className="w-5 h-5 mr-3" /> Commit Capital Request
                       </Button>
                    ) : (
                       <Button size="lg" className="h-14 px-10 rounded-2xl bg-amber-500 hover:bg-amber-600 border-none text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-500/20 transition-all" onClick={() => setShowKyc(true)}>
                          <ShieldAlert className="w-5 h-5 mr-3" /> Establish Identity
                       </Button>
                    )}
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60">
                       {isKycVerified ? "Identity Fully Verified" : "Verification Mandatory"}
                    </p>
                 </div>
              </div>

              {/* Strategy & About Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <Card className="lg:col-span-2 bg-surface/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] overflow-hidden">
                    <CardContent className="p-10 sm:p-14 space-y-8">
                       <div className="space-y-2">
                          <h2 className="text-3xl font-black tracking-tighter text-foreground font-headline">Institutional Strategy</h2>
                          <div className="h-1 w-20 bg-primary rounded-full" />
                       </div>
                       <div className="prose prose-invert max-w-none">
                          <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                             {lender.name} delivers institutional-grade capital via secure, smart-contract governed liquidity pools. By integrating jurisdictional compliance with Decentralized Finance (DeFi) primitives, we empower verified borrowers to access global credit markets with unparalleled speed and legal certainty.
                          </p>
                          <p className="text-muted-foreground font-medium leading-relaxed mt-4">
                             As a core partner in the CoLoanEx ecosystem, our operations are fully auditable on-chain, providing a transparent record of commitment, execution, and settlement for all institutional participants.
                          </p>
                       </div>
                    </CardContent>
                 </Card>

                 <Card className="bg-surface/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] overflow-hidden">
                   <CardContent className="p-10 space-y-8">
                      <div className="space-y-2">
                         <h2 className="text-xl font-black tracking-tight text-foreground font-headline uppercase leading-none">Mandatory Criteria</h2>
                         <p className="text-xs text-muted-foreground font-black tracking-widest uppercase">Pre-commitment checklist</p>
                      </div>
                      <div className="space-y-4">
                         {[
                            "Verified Institutional KYC",
                            "Linked Decentralized Wallet",
                            "Multi-Asset Collateral Support",
                            "Deterministic Smart Contracts"
                         ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-3xl bg-surface/30 border border-border/20 group hover:border-primary/40 transition-colors">
                               <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                  <ShieldCheck className="w-4 h-4" />
                               </div>
                               <span className="text-sm font-bold text-foreground/90">{item}</span>
                            </div>
                         ))}
                      </div>
                   </CardContent>
                 </Card>
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
