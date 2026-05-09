import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useGetKycsQuery } from "@/apis/kycApi";
import { KycStatus } from "@/types/kyc";
import { CheckCircle2, Clock, ShieldCheck, XCircle, ArrowRight, ChevronLeft, Info } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const verifiedCount = kycs.filter((item) => item.status === KycStatus.VERIFIED).length;
  const pendingCount = kycs.filter((item) => item.status === KycStatus.PENDING || !item.status).length;
  const rejectedCount = kycs.filter((item) => item.status === KycStatus.REJECTED).length;

  const getStatusConfig = (status?: KycStatus) => {
    if (status === KycStatus.VERIFIED) return { className: "bg-emerald-50 text-emerald-600 ring-emerald-500/20", label: "Verified" };
    if (status === KycStatus.REJECTED) return { className: "bg-rose-50 text-rose-600 ring-rose-500/20", label: "Rejected" };
    return { className: "bg-amber-50 text-amber-600 ring-amber-500/20", label: "Review" };
  };

  const headerText = useMemo(() => {
    if (isLoading) return "Fetching records...";
    if (kycs.length === 0) return "No records found";
    return `Verified Identities (${kycs.length})`;
  }, [isLoading, kycs.length]);

  return (
    <BorrowerLayout>
      <div className="max-w-7xl mx-auto space-y-10 pb-12">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-8 mt-4">
          <div className="space-y-2">
            <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer uppercase tracking-widest">
              <ChevronLeft className="w-4 h-4" /> Dashboard
            </button>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Compliance Center</h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-0.5">KYC & Identity Management</p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate("/lenders")} className="rounded-xl h-11 px-6 font-semibold shadow-sm">
               New Verification
            </Button>
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
           <StatCard label="Active Identitites" value={verifiedCount} icon={<CheckCircle2 className="w-5 h-5" />} color="text-emerald-600 bg-emerald-50" />
           <StatCard label="Pending Approval" value={pendingCount} icon={<Clock className="w-5 h-5" />} color="text-amber-600 bg-amber-50" />
           <StatCard label="Action Required" value={rejectedCount} icon={<XCircle className="w-5 h-5" />} color="text-rose-600 bg-rose-50" />
        </div>

        <div className="bg-background border border-border/60 rounded-2xl overflow-hidden shadow-sm">
           <div className="p-6 border-b border-border/40 bg-muted/5 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider">{headerText}</h3>
              <Badge variant="outline" className="rounded-lg">Institutional Logs</Badge>
           </div>
           
           <div className="p-6 space-y-4">
              {isLoading ? (
                 <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl bg-muted/40" />)}
                 </div>
              ) : kycs.length === 0 ? (
                 <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                    <ShieldCheck className="w-12 h-12 mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest">No identity profiles anchored</p>
                 </div>
              ) : (
                 <div className="space-y-3">
                    {kycs.map((item) => {
                       const status = getStatusConfig(item.status);
                       return (
                          <div
                             key={item.id}
                             onClick={() => navigate(`/borrower/kyc/${item.id}`)}
                             className="group bg-background border border-border/40 rounded-xl p-5 hover:border-primary/40 hover:bg-muted/5 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                          >
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-center text-primary/60 group-hover:text-primary transition-colors">
                                   <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{item.fullName}</p>
                                   <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">ID: {item.id.slice(0,8)}</span>
                                      {item.occupation && (
                                         <>
                                            <span className="w-1 h-1 rounded-full bg-border" />
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">{item.occupation}</span>
                                         </>
                                      )}
                                   </div>
                                </div>
                             </div>

                             <div className="flex items-center justify-between sm:justify-end gap-6">
                                <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest", status.className)}>
                                   {status.label}
                                </span>
                                <div className="w-8 h-8 rounded-lg border border-border/40 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                   <ArrowRight className="w-4 h-4" />
                                </div>
                             </div>
                          </div>
                       )
                    })}
                 </div>
              )}
           </div>
        </div>

        <div className="bg-primary/5 rounded-2xl border border-primary/10 p-8 grid sm:grid-cols-2 gap-10">
           <div className="space-y-3">
              <h4 className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                 <Info className="w-4 h-4" /> Compliance Standards
              </h4>
              <p className="text-xs font-medium text-primary/80 leading-relaxed">Identity verification is mandatory for all institutional credit facilities. We use encrypted document vaults to protect your sensitive PII (Personally Identifiable Information).</p>
           </div>
           <div className="space-y-3">
              <h4 className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4" /> Real-time Settlement
              </h4>
              <p className="text-xs font-medium text-primary/80 leading-relaxed">Verified status unlocks immediate access to loan marketplaces and smart contract execution for instant fund disbursement.</p>
           </div>
        </div>
      </div>
    </BorrowerLayout>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-background border border-border/60 rounded-2xl p-6 shadow-sm flex items-center gap-5">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-current/10 shadow-sm", color)}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground tracking-tight leading-none">{value}</p>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1.5">{label}</p>
      </div>
    </div>
  );
}
