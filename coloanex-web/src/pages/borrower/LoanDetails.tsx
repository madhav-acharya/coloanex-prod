import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Button } from "@/components/ui/button";
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
  Building2,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  ShieldCheck,
  X,
  Info,
  ChevronLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/shared/PageShell";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { GlassCard } from "@/components/shared/GlassCard";
import { Bone } from "@/components/shared/Bone";
import { ParallaxLayer } from "@/components/shared/ParallaxLayer";
import { useRevealOnMount } from "@/hooks/useReveal";

const SceneCanvas = lazy(() => import("@/components/shared/SceneCanvas"));

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
  const configs: Record<
    LoanStatus,
    { icon: any; className: string; label: string; tone: string }
  > = {
    [LoanStatus.DRAFT]: {
      icon: FileText,
      className: "bg-muted text-muted-foreground",
      label: "Draft",
      tone: "bg-muted/40 text-foreground border-border",
    },
    [LoanStatus.SUBMITTED]: {
      icon: Clock3,
      className: "bg-primary/10 text-primary",
      label: "Submitted",
      tone: "bg-primary/5 text-foreground border-primary/20",
    },
    [LoanStatus.UNDER_REVIEW]: {
      icon: Info,
      className: "bg-muted text-foreground",
      label: "Under Review",
      tone: "bg-muted/40 text-foreground border-border",
    },
    [LoanStatus.APPROVED]: {
      icon: CheckCircle2,
      className: "bg-primary/15 text-primary",
      label: "Approved",
      tone: "bg-primary/5 text-foreground border-primary/20",
    },
    [LoanStatus.CONTRACT_GENERATED]: {
      icon: FileText,
      className: "bg-primary/10 text-primary",
      label: "Contract Ready",
      tone: "bg-primary/5 text-foreground border-primary/20",
    },
    [LoanStatus.CONTRACT_SIGNED]: {
      icon: ShieldCheck,
      className: "bg-primary/15 text-primary",
      label: "Signed",
      tone: "bg-primary/5 text-foreground border-primary/20",
    },
    [LoanStatus.LOAN_PROVIDED]: {
      icon: CheckCircle2,
      className: "bg-primary/20 text-primary",
      label: "Disbursed",
      tone: "bg-primary/5 text-foreground border-primary/20",
    },
    [LoanStatus.PARTIALLY_PAID]: {
      icon: Clock3,
      className: "bg-muted text-foreground",
      label: "Partial Paid",
      tone: "bg-muted/40 text-foreground border-border",
    },
    [LoanStatus.PAID]: {
      icon: CheckCircle2,
      className: "bg-primary/15 text-primary",
      label: "Fully Repaid",
      tone: "bg-primary/5 text-foreground border-primary/20",
    },
    [LoanStatus.REJECTED]: {
      icon: AlertTriangle,
      className: "bg-destructive/10 text-destructive",
      label: "Rejected",
      tone: "bg-destructive/5 text-foreground border-destructive/20",
    },
  };
  return configs[status] || configs[LoanStatus.DRAFT];
};

const flattenCollateral = (
  value: any,
  keyPrefix = "",
): Array<{ key: string; value: any }> => {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      flattenCollateral(
        item,
        keyPrefix ? `${keyPrefix} ${index + 1}` : `${index + 1}`,
      ),
    );
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      flattenCollateral(child, keyPrefix ? `${keyPrefix} ${key}` : key),
    );
  }
  return [{ key: keyPrefix || "value", value }];
};

