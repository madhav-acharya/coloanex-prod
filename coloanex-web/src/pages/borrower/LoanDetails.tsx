import { useEffect, useMemo, useState } from "react";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BlockchainStatusBadge } from "@/components/shared/BlockchainStatusBadge";
import { Link, useParams } from "react-router-dom";
import { useGetLoanQuery } from "@/apis/loansApi";
import { useGetPaymentSchedulesByContractQuery } from "@/apis/paymentSchedulesApi";
import { useGetContractsQuery } from "@/apis/contractsApi";
import { useGetMyWalletsQuery } from "@/apis/walletsApi";
import { useListMySubscriptionsQuery } from "@/apis/subscriptionsApi";
import { LoanStatus } from "@/types/loan";
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
    <BorrowerLayout
      title="Loan Details"
      description="Track status, contract, and repayment progress"
    >
      <div className="space-y-6 lg:space-y-8">
        <div className="flex items-center justify-between">
          <Link
            to="/borrower/profile?section=my-loans"
            className="text-sm font-medium text-primary hover:underline"
          >
            Back to My Loans
          </Link>
          {canRepay && id && (
            <Button
              className="h-9 px-4 hidden sm:inline-flex"
              onClick={handlePaySelected}
              disabled={gatewayBusy}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {selectedScheduleIds.length > 0
                ? `Pay Selected (${selectedScheduleIds.length})`
                : "Make Repayment"}
            </Button>
          )}
        </div>

        {isLoading || !loan ? (
          <Card className="border-border/30 bg-card">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4 max-w-4xl mx-auto lg:hidden">
              <Card className="border-border/30 bg-card">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground line-clamp-1">
                          {loan.purpose || "Loan Request"}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          #{loan.id.slice(0, 12).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <Badge className={statusTheme?.chip}>
                      {titleCase(loan.status)}
                    </Badge>
                  </div>

                  <div className="rounded-xl border border-border/20 bg-muted/10 px-3 py-3 text-center">
                    <p className="text-[11px] text-muted-foreground">
                      Current Amount
                    </p>
                    <p className="text-xl font-bold text-foreground mt-1">
                      {money(loan.approvedAmount ?? loan.requestedAmount)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-lg border border-border/20 bg-muted/10 p-2.5">
                      <p className="text-[11px] text-muted-foreground">
                        Requested
                      </p>
                      <p className="text-sm font-semibold mt-1">
                        {money(loan.requestedAmount)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/20 bg-muted/10 p-2.5">
                      <p className="text-[11px] text-muted-foreground">Term</p>
                      <p className="text-sm font-semibold mt-1">
                        {loan.approvedTermMonths ?? loan.requestedTermMonths}{" "}
                        months
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <StatusIcon className="w-3.5 h-3.5" /> {statusTheme?.note}
                    </span>
                    <BlockchainStatusBadge
                      blockchainTxHash={loan.blockchainTxHash}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/30 bg-card">
                <CardContent className="p-4 space-y-3">
                  <h3 className="text-sm font-semibold">Loan Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Applied On</span>
                      <span>
                        {new Date(loan.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Last Updated
                      </span>
                      <span>
                        {new Date(loan.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {loan.rejectionReason && (
                      <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-red-600 text-xs">
                        {loan.rejectionReason}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {currentStatusInfo && (
                <Card className="border-border/30 bg-card">
                  <CardContent className="p-4">
                    <div
                      className={`rounded-lg border px-3 py-3 ${currentStatusInfo.tone}`}
                    >
                      <p className="text-sm font-semibold">
                        {currentStatusInfo.title}
                      </p>
                      <p className="text-xs mt-1.5">{currentStatusInfo.body}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {collateralEntries.length > 0 && (
                <Card className="border-border/30 bg-card">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="text-sm font-semibold">
                      Collateral Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      {collateralEntries.map(({ key, value }) =>
                        typeof value === "string" && isImageUrl(value) ? (
                          <div
                            key={key}
                            className="space-y-2 rounded-lg border border-border/20 bg-muted/10 p-2.5"
                          >
                            <p className="text-xs text-muted-foreground">
                              {titleCase(key)}
                            </p>
                            <img
                              src={value}
                              alt={titleCase(key)}
                              className="w-full h-44 rounded-md object-cover border border-border/20"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div key={key} className="flex justify-between gap-3">
                            <span className="text-muted-foreground">
                              {titleCase(key)}
                            </span>
                            {typeof value === "string" &&
                            /^https?:\/\//i.test(value) ? (
                              <a
                                href={value}
                                target="_blank"
                                rel="noreferrer"
                                className="text-right break-all text-primary inline-flex items-center gap-1 hover:underline"
                              >
                                Open Link <LinkIcon className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-right break-all">
                                {String(value)}
                              </span>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {resolvedContract && (
                <Card className="border-border/30 bg-card">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="text-sm font-semibold">Contract</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Number</span>
                        <span>{resolvedContract.contractNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span>{titleCase(resolvedContract.status)}</span>
                      </div>
                    </div>
                    {canSignContract && contractId && (
                      <Link to={`/contracts/${contractId}`}>
                        <Button variant="outline" className="w-full h-9">
                          <ShieldCheck className="w-4 h-4 mr-2" /> View & Sign
                          Contract
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              )}

              {canRepay && (
                <Card className="border-border/30 bg-card">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="text-sm font-semibold">Payment Schedule</h3>
                    {allSchedules.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No pending repayments found.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {allSchedules.slice(0, 8).map((s) => {
                          const checked = selectedScheduleIds.includes(s.id);
                          const scheduleDue = getScheduleDueAmount(
                            s as unknown as Record<string, unknown>,
                          );
                          const schedulePaid = isSchedulePaid(
                            s as unknown as Record<string, unknown>,
                          );
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                if (schedulePaid) return;
                                toggleSchedule(s.id);
                              }}
                              className={`w-full rounded-lg border p-2.5 text-left transition-colors ${
                                schedulePaid
                                  ? "border-border/20 bg-muted/10"
                                  : checked
                                    ? "border-primary bg-primary/5"
                                    : "border-border/20 bg-muted/10"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className={`w-4 h-4 rounded border ${schedulePaid ? "bg-emerald-500/15 border-emerald-500/40" : checked ? "bg-primary border-primary" : "border-border/60"}`}
                                  />
                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      Installment {s.installmentNumber}
                                    </p>
                                    <p className="text-sm font-medium mt-0.5">
                                      {new Date(s.dueDate).toLocaleDateString()}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                      P:{" "}
                                      {Number(
                                        (s as any).principalAmount || 0,
                                      ).toFixed(2)}{" "}
                                      • I:{" "}
                                      {Number(
                                        (s as any).interestAmount || 0,
                                      ).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold">
                                    {money(scheduleDue)}
                                  </p>
                                  <p
                                    className={`text-xs mt-0.5 ${schedulePaid ? "text-emerald-500" : "text-muted-foreground"}`}
                                  >
                                    {schedulePaid ? "Paid" : "Pending"}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="hidden lg:grid grid-cols-12 gap-6">
              <div className="col-span-12 xl:col-span-8 space-y-6">
                <Card className="border-border/20 bg-surface/20">
                  <CardContent className="p-7 space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-2xl font-bold text-foreground line-clamp-1">
                            {loan.purpose || "Loan Request"}
                          </h2>
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            #{loan.id}
                          </p>
                        </div>
                      </div>
                      <Badge className={statusTheme?.chip}>
                        {titleCase(loan.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <div className="rounded-xl border border-border/20 bg-muted/10 p-3">
                        <p className="text-[11px] text-muted-foreground">
                          Current Amount
                        </p>
                        <p className="text-base font-bold mt-1">
                          {money(loan.approvedAmount ?? loan.requestedAmount)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border/20 bg-muted/10 p-3">
                        <p className="text-[11px] text-muted-foreground">
                          Requested
                        </p>
                        <p className="text-base font-bold mt-1">
                          {money(loan.requestedAmount)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border/20 bg-muted/10 p-3">
                        <p className="text-[11px] text-muted-foreground">
                          Term
                        </p>
                        <p className="text-base font-bold mt-1">
                          {loan.approvedTermMonths ?? loan.requestedTermMonths}{" "}
                          mo
                        </p>
                      </div>
                      <div className="rounded-xl border border-border/20 bg-muted/10 p-3">
                        <p className="text-[11px] text-muted-foreground">
                          Blockchain
                        </p>
                        <div className="mt-2">
                          <BlockchainStatusBadge
                            blockchainTxHash={loan.blockchainTxHash}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold">
                          Loan Information
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Applied On
                            </span>
                            <span>
                              {new Date(loan.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Last Updated
                            </span>
                            <span>
                              {new Date(loan.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Borrower
                            </span>
                            <span>{loan.borrower?.user?.fullName || "-"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold">
                          Lender Information
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="w-4 h-4" />
                            <span>Institutional lender</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>Loan active timeline</span>
                          </div>
                          <Link to={`/borrower/lenders/${loan.tenantId}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-1"
                            >
                              View Lender Profile
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>

                    {loan.rejectionReason && (
                      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
                        {loan.rejectionReason}
                      </div>
                    )}

                    {currentStatusInfo && (
                      <div
                        className={`rounded-xl border px-4 py-3 ${currentStatusInfo.tone}`}
                      >
                        <p className="text-sm font-semibold">
                          {currentStatusInfo.title}
                        </p>
                        <p className="text-xs mt-1.5 leading-relaxed">
                          {currentStatusInfo.body}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {collateralEntries.length > 0 && (
                  <Card className="border-border/20 bg-card">
                    <CardContent className="p-6">
                      <h3 className="text-base font-semibold mb-4">
                        Collateral Details
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {collateralEntries.map(({ key, value }) =>
                          typeof value === "string" && isImageUrl(value) ? (
                            <div
                              key={key}
                              className="rounded-lg border border-border/20 bg-muted/10 p-2.5"
                            >
                              <p className="text-[11px] text-muted-foreground mb-2">
                                {titleCase(key)}
                              </p>
                              <img
                                src={value}
                                alt={titleCase(key)}
                                className="w-full h-48 rounded-md object-cover border border-border/20"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div
                              key={key}
                              className="rounded-lg border border-border/20 bg-muted/10 px-3 py-2.5"
                            >
                              <p className="text-[11px] text-muted-foreground">
                                {titleCase(key)}
                              </p>
                              {typeof value === "string" &&
                              /^https?:\/\//i.test(value) ? (
                                <a
                                  href={value}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-1 font-medium text-primary inline-flex items-center gap-1 hover:underline break-all"
                                >
                                  Open Link <LinkIcon className="w-3 h-3" />
                                </a>
                              ) : (
                                <p className="mt-1 font-medium break-all">
                                  {String(value)}
                                </p>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {canRepay && (
                  <Card className="border-border/20 bg-card">
                    <CardContent className="p-6">
                      <h3 className="text-base font-semibold mb-4">
                        Payment Schedule
                      </h3>
                      {allSchedules.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No pending repayments found.
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          {allSchedules.map((s) => {
                            const checked = selectedScheduleIds.includes(s.id);
                            const scheduleDue = getScheduleDueAmount(
                              s as unknown as Record<string, unknown>,
                            );
                            const schedulePaid = isSchedulePaid(
                              s as unknown as Record<string, unknown>,
                            );
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  if (schedulePaid) return;
                                  toggleSchedule(s.id);
                                }}
                                className={`w-full rounded-lg border px-3.5 py-3 text-left transition-colors ${
                                  schedulePaid
                                    ? "border-border/20 bg-muted/10"
                                    : checked
                                      ? "border-primary bg-primary/5"
                                      : "border-border/20 bg-muted/10"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div
                                      className={`w-4 h-4 rounded border ${schedulePaid ? "bg-emerald-500/15 border-emerald-500/40" : checked ? "bg-primary border-primary" : "border-border/60"}`}
                                    />
                                    <div>
                                      <p className="text-xs text-muted-foreground">
                                        Installment {s.installmentNumber}
                                      </p>
                                      <p className="text-sm font-semibold mt-0.5">
                                        {new Date(
                                          s.dueDate,
                                        ).toLocaleDateString()}
                                      </p>
                                      <p className="text-[11px] text-muted-foreground mt-0.5">
                                        P:{" "}
                                        {Number(
                                          (s as any).principalAmount || 0,
                                        ).toFixed(2)}{" "}
                                        • I:{" "}
                                        {Number(
                                          (s as any).interestAmount || 0,
                                        ).toFixed(2)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-semibold">
                                      {money(scheduleDue)}
                                    </p>
                                    <p
                                      className={`text-xs mt-0.5 ${schedulePaid ? "text-emerald-500" : "text-muted-foreground"}`}
                                    >
                                      {schedulePaid ? "Paid" : "Pending"}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="col-span-12 xl:col-span-4 space-y-6">
                <Card className="border-border/20 bg-card sticky top-28">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-base font-semibold">Loan Actions</h3>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Paid installments
                        </span>
                        <span className="font-semibold">{paidCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Overdue</span>
                        <span className="font-semibold">{overdueCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Next due</span>
                        <span className="font-semibold">
                          {nextDue
                            ? new Date(nextDue.dueDate).toLocaleDateString()
                            : "None"}
                        </span>
                      </div>
                    </div>

                    {canRepay && id && (
                      <Button
                        className="w-full h-10"
                        onClick={handlePaySelected}
                        disabled={gatewayBusy}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        {selectedScheduleIds.length > 0
                          ? `Pay Selected (${selectedScheduleIds.length})`
                          : "Make Repayment"}
                      </Button>
                    )}

                    {canSignContract && contractId && (
                      <Link to={`/contracts/${contractId}`}>
                        <Button variant="outline" className="w-full h-10">
                          <ShieldCheck className="w-4 h-4 mr-2" /> View & Sign
                          Contract
                        </Button>
                      </Link>
                    )}

                    {resolvedContract && (
                      <div className="rounded-lg border border-border/20 bg-muted/10 px-3 py-2.5">
                        <p className="text-[11px] text-muted-foreground">
                          Contract
                        </p>
                        <p className="text-sm font-medium mt-1">
                          {resolvedContract.contractNumber}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {titleCase(resolvedContract.status)}
                        </p>
                      </div>
                    )}

                    {selectedScheduleIds.length > 0 && (
                      <div className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5">
                        <p className="text-[11px] text-muted-foreground">
                          Selected payable
                        </p>
                        <p className="text-sm font-semibold mt-1">
                          {money(selectedAmount)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {canRepay && id && (
              <div className="sm:hidden fixed bottom-20 left-3 right-3 z-[130]">
                <Button
                  className="w-full h-11 shadow-xl"
                  onClick={handlePaySelected}
                  disabled={gatewayBusy}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {selectedScheduleIds.length > 0
                    ? `Pay Selected (${selectedScheduleIds.length})`
                    : "Make Repayment"}
                </Button>
              </div>
            )}
          </>
        )}

        {showGatewayPicker && (
          <div className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-2 border-primary/20 bg-card">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">Payment Method</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select your preferred gateway
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowGatewayPicker(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className={`h-24 flex flex-col gap-2 transition-all ${gateway === "KHALTI" ? "border-primary bg-primary/5" : ""}`}
                    onClick={() => setGateway("KHALTI")}
                  >
                    <img
                      src="/images/khalti.png"
                      alt="Khalti"
                      className="h-8"
                    />
                    <span className="text-xs">Khalti</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={`h-24 flex flex-col gap-2 transition-all ${gateway === "ESEWA" ? "border-primary bg-primary/5" : ""}`}
                    onClick={() => setGateway("ESEWA")}
                  >
                    <img src="/images/esewa.png" alt="eSewa" className="h-8" />
                    <span className="text-xs">eSewa</span>
                  </Button>
                </div>

                <div className="rounded-xl border border-border/20 bg-muted/10 p-3 text-sm flex items-center justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">{money(selectedAmount)}</span>
                </div>

                <div className="flex gap-3 justify-end mt-6">
                  <Button
                    variant="ghost"
                    onClick={() => setShowGatewayPicker(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleGatewayPayment} disabled={gatewayBusy}>
                    {gatewayBusy ? "Processing..." : "Complete Payment"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </BorrowerLayout>
  );
}
