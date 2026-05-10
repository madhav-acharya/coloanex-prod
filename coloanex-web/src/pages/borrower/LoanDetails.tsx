import { useEffect, useMemo, useState } from "react";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BlockchainStatusBadge } from "@/components/shared/BlockchainStatusBadge";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useGetLoanQuery } from "@/apis/loansApi";
import { useGetPaymentSchedulesByContractQuery } from "@/apis/paymentSchedulesApi";
import { useGetContractsQuery } from "@/apis/contractsApi";
import { useGetMyWalletsQuery } from "@/apis/walletsApi";
import { useListMySubscriptionsQuery } from "@/apis/subscriptionsApi";
import { LoanStatus } from "@/types/loan";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useEsewaPayment } from "@/hooks/useEsewaPayment";
import { useKhaltiPayment } from "@/hooks/useKhaltiPayment";
import { getBlockchainAccessSnapshot } from "@/utils/blockchainAccess";
import {
  FileText,
  Calendar,
  Building2,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  ShieldCheck,
  X,
  ShieldAlert,
  ArrowRight,
  ChevronLeft,
  Info
} from "lucide-react";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";

type Gateway = "KHALTI" | "ESEWA";

const money = (value?: number | null) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

const getScheduleDueAmount = (schedule: any) => {
  const remaining = Number(schedule.remainingAmount ?? 0);
  if (remaining > 0) return remaining;
  const due = Number(schedule.dueAmount ?? 0);
  if (due > 0) return due;
  const total = Number(schedule.totalAmount ?? 0);
  const paid = Number(schedule.amountPaid ?? schedule.paidAmount ?? 0);
  return Math.max(total - paid, 0);
};

const isSchedulePaid = (schedule: any) => {
  const status = String(schedule.status || "").toUpperCase();
  if (status === "PAID" || status === "COMPLETED") return true;
  return getScheduleDueAmount(schedule) <= 0;
};

const getStatusConfig = (status: LoanStatus) => {
  const configs: Record<LoanStatus, { icon: any; className: string; label: string; tone: string }> = {
    [LoanStatus.DRAFT]: { icon: FileText, className: "bg-muted text-muted-foreground", label: "Draft", tone: "bg-slate-50 text-slate-700 ring-slate-500/20" },
    [LoanStatus.SUBMITTED]: { icon: Clock3, className: "bg-blue-50 text-blue-600 ring-blue-500/20", label: "Submitted", tone: "bg-blue-50 text-blue-700 ring-blue-500/20" },
    [LoanStatus.UNDER_REVIEW]: { icon: Info, className: "bg-amber-50 text-amber-600 ring-amber-500/20", label: "Under Review", tone: "bg-amber-50 text-amber-700 ring-amber-500/20" },
    [LoanStatus.APPROVED]: { icon: CheckCircle2, className: "bg-emerald-50 text-emerald-600 ring-emerald-500/20", label: "Approved", tone: "bg-emerald-50 text-emerald-700 ring-emerald-500/20" },
    [LoanStatus.CONTRACT_GENERATED]: { icon: FileText, className: "bg-indigo-50 text-indigo-600 ring-indigo-500/20", label: "Contract Ready", tone: "bg-indigo-50 text-indigo-700 ring-indigo-500/20" },
    [LoanStatus.CONTRACT_SIGNED]: { icon: ShieldCheck, className: "bg-emerald-50 text-emerald-600 ring-emerald-500/20", label: "Signed", tone: "bg-emerald-50 text-emerald-700 ring-emerald-500/20" },
    [LoanStatus.LOAN_PROVIDED]: { icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700 ring-emerald-500/30", label: "Disbursed", tone: "bg-emerald-50 text-emerald-700 ring-emerald-500/20" },
    [LoanStatus.PARTIALLY_PAID]: { icon: Clock3, className: "bg-orange-50 text-orange-600 ring-orange-500/20", label: "Partial Paid", tone: "bg-orange-50 text-orange-700 ring-orange-500/20" },
    [LoanStatus.PAID]: { icon: CheckCircle2, className: "bg-emerald-50 text-emerald-600 ring-emerald-500/20", label: "Fully Repaid", tone: "bg-emerald-50 text-emerald-700 ring-emerald-500/20" },
    [LoanStatus.REJECTED]: { icon: AlertTriangle, className: "bg-rose-50 text-rose-600 ring-rose-500/20", label: "Rejected", tone: "bg-rose-50 text-rose-700 ring-rose-500/20" },
  };
  return configs[status] || configs[LoanStatus.DRAFT];
};

const flattenCollateral = (value: any, keyPrefix = ""): Array<{ key: string; value: any }> => {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      flattenCollateral(item, keyPrefix ? `${keyPrefix} ${index + 1}` : `${index + 1}`)
    );
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      flattenCollateral(child, keyPrefix ? `${keyPrefix} ${key}` : key)
    );
  }
  return [{ key: keyPrefix || "value", value }];
};

