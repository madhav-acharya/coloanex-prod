import { useEffect, useMemo, useState } from "react";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BlockchainStatusBadge } from "@/components/shared/BlockchainStatusBadge";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useGetLoanQuery } from "@/apis/loansApi";
import { useGetPaymentSchedulesByContractQuery } from "@/apis/paymentSchedulesApi";
import { useGetContractsQuery } from "@/apis/contractsApi";
import { useGetMyWalletsQuery } from "@/apis/walletsApi";
import { useListMySubscriptionsQuery } from "@/apis/subscriptionsApi";
import { LoanStatus, type Loan } from "@/types/loan";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
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
  Link as LinkIcon,
  X,
} from "lucide-react";

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

const getScheduleDueAmount = (schedule: Record<string, unknown>) => {
  const remaining = Number(schedule.remainingAmount ?? 0);
  if (remaining > 0) return remaining;

  const due = Number(schedule.dueAmount ?? 0);
  if (due > 0) return due;

  const total = Number(schedule.totalAmount ?? 0);
  const paid = Number(schedule.amountPaid ?? schedule.paidAmount ?? 0);
  return Math.max(total - paid, 0);
};

const isSchedulePaid = (schedule: Record<string, unknown>) => {
  const status = String(schedule.status || "").toUpperCase();
  if (status === "PAID" || status === "COMPLETED") return true;
  return getScheduleDueAmount(schedule) <= 0;
};

const getStatusTheme = (status: LoanStatus) => {
  switch (status) {
    case LoanStatus.APPROVED:
    case LoanStatus.CONTRACT_SIGNED:
    case LoanStatus.LOAN_PROVIDED:
    case LoanStatus.PAID:
      return {
        icon: CheckCircle2,
        chip: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
        note: "Healthy progress",
      };
    case LoanStatus.REJECTED:
      return {
        icon: AlertTriangle,
        chip: "bg-red-500/10 text-red-600 border-red-500/30",
        note: "Action required",
      };
    default:
      return {
        icon: Clock3,
        chip: "bg-amber-500/10 text-amber-600 border-amber-500/30",
        note: "In progress",
      };
  }
};

const isImageUrl = (value: string) => {
  if (!/^https?:\/\//i.test(value)) return false;
  return /cloudinary|\/image\/|\.(png|jpe?g|webp|gif|avif|svg)(\?|$)/i.test(
    value,
  );
};

const flattenCollateral = (
  value: unknown,
  keyPrefix = "",
): Array<{ key: string; value: unknown }> => {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      flattenCollateral(
        item,
        keyPrefix ? `${keyPrefix} ${index + 1}` : `${index + 1}`,
      ),
    );
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(
      ([key, child]) =>
        flattenCollateral(child, keyPrefix ? `${keyPrefix} ${key}` : key),
    );
  }

  return [{ key: keyPrefix || "value", value }];
};

const statusInfo: Partial<
  Record<LoanStatus, { title: string; body: string; tone: string }>
> = {
  [LoanStatus.DRAFT]: {
    title: "Application in Draft",
    body: "Your loan application is saved as a draft. Submit it to start lender review.",
    tone: "border-slate-500/30 bg-slate-500/10 text-slate-700",
  },
  [LoanStatus.SUBMITTED]: {
    title: "Application Submitted",
    body: "Your application has been submitted and is awaiting lender review.",
    tone: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700",
  },
  [LoanStatus.UNDER_REVIEW]: {
    title: "Under Review",
    body: "The lender is reviewing your application and will update you soon.",
    tone: "border-amber-500/30 bg-amber-500/10 text-amber-700",
  },
  [LoanStatus.APPROVED]: {
    title: "Loan Approved",
    body: "Your application is approved. Contract generation is the next step.",
    tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  },
  [LoanStatus.CONTRACT_GENERATED]: {
    title: "Contract Ready",
    body: "Review and sign your contract to proceed with disbursement.",
    tone: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700",
  },
  [LoanStatus.CONTRACT_SIGNED]: {
    title: "Contract Signed",
    body: "Your contract is signed. Lender-side disbursement is in progress.",
    tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  },
  [LoanStatus.LOAN_PROVIDED]: {
    title: "Loan Disbursed",
    body: "Your loan is active. Make repayments based on your schedule.",
    tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  },
  [LoanStatus.PARTIALLY_PAID]: {
    title: "Repayment in Progress",
    body: "You have made partial repayments. Continue to clear all dues.",
    tone: "border-amber-500/30 bg-amber-500/10 text-amber-700",
  },
  [LoanStatus.PAID]: {
    title: "Loan Fully Repaid",
    body: "Great work. This loan has been repaid in full.",
    tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  },
  [LoanStatus.REJECTED]: {
    title: "Application Rejected",
    body: "This application was rejected by lender review.",
    tone: "border-red-500/30 bg-red-500/10 text-red-700",
  },
};