export default function LoanDetails() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const revealRef = useRevealOnMount([]);

  const { data: loan, isLoading } = useGetLoanQuery(id || "", { skip: !id });
  const { data: contracts = [] } = useGetContractsQuery();
  const { data: wallets = [] } = useGetMyWalletsQuery();
  const { data: mySubscriptions = [] } = useListMySubscriptionsQuery();

  const { pay: payKhalti } = useKhaltiPayment();
  const { pay: payEsewa } = useEsewaPayment();

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
    { skip: !contractId },
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
    () => allSchedules.filter((s) => !isSchedulePaid(s)),
    [allSchedules],
  );

  const selectedAmount = useMemo(
    () =>
      payableSchedules
        .filter((s) => selectedScheduleIds.includes(s.id))
        .reduce((sum, s) => sum + getScheduleDueAmount(s), 0),
    [payableSchedules, selectedScheduleIds],
  );

  useEffect(() => {
    if (selectedScheduleIds.length > 0 || payableSchedules.length === 0) return;
    setSelectedScheduleIds([payableSchedules[0].id]);
  }, [payableSchedules, selectedScheduleIds.length]);

  const blockchainAccess = useMemo(
    () =>
      getBlockchainAccessSnapshot({
        gasPaymentMode: (user as { gasPaymentMode?: string })?.gasPaymentMode,
        wallets,
        subscriptions: mySubscriptions,
      }),
    [user, wallets, mySubscriptions],
  );

  const canRepay =
    loan?.status === LoanStatus.LOAN_PROVIDED ||
    loan?.status === LoanStatus.PARTIALLY_PAID ||
    loan?.status === LoanStatus.CONTRACT_SIGNED;
  const statusTheme = loan
    ? getStatusConfig(loan.status)
    : getStatusConfig(LoanStatus.DRAFT);

  const collateralEntries = flattenCollateral(
    loan?.collateralDetails || {},
  ).filter(
    (e) =>
      e.value !== null &&
      e.value !== undefined &&
      String(e.value).trim().length > 0,
  );

  const toggleSchedule = (sid: string) => {
    setSelectedScheduleIds((prev) =>
      prev.includes(sid) ? prev.filter((id) => id !== sid) : [...prev, sid],
    );
  };

  const handlePaySelected = () => {
    if (!contractId) {
      toast({
        title: "Contract required",
        description: "Loan contract is not yet finalized.",
        variant: "destructive",
      });
      return;
    }
    if (selectedScheduleIds.length === 0) {
      toast({
        title: "Select installment",
        description: "Please select at least one unit to pay.",
        variant: "destructive",
      });
      return;
    }
    setShowGatewayPicker(true);
  };

  const handleGatewayPayment = async () => {
    if (!contractId || !id || selectedAmount <= 0) return;
    const gasMode =
      blockchainAccess.mode === "USER_WALLET"
        ? "USER_WALLET"
        : "PLATFORM_WALLET";
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
      toast({
        title: "Payment Failed",
        description: e?.data?.message || "Internal gateway error.",
        variant: "destructive",
      });
    }
  };

  return (
    <BorrowerLayout>
      <div className="relative overflow-hidden min-h-[70vh]">
        <Suspense fallback={null}>
          <SceneCanvas
            variant="crystal"
            density={22}
            className="opacity-40 h-[260px]"
          />
        </Suspense>
        <PageShell className="relative z-10 space-y-8 pb-16 pt-6">
          <ParallaxLayer speed={0.2} clamp={100}>
            <SectionHeader
              title="Loan Facility"
              description="Facility details, schedule, and repayment"
              actions={
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="rounded-2xl h-11 text-muted-foreground"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  {canRepay && (
                    <Button
                      onClick={handlePaySelected}
                      className="rounded-2xl h-11 px-6 font-semibold"
                    >
                      <CreditCard className="w-4 h-4 mr-2" /> Make Repayment
                    </Button>
                  )}
                </div>
              }
            />
          </ParallaxLayer>

          <Bone name="borrower-loan-details" loading={isLoading || !loan} minHeight={420}>
            {loan ? (
              <div
                ref={revealRef as React.RefObject<HTMLDivElement>}
                className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start"
              >
                <div className="lg:col-span-8 space-y-6" data-reveal>
                  <GlassCard className="p-5 sm:p-8">
                    <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-border/40">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-foreground font-[family-name:var(--font-headline)]">
                            {loan.purpose || "Facility Details"}
                          </h2>
                          <p className="text-[11px] font-bold text-muted-foreground tracking-wider mt-0.5">
                            Reference: {loan.id.slice(0, 10)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:items-end gap-2">
                        <span
                          className={cn(
                            "px-3 py-1 rounded-lg text-[11px] font-bold tracking-wider w-fit",
                            statusTheme.className,
                          )}
                        >
                          {statusTheme.label}
                        </span>
                        <BlockchainStatusBadge
                          blockchainTxHash={
                            (resolvedContract as any)?.blockchainTxHash
                          }
                        />
                      </div>
                    </div>

                    <div className="pt-6 grid sm:grid-cols-2 gap-8">
                      <div>
                        <p className="text-[11px] font-bold text-muted-foreground tracking-wider mb-1.5">
                          Approved Capital
                        </p>
                        <h2 className="text-2xl font-bold text-foreground tracking-tight font-[family-name:var(--font-headline)]">
                          {money(loan.approvedAmount ?? loan.requestedAmount)}
                        </h2>
                        <div className="mt-4 flex gap-6">
                          <Metric
                            small
                            label="Rate"
                            value={`${(loan as any).interestRate || "12.5"}%`}
                          />
                          <Metric
                            small
                            label="Duration"
                            value={`${loan.approvedTermMonths || loan.requestedTermMonths} Mo`}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 bg-muted/30 p-5 rounded-2xl border border-border/40">
                        <Metric
                          label="Paid"
                          value={
                            schedules.filter((s) => s.status === "PAID").length
                          }
                          sub={`/ ${allSchedules.length}`}
                        />
                        <Metric
                          label="Next Due"
                          value={
                            payableSchedules[0]
                              ? format(
                                  new Date(payableSchedules[0].dueDate),
                                  "MMM dd",
                                )
                              : "N/A"
                          }
                        />
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard className="overflow-hidden">
                    <div className="p-5 border-b border-border/40 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-bold tracking-wider font-[family-name:var(--font-headline)]">
                        Repayment Schedule
                      </h3>
                      <Badge variant="outline" className="rounded-lg">
                        {payableSchedules.length} Pending
                      </Badge>
                    </div>
                    <div className="divide-y divide-border/40 max-h-[500px] overflow-y-auto">
                      {allSchedules.map((s) => {
                        const isPaid = isSchedulePaid(s);
                        const isSelected = selectedScheduleIds.includes(s.id);
                        return (
                          <div
                            key={s.id}
                            onClick={() => !isPaid && toggleSchedule(s.id)}
                            className={cn(
                              "p-4 sm:p-5 flex items-center justify-between transition-all cursor-pointer",
                              isPaid
                                ? "opacity-50 pointer-events-none"
                                : "hover:bg-muted/20",
                              isSelected && "bg-primary/5",
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={cn(
                                  "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                  isPaid
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : isSelected
                                      ? "bg-primary border-primary text-primary-foreground"
                                      : "border-border/60",
                                )}
                              >
                                {(isPaid || isSelected) && (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-foreground">
                                  Installment #{s.installmentNumber}
                                </p>
                                <p className="text-[11px] text-muted-foreground tracking-wider font-semibold">
                                  {format(new Date(s.dueDate), "MMM dd, yyyy")}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-foreground">
                                {money(getScheduleDueAmount(s))}
                              </p>
                              <p className="text-[11px] font-bold tracking-wider text-muted-foreground mt-0.5">
                                {isPaid ? "Received" : "Upcoming"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </GlassCard>

                  {collateralEntries.length > 0 && (
                    <GlassCard className="p-5 sm:p-8 space-y-6">
                      <h3 className="text-sm font-bold tracking-wider font-[family-name:var(--font-headline)]">
                        Collateral
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {collateralEntries.map((e, idx) => (
                          <div key={idx} className="space-y-2">
                            <p className="text-[11px] font-bold text-muted-foreground tracking-wider">
                              {titleCase(e.key)}
                            </p>
                            <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 font-semibold text-sm break-all text-foreground">
                              {String(e.value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  )}
                </div>

                <div className="lg:col-span-4 space-y-5" data-reveal>
                  <GlassCard
                    className={cn("p-5 sm:p-6 space-y-4 border", statusTheme.tone)}
                  >
                    <div className="flex items-center gap-3">
                      <statusTheme.icon className="w-5 h-5 shrink-0" />
                      <h4 className="font-bold text-sm tracking-wider">
                        Status: {statusTheme.label}
                      </h4>
                    </div>
                    <p className="text-xs font-medium leading-relaxed opacity-80">
                      Repayments are monitored via smart contracts for
                      transparent settlement verification.
                    </p>
                  </GlassCard>

                  <GlassCard className="p-5 sm:p-6 space-y-6">
                    <div>
                      <h3 className="text-xs font-bold tracking-wider text-muted-foreground mb-4">
                        Lending Partner
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-muted/40 border border-border/40 flex items-center justify-center text-primary">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-bold text-foreground truncate">
                          {loan.tenantId.slice(0, 10)} CAP
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-border/40">
                      <Progress label="Analysis" done />
                      <Progress label="Verification" done />
                      <Progress
                        label="Ledger Update"
                        done={!!resolvedContract}
                      />
                      <Progress
                        label="Repayment"
                        done={loan.status === LoanStatus.PAID}
                      />
                    </div>

                    <div className="pt-4 border-t border-border/40 space-y-3">
                      <Link to={`/lenders/${loan.tenantId}`} className="block">
                        <Button
                          variant="outline"
                          className="w-full rounded-2xl text-xs font-bold tracking-wider h-11"
                        >
                          Partner Info
                        </Button>
                      </Link>
                      {resolvedContract && (
                        <Link to={`/contracts/${contractId}`} className="block">
                          <Button className="w-full rounded-2xl text-xs font-bold tracking-wider h-11">
                            View Contract
                          </Button>
                        </Link>
                      )}
                    </div>
                  </GlassCard>
                </div>
              </div>
            ) : null}
          </Bone>
        </PageShell>
      </div>

      {showGatewayPicker && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-background/70 backdrop-blur-md">
          <GlassCard className="w-full max-w-sm overflow-hidden">
            <div className="p-5 border-b border-border/40 flex items-center justify-between">
              <h3 className="font-bold text-lg font-[family-name:var(--font-headline)]">
                Select Wallet
              </h3>
              <button
                onClick={() => setShowGatewayPicker(false)}
                className="rounded-xl p-2 hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <GatewayBtn
                label="Khalti Pay"
                active={gateway === "KHALTI"}
                onClick={() => setGateway("KHALTI")}
              />
              <GatewayBtn
                label="eSewa Mobile"
                active={gateway === "ESEWA"}
                onClick={() => setGateway("ESEWA")}
              />
              <div className="pt-5 mt-2 border-t border-border/40">
                <div className="flex items-center justify-between mb-5 px-1">
                  <span className="text-[11px] font-bold text-muted-foreground tracking-wider">
                    Payable
                  </span>
                  <span className="font-bold text-xl">{money(selectedAmount)}</span>
                </div>
                <Button
                  onClick={handleGatewayPayment}
                  className="w-full h-12 rounded-2xl font-bold tracking-wider text-xs"
                >
                  Confirm Transaction
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </BorrowerLayout>
  );
}

function Metric({
  label,
  value,
  sub,
  small,
}: {
  label: string;
  value: any;
  sub?: string;
  small?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-bold text-muted-foreground tracking-wider mb-1 opacity-60">
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            "font-bold text-foreground",
            small ? "text-lg" : "text-xl",
          )}
        >
          {value}
        </span>
        {sub && (
          <span className="text-[11px] font-bold text-muted-foreground">
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

function Progress({ label, done }: { label: string; done: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 transition-opacity",
        !done && "opacity-30",
      )}
    >
      <div
        className={cn(
          "w-4 h-4 rounded-full border flex items-center justify-center",
          done
            ? "bg-primary border-primary text-primary-foreground"
            : "border-border/60",
        )}
      >
        <CheckCircle2 className="w-2.5 h-2.5" />
      </div>
      <span className="text-[11px] font-bold tracking-wider text-foreground">
        {label}
      </span>
    </div>
  );
}

function GatewayBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
        active
          ? "border-primary bg-primary/5"
          : "border-border/60 hover:border-border",
      )}
    >
      <span
        className={cn(
          "font-bold text-sm",
          active ? "text-primary" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <div
        className={cn(
          "w-4 h-4 rounded-full border-2",
          active ? "bg-primary border-primary" : "border-border/60",
        )}
      />
    </button>
  );
}