export default function LoanDetails() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const { data: loan, isLoading } = useGetLoanQuery(id || "", { skip: !id });
  const { data: contracts = [] } = useGetContractsQuery();
  const { data: wallets = [] } = useGetMyWalletsQuery();
  const { data: mySubscriptions = [] } = useListMySubscriptionsQuery();
  
  const { pay: payKhalti, isInitiating: isInitiatingKhalti } = useKhaltiPayment();
  const { pay: payEsewa, isInitiating: isInitiatingEsewa } = useEsewaPayment();

  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);
  const [gateway, setGateway] = useState<Gateway>("KHALTI");
  const [showGatewayPicker, setShowGatewayPicker] = useState(false);

  const resolvedContract = useMemo(() => {
    if (loan?.contract?.id) return loan.contract;
    if (!loan?.id) return undefined;
    return contracts.find((c) => c.loanId === loan.id || c.loan?.id === loan.id);
  }, [contracts, loan?.contract, loan?.id]);

  const contractId = resolvedContract?.id;
  const { data: schedules = [] } = useGetPaymentSchedulesByContractQuery(contractId || "", { skip: !contractId });

  const allSchedules = useMemo(() => schedules.slice().sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()), [schedules]);
  const payableSchedules = useMemo(() => allSchedules.filter((s) => !isSchedulePaid(s)), [allSchedules]);

  const selectedAmount = useMemo(() => 
    payableSchedules.filter((s) => selectedScheduleIds.includes(s.id)).reduce((sum, s) => sum + getScheduleDueAmount(s), 0),
  [payableSchedules, selectedScheduleIds]);

  useEffect(() => {
    if (selectedScheduleIds.length > 0 || payableSchedules.length === 0) return;
    setSelectedScheduleIds([payableSchedules[0].id]);
  }, [payableSchedules, selectedScheduleIds.length]);

  const blockchainAccess = useMemo(() => getBlockchainAccessSnapshot({
    gasPaymentMode: (user as { gasPaymentMode?: string })?.gasPaymentMode,
    wallets,
    subscriptions: mySubscriptions,
  }), [user, wallets, mySubscriptions]);

  const canRepay = loan?.status === LoanStatus.LOAN_PROVIDED || loan?.status === LoanStatus.PARTIALLY_PAID || loan?.status === LoanStatus.CONTRACT_SIGNED;
  const statusTheme = loan ? getStatusConfig(loan.status) : getStatusConfig(LoanStatus.DRAFT);
  
  const collateralEntries = flattenCollateral(loan?.collateralDetails || {}).filter(e => e.value !== null && e.value !== undefined && String(e.value).trim().length > 0);

  const toggleSchedule = (sid: string) => {
    setSelectedScheduleIds(prev => prev.includes(sid) ? prev.filter(id => id !== sid) : [...prev, sid]);
  };

  const handlePaySelected = () => {
    if (!contractId) {
      toast({ title: "Contract required", description: "Loan contract is not yet finalized.", variant: "destructive" });
      return;
    }
    if (selectedScheduleIds.length === 0) {
      toast({ title: "Select installment", description: "Please select at least one unit to pay.", variant: "destructive" });
      return;
    }
    setShowGatewayPicker(true);
  };

  const handleGatewayPayment = async () => {
    if (!contractId || !id || selectedAmount <= 0) return;
    const gasMode = blockchainAccess.mode === "USER_WALLET" ? "USER_WALLET" : "PLATFORM_WALLET";
    const sPath = `/borrower/payment/success?context=repayment&loanId=${id}&amount=${selectedAmount}`;
    const fPath = `/borrower/payment/failure?context=repayment&loanId=${id}&amount=${selectedAmount}`;
    
    setShowGatewayPicker(false);
    try {
      const payFn = gateway === "KHALTI" ? payKhalti : payEsewa;
      await payFn({
        contractId,
        paymentScheduleId: selectedScheduleIds.join(","),
        amount: selectedAmount,
        type: "INSTALLMENT_PAYMENT",
        gasPaymentMode: gasMode,
        platform: "WEB",
        successPath: sPath,
        failurePath: fPath,
      });
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast({ title: "Payment Failed", description: e?.data?.message || "Internal gateway error.", variant: "destructive" });
    }
  };

  return (
    <BorrowerLayout>
      <div className="max-w-7xl mx-auto space-y-10 pb-12">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-8 mt-4">
          <div className="space-y-2">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer  tracking-wider">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Loan Facility</h1>
          </div>
          {canRepay && (
            <Button onClick={handlePaySelected} className="rounded-xl h-12 px-8 font-bold shadow-none">
               <CreditCard className="w-4 h-4 mr-2" /> Make Repayment
            </Button>
          )}
        </section>

        {isLoading || !loan ? (
          <div className="grid lg:grid-cols-12 gap-8"><Skeleton className="lg:col-span-8 h-96 rounded-2xl bg-muted/40" /></div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-background border border-border/60 rounded-2xl p-8 shadow-none">
                <div className="flex flex-col sm:flex-row justify-between gap-6 pb-8 border-b border-border/40">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0">
                       <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">{loan.purpose || "Facility Details"}</h2>
                      <p className="text-[11px] font-bold text-muted-foreground  tracking-wider mt-0.5">Reference: {loan.id.slice(0,10)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    <span className={cn("px-3 py-1 rounded-full text-[11px] font-bold  tracking-wider", statusTheme.className)}>
                       {statusTheme.label}
                    </span>
                    <BlockchainStatusBadge blockchainTxHash={(resolvedContract as any)?.blockchainTxHash} />
                  </div>
                </div>

                <div className="pt-8 grid sm:grid-cols-2 gap-10">
                   <div>
                      <p className="text-[11px] font-bold text-muted-foreground  tracking-wider mb-1.5">Approved Capital</p>
                      <h2 className="text-2xl font-bold text-foreground tracking-tight">{money(loan.approvedAmount ?? loan.requestedAmount)}</h2>
                      <div className="mt-4 flex gap-6">
                        <Metric small label="Rate" value={`${(loan as any).interestRate || "12.5"}%`} />
                        <Metric small label="Duration" value={`${loan.approvedTermMonths || loan.requestedTermMonths} Mo`} />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-6 bg-muted/20 p-6 rounded-2xl border border-border/40">
                      <Metric label="Paid" value={schedules.filter(s => s.status === "PAID").length} sub={`/ ${allSchedules.length}`} />
                     <Metric label="Next Due" value={payableSchedules[0] ? format(new Date(payableSchedules[0].dueDate), "MMM dd") : "N/A"} />
                   </div>
                </div>
              </div>

              <div className="bg-background border border-border/60 rounded-2xl overflow-hidden shadow-none">
                 <div className="p-6 border-b border-border/40 bg-muted/5 flex items-center justify-between">
                    <h3 className="text-sm font-bold  tracking-wider">Repayment Schedule</h3>
                    <Badge variant="outline" className="rounded-lg">{payableSchedules.length} Items Pending</Badge>
                 </div>
                 <div className="divide-y divide-border/40 max-h-[500px] overflow-y-auto">
                    {allSchedules.map(s => {
                       const isPaid = isSchedulePaid(s);
                       const isSelected = selectedScheduleIds.includes(s.id);
                       return (
                          <div 
                             key={s.id} 
                             onClick={() => !isPaid && toggleSchedule(s.id)}
                             className={cn(
                                "p-6 flex items-center justify-between transition-all cursor-pointer",
                                isPaid ? "opacity-50 pointer-events-none" : "hover:bg-muted/10",
                                isSelected && "bg-primary/5"
                             )}
                          >
                             <div className="flex items-center gap-4">
                                <div className={cn("w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all", isPaid ? "bg-emerald-500 border-emerald-500 text-white" : isSelected ? "bg-primary border-primary text-white" : "border-border/60")}>
                                   {isPaid && <CheckCircle2 className="w-3.5 h-3.5" />}
                                   {!isPaid && isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                </div>
                                <div>
                                   <p className="text-xs font-bold text-foreground">Installment #{s.installmentNumber}</p>
                                   <p className="text-[11px] text-muted-foreground  tracking-wider font-semibold">{format(new Date(s.dueDate), "MMM dd, yyyy")}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-sm font-bold text-foreground">{money(getScheduleDueAmount(s))}</p>
                                <p className="text-[11px] font-bold  tracking-wider text-muted-foreground mt-0.5">{isPaid ? "Received" : "Upcoming"}</p>
                             </div>
                          </div>
                       )
                    })}
                 </div>
              </div>

              {collateralEntries.length > 0 && (
                <div className="bg-background border border-border/60 rounded-2xl p-8 shadow-none space-y-6">
                   <h3 className="text-sm font-bold  tracking-wider">Collateral Artifacts</h3>
                   <div className="grid sm:grid-cols-2 gap-6">
                      {collateralEntries.map((e, idx) => (
                        <div key={idx} className="space-y-2">
                           <p className="text-[11px] font-bold text-muted-foreground  tracking-wider">{titleCase(e.key)}</p>
                           <div className="p-4 rounded-xl bg-muted/10 border border-border/40 font-semibold text-sm break-all">
                              {String(e.value)}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 space-y-6">
               <div className={cn("p-6 rounded-2xl border border-border/60 shadow-none space-y-4", statusTheme.tone)}>
                  <div className="flex items-center gap-3">
                     <statusTheme.icon className="w-5 h-5 shrink-0" />
                     <h4 className="font-bold text-sm  tracking-wider">Status: {statusTheme.label}</h4>
                  </div>
                  <p className="text-xs font-medium leading-relaxed opacity-80">Repayments are monitored via smart contracts for transparent and immediate settlement verification.</p>
               </div>

               <div className="bg-background border border-border/60 rounded-2xl p-6 shadow-none space-y-8">
                  <div>
                     <h3 className="text-xs font-bold  tracking-wider text-muted-foreground mb-4">Lending Partner</h3>
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-center text-primary"><Building2 className="w-5 h-5" /></div>
                        <p className="text-sm font-bold text-foreground truncate">{loan.tenantId.slice(0,10)} CAP</p>
                     </div>
                  </div>
                  
                  <div className="space-y-3 pt-6 border-t border-border/40 px-1">
                     <Progress label="Analysis" done />
                     <Progress label="Verfication" done />
                     <Progress label="Ledger Update" done={!!resolvedContract} />
                     <Progress label="Repayment" done={loan.status === LoanStatus.PAID} />
                  </div>

                  <div className="pt-6 border-t border-border/40 space-y-3">
                     <Link to={`/lenders/${loan.tenantId}`} className="block">
                        <Button variant="outline" className="w-full rounded-xl text-xs font-bold  tracking-wider h-11">Partner Info</Button>
                     </Link>
                     {resolvedContract && (
                       <Link to={`/contracts/${contractId}`} className="block">
                         <Button className="w-full rounded-xl text-xs font-bold  tracking-wider h-11">View Contract</Button>
                       </Link>
                     )}
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {showGatewayPicker && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-sm bg-background rounded-2xl border border-border shadow-none overflow-hidden scale-in-95">
               <div className="p-6 border-b border-border/40 flex items-center justify-between">
                  <h3 className="font-bold text-lg">Select Wallet</h3>
                  <button onClick={() => setShowGatewayPicker(false)} className="rounded-lg p-1.5 hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
               </div>
               <div className="p-6 space-y-3">
                  <GatewayBtn label="Khalti Pay" active={gateway === "KHALTI"} color="purple" onClick={() => setGateway("KHALTI")} />
                  <GatewayBtn label="eSewa Mobile" active={gateway === "ESEWA"} color="emerald" onClick={() => setGateway("ESEWA")} />
                  
                  <div className="pt-6 mt-4 border-t border-border/40">
                     <div className="flex items-center justify-between mb-6 px-1">
                        <span className="text-[11px] font-bold  text-muted-foreground tracking-wider">Payable</span>
                        <span className="font-bold text-xl">{money(selectedAmount)}</span>
                     </div>
                     <Button onClick={handleGatewayPayment} className="w-full h-12 rounded-xl font-bold  tracking-wider text-xs">Confirm Transaction</Button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </BorrowerLayout>
  );
}

function Metric({ label, value, sub, small }: { label: string; value: any; sub?: string; small?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-muted-foreground  tracking-wider mb-1 opacity-60">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={cn("font-bold text-foreground", small ? "text-lg" : "text-xl")}>{value}</span>
        {sub && <span className="text-[11px] font-bold text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

function Progress({ label, done }: { label: string; done: boolean }) {
  return (
    <div className={cn("flex items-center gap-3 transition-opacity", !done && "opacity-30")}>
       <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", done ? "bg-emerald-500 border-emerald-500 text-white" : "border-border/60")}>
          <CheckCircle2 className="w-2.5 h-2.5" />
       </div>
       <span className="text-[11px] font-bold  tracking-wider text-foreground">{label}</span>
    </div>
  );
}

function GatewayBtn({ label, active, color, onClick }: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button 
       onClick={onClick}
       className={cn(
          "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
          active ? `border-${color}-500 bg-${color}-50/50` : "border-border/60 hover:border-border"
       )}
    >
       <span className={cn("font-bold text-sm", active ? `text-${color}-600` : "text-muted-foreground")}>{label}</span>
       <div className={cn("w-4 h-4 rounded-full border-2", active ? `bg-${color}-500 border-${color}-500` : "border-border/60")} />
    </button>
  );
}