export default function LoanDetails() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: loan, isLoading } = useGetLoanQuery(id || "", {
    skip: !id,
  });
  const { data: contracts = [] } = useGetContractsQuery();
  const { data: wallets = [] } = useGetMyWalletsQuery();
  const { data: mySubscriptions = [] } = useListMySubscriptionsQuery();
  const {
    pay: payKhalti,
    isInitiating: isInitiatingKhalti,
    isVerifying: isVerifyingKhalti,
  } = useKhaltiPayment();
  const {
    pay: payEsewa,
    isInitiating: isInitiatingEsewa,
    isVerifying: isVerifyingEsewa,
  } = useEsewaPayment();

  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);
  const [gateway, setGateway] = useState<Gateway>("KHALTI");
  const [showGatewayPicker, setShowGatewayPicker] = useState(false);

  const resolvedContract = useMemo(() => {
    if (loan?.contract?.id) return loan.contract;
    if (!loan?.id) return undefined;
    return contracts.find(
      (c) => c.loanId === loan.id || c.loan?.id === loan.id,
    );
  }, [contracts, loan?.contract, loan?.id]);

  const contractId = resolvedContract?.id;
  const { data: schedules = [] } = useGetPaymentSchedulesByContractQuery(
    contractId || "",
    {
      skip: !contractId,
    },
  );

  const allSchedules = useMemo(
    () =>
      schedules
        .slice()
        .sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
        ),
    [schedules],
  );

  const payableSchedules = useMemo(
    () =>
      allSchedules.filter(
        (s) => !isSchedulePaid(s as unknown as Record<string, unknown>),
      ),
    [allSchedules],
  );

  const selectedAmount = useMemo(
    () =>
      payableSchedules
        .filter((s) => selectedScheduleIds.includes(s.id))
        .reduce(
          (sum, s) =>
            sum + getScheduleDueAmount(s as unknown as Record<string, unknown>),
          0,
        ),
    [payableSchedules, selectedScheduleIds],
  );

  useEffect(() => {
    if (selectedScheduleIds.length > 0) return;
    if (payableSchedules.length === 0) return;
    setSelectedScheduleIds([payableSchedules[0].id]);
  }, [payableSchedules, selectedScheduleIds.length]);

  const blockchainAccess = useMemo(
    () =>
      getBlockchainAccessSnapshot({
        gasPaymentMode: (user as any)?.gasPaymentMode,
        wallets,
        subscriptions: mySubscriptions,
      }),
    [user, wallets, mySubscriptions],
  );

  const gatewayBusy =
    isInitiatingKhalti ||
    isVerifyingKhalti ||
    isInitiatingEsewa ||
    isVerifyingEsewa;

  const canRepay =
    loan?.status === LoanStatus.LOAN_PROVIDED ||
    loan?.status === LoanStatus.PARTIALLY_PAID ||
    loan?.status === LoanStatus.CONTRACT_SIGNED;
  const canSignContract = loan?.status === LoanStatus.CONTRACT_GENERATED;

  const paidCount = schedules.filter((s) => s.status === "PAID").length;
  const overdueCount = schedules.filter((s) => s.status === "OVERDUE").length;
  const nextDue = payableSchedules[0];

  const statusTheme = loan ? getStatusTheme(loan.status) : null;
  const StatusIcon = statusTheme?.icon || Clock3;

  const collateral = (loan?.collateralDetails || {}) as Record<string, unknown>;
  const collateralEntries = flattenCollateral(collateral).filter((entry) => {
    if (entry.value === null || entry.value === undefined) return false;
    if (typeof entry.value === "string") return entry.value.trim().length > 0;
    return true;
  });
  const currentStatusInfo = loan ? statusInfo[loan.status] : null;

  const toggleSchedule = (scheduleId: string) => {
    setSelectedScheduleIds((prev) =>
      prev.includes(scheduleId)
        ? prev.filter((id) => id !== scheduleId)
        : [...prev, scheduleId],
    );
  };

  const handlePaySelected = () => {
    if (!contractId) {
      toast({
        title: "Error",
        description:
          "Loan contract not found. Ensure loan is approved and contract generated.",
        variant: "destructive",
      });
      return;
    }

    if (selectedScheduleIds.length === 0 || selectedAmount <= 0) {
      toast({
        title: "Select installments",
        description: "Choose at least one installment to continue.",
        variant: "destructive",
      });
      return;
    }

    setShowGatewayPicker(true);
  };

  const handleGatewayPayment = async () => {
    if (!contractId || !id || selectedAmount <= 0) return;

    const gasPaymentMode =
      blockchainAccess.mode === "USER_WALLET"
        ? "USER_WALLET"
        : "PLATFORM_WALLET";

    const successPath = `/borrower/payment/success?context=repayment&loanId=${encodeURIComponent(id)}&amount=${encodeURIComponent(String(selectedAmount))}`;
    const failurePath = `/borrower/payment/failure?context=repayment&loanId=${encodeURIComponent(id)}&amount=${encodeURIComponent(String(selectedAmount))}`;

    setShowGatewayPicker(false);

    try {
      if (gateway === "KHALTI") {
        await payKhalti({
          contractId,
          paymentScheduleId: selectedScheduleIds.join(","),
          amount: selectedAmount,
          type: "INSTALLMENT_PAYMENT",
          gasPaymentMode,
          platform: "WEB",
          successPath,
          failurePath,
        });
      } else {
        await payEsewa({
          contractId,
          paymentScheduleId: selectedScheduleIds.join(","),
          amount: selectedAmount,
          type: "INSTALLMENT_PAYMENT",
          gasPaymentMode,
          platform: "WEB",
          successPath,
          failurePath,
        });
      }
    } catch (err: any) {
      toast({
        title: "Gateway Error",
        description: err?.data?.message || "Failed to initiate payment.",
        variant: "destructive",
      });
    }
  };

  return (
    <BorrowerLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Loan Management</h1>
            <p className="text-sm text-muted-foreground font-medium">Track your funding progress and repayment schedule</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" onClick={() => navigate(-1)} className="rounded-xl border-border/40 font-bold px-6 cursor-pointer">
                Back
             </Button>
             {canRepay && (
               <Button onClick={handlePaySelected} disabled={gatewayBusy} className="rounded-xl font-bold px-6 bg-primary shadow-lg shadow-primary/20 cursor-pointer">
                  <CreditCard className="w-4 h-4 mr-2" /> Pay Selected
               </Button>
             )}
          </div>
        </div>

        {isLoading || !loan ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="lg:col-span-2 h-[400px] rounded-3xl" />
            <Skeleton className="h-[400px] rounded-3xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-6">
              <Card className="rounded-xl border border-border bg-card shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
                <div className="h-1.5 w-full bg-primary/20" />
                <CardHeader className="flex flex-row items-center gap-3 border-b border-border/30 pb-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                     <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base font-bold text-foreground">{loan.purpose || "Loan Facility"}</CardTitle>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">#{loan.id.slice(0,12)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={cn("px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border", statusTheme?.chip)}>
                      {loan.status}
                    </Badge>
                    <BlockchainStatusBadge blockchainTxHash={(resolvedContract as any)?.blockchainTxHash} />
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Approved Funding</p>
                      <h2 className="text-4xl font-bold text-primary tracking-tight">
                        {money(loan.approvedAmount ?? loan.requestedAmount)}
                      </h2>
                    </div>
                    <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex items-center gap-4">
                       <MetricBox label="Interest" value={`${(loan as any).interestRate || "12.5"}%`} sub="APR" />
                       <div className="w-px h-8 bg-primary/10" />
                       <MetricBox label="Term" value={`${loan.approvedTermMonths || loan.requestedTermMonths}`} sub="Months" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-border/30">
                    <DetailItem label="Paid Installments" value={`${paidCount} of ${allSchedules.length}`} />
                    <DetailItem label="Next Due Date" value={nextDue ? new Date(nextDue.dueDate).toLocaleDateString() : "Fully Repaid"} />
                    <DetailItem label="Due Amount" value={nextDue ? money(getScheduleDueAmount(nextDue as any)) : "0.00"} />
                    <DetailItem label="Overdue" value={overdueCount > 0 ? `${overdueCount} Items` : "None"} />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border-border bg-card shadow-sm overflow-hidden">
                <div className="border-b border-border/30 p-6 bg-muted/5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold flex items-center gap-2">
                       <Calendar className="w-4 h-4 text-primary" /> Repayment Timeline
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase border-primary/20 text-primary">{payableSchedules.length} Pending</Badge>
                  </div>
                </div>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/30 max-h-[500px] overflow-y-auto no-scrollbar">
                    {allSchedules.length === 0 ? (
                      <div className="p-12 text-center text-muted-foreground">
                         <Clock3 className="w-8 h-8 mx-auto mb-3 opacity-20" />
                         <p className="font-bold text-sm tracking-tight">No repayment schedule generated yet.</p>
                      </div>
                    ) : (
                      allSchedules.map((s) => {
                        const paid = isSchedulePaid(s as any);
                        const selected = selectedScheduleIds.includes(s.id);
                        return (
                          <div 
                            key={s.id} 
                            onClick={() => !paid && toggleSchedule(s.id)}
                            className={cn(
                              "p-5 flex items-center justify-between gap-4 transition-all hover:bg-muted/10 group cursor-pointer",
                              paid && "opacity-60 cursor-default",
                              selected && "bg-primary/[0.03] border-l-4 border-l-primary -ml-[4px]"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                paid ? "bg-emerald-500 border-emerald-500 text-white" : 
                                selected ? "bg-primary border-primary text-white" : 
                                "border-border/60"
                              )}>
                                {paid && <CheckCircle2 className="w-4 h-4" />}
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Installment {s.installmentNumber}</p>
                                <p className="text-sm font-bold text-foreground">{new Date(s.dueDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold tracking-tight text-foreground">{money(getScheduleDueAmount(s as any))}</p>
                              <p className={cn("text-[10px] font-bold uppercase tracking-widest", paid ? "text-emerald-500" : overdueCount > 0 && Array.from(payableSchedules).indexOf(s) === 0 ? "text-red-500" : "text-muted-foreground")}>
                                {paid ? "Transaction Success" : overdueCount > 0 && Array.from(payableSchedules).indexOf(s) === 0 ? "Overdue" : "Pending Action"}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border-border bg-card shadow-sm overflow-hidden">
                <div className="border-b border-border/30 p-6 bg-muted/5">
                  <h3 className="text-base font-bold flex items-center gap-2">
                     <ShieldCheck className="w-4 h-4 text-emerald-500" /> Collateral & Asset Security
                  </h3>
                </div>
                <CardContent className="p-6">
                  {collateralEntries.length === 0 ? (
                    <p className="text-sm text-center py-8 text-muted-foreground italic">No collateral assets registered for this loan.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {collateralEntries.map(({ key, value }, idx) => (
                        <div key={idx} className="space-y-3 group">
                           <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{titleCase(key)}</p>
                           {isImageUrl(String(value)) ? (
                             <div className="aspect-[4/3] rounded-2xl border border-border/40 overflow-hidden bg-muted/5 group-hover:shadow-md transition-all">
                                <img src={String(value)} alt={key} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                             </div>
                           ) : (
                             <div className="p-4 rounded-2xl border border-border/20 bg-muted/10 font-bold text-sm text-foreground break-all shadow-inner">
                                {String(value)}
                             </div>
                           )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-6">
              {currentStatusInfo && (
                <div className={cn("p-6 rounded-xl border border-border shadow-sm space-y-3 bg-card", currentStatusInfo.tone)}>
                  <div className="flex items-center gap-2">
                     <StatusIcon className="w-5 h-5" />
                     <h4 className="font-bold text-sm uppercase tracking-wider">{currentStatusInfo.title}</h4>
                  </div>
                  <p className="text-xs font-medium leading-relaxed opacity-80">{currentStatusInfo.body}</p>
                </div>
              )}

              <Card className="rounded-xl border-border bg-card shadow-sm overflow-hidden">
                <div className="border-b border-border/30 p-6">
                  <h3 className="text-base font-bold">Lender Insight</h3>
                </div>
                <CardContent className="p-6 space-y-6 flex-1">
                  <div className="flex items-center gap-4 p-4 rounded-2xl border border-border/20 bg-white dark:bg-muted/5 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                       <Building2 className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                       <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Lender Partner</p>
                       <p className="text-sm font-bold text-foreground truncate">{loan.tenantId.slice(0,10)} FINANCIAL CORP</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Compliance Progress</p>
                    <div className="space-y-4">
                       <ProgressItem label="Credit Approval" done />
                       <ProgressItem label="Document Verification" done />
                       <ProgressItem label="Blockchain Anchoring" done={!!loan.blockchainTxHash} />
                       <ProgressItem label="Fund Disbursement" done={loan.status === LoanStatus.LOAN_PROVIDED || loan.status === LoanStatus.PARTIALLY_PAID || loan.status === LoanStatus.PAID} />
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-border/30 space-y-4">
                     <Link to={`/lenders/${loan.tenantId}`} className="block">
                        <Button variant="outline" className="w-full rounded-2xl h-12 font-bold bg-muted/10 border-border/40 hover:bg-muted/20 cursor-pointer">
                           Lender Profile
                        </Button>
                     </Link>
                     {resolvedContract && (
                       <Link to={`/contracts/${contractId}`} className="block">
                         <Button className="w-full rounded-2xl h-12 font-bold bg-foreground text-background hover:bg-foreground/90 cursor-pointer">
                           View Signed Contract
                         </Button>
                       </Link>
                     )}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl bg-primary/5 border border-primary/20">
                 <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                       <p className="text-xs font-bold text-primary uppercase tracking-widest">Total Repayable</p>
                       <p className="text-xl font-bold text-primary tracking-tight">{money(loan.requestedAmount * 1.15)}</p>
                    </div>
                    <div className="space-y-2">
                       <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-700" 
                            style={{ width: `${(paidCount / schedules.length) * 100}%` }} 
                          />
                       </div>
                       <p className="text-[10px] font-bold text-primary/60 text-right uppercase tracking-tighter">
                          {Math.round((paidCount / schedules.length) * 100)}% Recovered
                       </p>
                    </div>
                 </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {showGatewayPicker && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
           <Card className="w-full max-w-sm rounded-xl border border-border bg-card shadow-xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-6 border-b border-border/30 flex items-center justify-between">
                 <h3 className="font-bold text-lg">Select Gateway</h3>
                 <button onClick={() => setShowGatewayPicker(false)} className="rounded-full cursor-pointer hover:bg-muted p-1 transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <CardContent className="p-6 space-y-4">
                 <button 
                  onClick={() => setGateway("KHALTI")}
                  className={cn("w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer hover:shadow-lg", gateway === "KHALTI" ? "border-purple-500 bg-purple-500/5 shadow-purple-500/10" : "border-border/30")}
                 >
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-purple-500 p-2"><img src="/images/khalti-logo.png" alt="K" className="w-full h-full object-contain" /></div>
                       <span className="font-bold text-purple-600">Khalti Wallet</span>
                    </div>
                    {gateway === "KHALTI" && <div className="w-3 h-3 rounded-full bg-purple-500 ring-4 ring-purple-500/20" />}
                 </button>
                 <button 
                  onClick={() => setGateway("ESEWA")}
                  className={cn("w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer hover:shadow-lg", gateway === "ESEWA" ? "border-emerald-500 bg-emerald-500/5 shadow-emerald-500/10" : "border-border/30")}
                 >
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-emerald-500 p-2"><img src="/images/esewa-logo.png" alt="E" className="w-full h-full object-contain" /></div>
                       <span className="font-bold text-emerald-600">eSewa Nepal</span>
                    </div>
                    {gateway === "ESEWA" && <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />}
                 </button>

                 <div className="pt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm px-1">
                       <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Total Amount</span>
                       <span className="font-bold text-xl tracking-tight">{money(selectedAmount)}</span>
                    </div>
                    <Button onClick={handleGatewayPayment} className="w-full h-12 rounded-xl font-bold uppercase tracking-wide bg-primary shadow-lg shadow-primary/20 text-md cursor-pointer transition-all active:scale-95">
                       Verify and Pay
                    </Button>
                 </div>
              </CardContent>
           </Card>
        </div>
      )}
    </BorrowerLayout>
  );
}

function DetailItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground">{value || "N/A"}</p>
    </div>
  );
}

function MetricBox({ label, value, sub }: { label: string; value: any; sub: string }) {
  return (
    <div className="text-center">
      <p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground/60">{label}</p>
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-base font-bold text-primary">{value}</span>
        <span className="text-[8px] font-bold text-muted-foreground uppercase">{sub}</span>
      </div>
    </div>
  );
}

function ProgressItem({ label, done }: { label: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-3 transition-all duration-500" style={{ opacity: done ? 1 : 0.4 }}>
       <div className={cn("w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all shadow-sm", done ? "bg-emerald-500 border-emerald-500 text-white" : "border-border/60 bg-transparent text-transparent")}>
          <CheckCircle2 className="w-3 h-3" />
       </div>
       <span className={cn("text-xs font-bold tracking-tight", done ? "text-foreground" : "text-muted-foreground")}>{label}</span>
    </div>
  );
}
