import { useParams, useNavigate } from "react-router-dom";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetContractQuery } from "@/apis/contractsApi";
import { 
  FileText, 
  Download, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronLeft,
  Building2,
  Lock,
  ArrowRight
} from "lucide-react";
import { BlockchainStatusBadge } from "@/components/shared/BlockchainStatusBadge";
import { cn } from "@/lib/utils";

export default function ContractDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contract, isLoading } = useGetContractQuery(id || "", {
    skip: !id,
  });

  const money = (value?: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "NPR",
      maximumFractionDigits: 0,
    }).format(value || 0);

  if (isLoading) {
    return (
      <BorrowerLayout>
        <div className="max-w-7xl mx-auto space-y-10 py-6">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <div className="grid lg:grid-cols-12 gap-8">
            <Skeleton className="lg:col-span-8 h-[600px] rounded-2xl bg-muted/40" />
            <Skeleton className="lg:col-span-4 h-[600px] rounded-2xl bg-muted/40" />
          </div>
        </div>
      </BorrowerLayout>
    );
  }

  if (!contract) {
    return (
      <BorrowerLayout>
        <div className="flex flex-col items-center justify-center min-h-[500px] gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center border border-border/40">
            <FileText className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-1">
             <h2 className="text-2xl font-bold">Contract Not Found</h2>
             <p className="text-sm text-muted-foreground max-w-sm mx-auto">This agreement is restricted or was not found in the system records.</p>
          </div>
          <Button onClick={() => navigate("/my-loans")} className="rounded-xl px-10 h-11 font-semibold mt-4">
             Back to Portfolio
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
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer uppercase tracking-widest">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Legal Instrument</h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-0.5">Agreement {contract.contractNumber}</p>
          </div>
          <div className="flex items-center gap-4">
             {contract.contractPdfUrl && (
               <Button onClick={() => window.open(contract.contractPdfUrl, "_blank")} className="rounded-xl h-11 px-6 font-semibold border border-border/60 shadow-sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" /> Download PDF
               </Button>
             )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-background border border-border/60 rounded-2xl p-8 shadow-sm">
               <div className="flex items-center justify-between gap-6 pb-6 border-b border-border/40">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6" />
                     </div>
                     <div>
                        <h2 className="text-lg font-bold text-foreground">Terms & Conditions</h2>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Digitally Governed Agreement</p>
                     </div>
                  </div>
                  <Badge variant={contract.status === "ACTIVE" ? "default" : "secondary"} className="rounded-lg h-7 px-3 text-[10px] font-black uppercase tracking-widest">
                    {contract.status}
                  </Badge>
               </div>
               <div className="pt-8">
                  <div className="p-6 sm:p-8 rounded-xl bg-muted/5 border border-border/40 shadow-inner">
                    <p className="text-sm leading-relaxed text-foreground/80 font-medium whitespace-pre-wrap">
                      {contract.termsAndConditions || "This document outlines the specific financial obligations and legal covenants between the borrower and the funding institution. All settlements are processed through smart contracts for immutable record-keeping and transparent interest accrual."}
                    </p>
                  </div>
               </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200/60 rounded-2xl p-8 shadow-sm">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    Distributed Ledger Anchoring
                 </h3>
                 <BlockchainStatusBadge blockchainTxHash={contract.blockchainTxHash} />
               </div>
               <div className="grid sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <p className="text-xs font-bold text-emerald-700/80 uppercase tracking-widest flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5" /> Immutable Fingerprint
                     </p>
                     <p className="text-sm text-emerald-800/70 leading-relaxed font-medium">
                        This digital instrument is permanently registered on the blockchain. Any post-settlement modification is cryptographically impossible, ensuring absolute document integrity for all parties.
                     </p>
                  </div>
                  <div className="p-5 rounded-xl bg-white/60 border border-emerald-200/50 flex flex-col justify-center">
                     <div className="flex items-center gap-2 text-emerald-600 mb-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Proven Integrity</span>
                     </div>
                     <p className="text-[10px] font-bold text-emerald-700/60 uppercase tracking-widest">Digital SHA-256 Verified</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-background border border-border/60 rounded-2xl overflow-hidden shadow-sm">
               <div className="p-6 border-b border-border/40 bg-muted/5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Financial Summary</h3>
               </div>
               <div className="p-8 space-y-5">
                  <SummaryItem label="Principal" value={money(contract.loanAmount)} />
                  <SummaryItem label="Interest Rate" value={`${contract.interestRate}% APR`} />
                  <SummaryItem label="Repayment Term" value={`${contract.termMonths} Months`} />
                  <div className="pt-6 mt-4 border-t border-border/40">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1.5 px-0.5">Total Dues</p>
                    <p className="text-3xl font-bold text-primary tracking-tight">{money(contract.totalAmountDue)}</p>
                  </div>
               </div>
            </div>

            <div className="bg-background border border-border/60 rounded-2xl overflow-hidden shadow-sm">
               <div className="p-6 border-b border-border/40 bg-muted/5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Validation Log</h3>
               </div>
               <div className="p-6 space-y-4">
                  {contract.signatures?.map((sig, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-border/40 hover:bg-muted/5 transition-colors group">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-border/40", sig.signedBy === "BORROWER" ? "text-indigo-600 bg-indigo-50" : "text-emerald-600 bg-emerald-50")}>
                        {sig.signedBy === "BORROWER" ? <User className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors uppercase tracking-tight">{sig.signedBy}</p>
                        <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">Authenticated {new Date(sig.signedAt).toLocaleDateString()}</p>
                        <div className="mt-1 flex items-center gap-1 text-[9px] text-emerald-600 font-bold uppercase tracking-widest">
                          <CheckCircle2 className="w-3 h-3" /> Validated
                        </div>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </BorrowerLayout>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 px-0.5">
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-sm font-bold text-foreground">{value}</span>
    </div>
  );
}
