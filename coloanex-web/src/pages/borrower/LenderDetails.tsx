import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetTenantQuery } from "@/apis/tenantsApi";
import { useParams, Link } from "react-router-dom";
import { MapPin, Building2, Calendar, Globe, ArrowRight, FileText, ShieldAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplyLoanModal } from "./ApplyLoan";
import { KycVerificationModal } from "./KycVerification";
import { useGetKycsQuery } from "@/apis/kycApi";
import { KycStatus } from "@/types/kyc";
import { useAuth } from "@/hooks/useAuth";

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
    <BorrowerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
           <Link to="/borrower/lenders" className="text-sm text-primary hover:underline mb-2 block">&larr; Back to Browse Lenders</Link>
        </div>
        
        {isLoading || !lender ? (
           <div className="space-y-8">
             <Card>
                <CardContent className="p-8 flex items-start gap-6">
                   <Skeleton className="w-24 h-24 rounded-2xl" />
                   <div className="space-y-4 flex-1">
                      <Skeleton className="h-8 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/2" />
                   </div>
                </CardContent>
             </Card>
             <Card>
                <CardContent className="p-8 space-y-4">
                   <Skeleton className="h-6 w-1/4" />
                   <Skeleton className="h-24 w-full" />
                </CardContent>
             </Card>
           </div>
        ) : (
           <div className="space-y-8">
             {/* Header Card */}
             <Card className="bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant/15 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
                <CardContent className="p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-8 relative z-10">
                   <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex flex-shrink-0 items-center justify-center text-primary font-bold text-4xl shadow-inner shadow-primary/20">
                     {lender.name.charAt(0).toUpperCase()}
                   </div>
                   
                   <div className="flex-1 space-y-4">
                      <div>
                         <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-bold font-plus-jakarta text-foreground tracking-tight">{lender.name}</h1>
                            {lender.isActive && (
                               <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full">Active</span>
                            )}
                         </div>
                         <p className="flex items-center gap-1.5 text-muted-foreground mt-2">
                            <MapPin className="w-4 h-4" /> {lender.contactEmail || "Online"}
                         </p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/80">
                         <div className="flex items-center gap-1.5 bg-surface/50 px-3 py-1.5 rounded-lg border border-outline-variant/10">
                            <Building2 className="w-4 h-4 text-primary" /> Institution
                         </div>
                         <div className="flex items-center gap-1.5 bg-surface/50 px-3 py-1.5 rounded-lg border border-outline-variant/10">
                            <Globe className="w-4 h-4 text-primary" /> On-chain Verified
                         </div>
                         <div className="flex items-center gap-1.5 bg-surface/50 px-3 py-1.5 rounded-lg border border-outline-variant/10">
                            <Calendar className="w-4 h-4 text-primary" /> Joined {new Date(lender.createdAt).getFullYear()}
                         </div>
                      </div>
                   </div>

                    <div className="w-full sm:w-auto self-stretch sm:self-auto flex flex-col justify-center sm:pl-8 sm:border-l border-border/40 gap-3">
                       <div className="flex flex-col gap-3">
                          {isKycVerified ? (
                             <Button className="w-full gap-2 text-sm" onClick={() => setShowApply(true)}>
                                <FileText className="w-4 h-4" /> Apply for Loan
                             </Button>
                          ) : (
                             <Button className="w-full gap-2 text-sm bg-amber-500 hover:bg-amber-600 border-none" onClick={() => setShowKyc(true)}>
                                <ShieldAlert className="w-4 h-4" /> Verify KYC to Apply
                             </Button>
                          )}
                          <p className="text-[10px] text-center text-muted-foreground">
                             {isKycVerified ? "You are verified for this lender" : "Verification required for this specific lender"}
                          </p>
                       </div>
                    </div>
                </CardContent>
             </Card>

             {/* About Section */}
             <Card className="bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant/15">
                <CardContent className="p-8 sm:p-10 space-y-6">
                   <h2 className="text-xl font-bold font-plus-jakarta border-b border-border/40 pb-3">About {lender.name}</h2>
                   <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed">
                         <p>{lender.name} is a verified lending institution on the CoLoanEx platform. They operate within their jurisdiction's regulatory boundaries to provide secure, on-chain lending solutions to verified borrowers. Their operations are fully tracked through the CoLoanEx smart contract system, ensuring transparency and accountability for all parties involved.</p>
                      
                      <h3 className="text-lg font-semibold text-foreground mt-8 mb-4">Lending Criteria</h3>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 list-none p-0 mx-0 mt-4">
                         <li className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Require verified KYC identity
                         </li>
                         <li className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Require digital wallet connection
                         </li>
                         <li className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Supported collateral: Digital & Physical
                         </li>
                         <li className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Smart contract based agreements
                         </li>
                      </ul>
                   </div>
                </CardContent>
             </Card>
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
