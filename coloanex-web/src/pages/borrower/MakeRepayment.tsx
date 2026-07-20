import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Button } from "@/components/ui/button";
import {
  useParams,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useGetLoanQuery } from "@/apis/loansApi";
import { useGetPaymentSchedulesByContractQuery } from "@/apis/paymentSchedulesApi";
import { useGetContractsQuery } from "@/apis/contractsApi";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getBlockchainAccessSnapshot } from "@/utils/blockchainAccess";
import { useGetMyWalletsQuery } from "@/apis/walletsApi";
import { useListMySubscriptionsQuery } from "@/apis/subscriptionsApi";
import { useEsewaPayment } from "@/hooks/useEsewaPayment";
import { useKhaltiPayment } from "@/hooks/useKhaltiPayment";
import { Calendar, CheckCircle2, CreditCard, Info, X, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageShell } from "@/components/shared/PageShell";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { GlassCard } from "@/components/shared/GlassCard";
import { Bone } from "@/components/shared/Bone";
import { ParallaxLayer } from "@/components/shared/ParallaxLayer";
import { useRevealOnMount } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";

const SceneCanvas = lazy(() => import("@/components/shared/SceneCanvas"));

type Gateway = "KHALTI" | "ESEWA";

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

export default function MakeRepayment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedParam = searchParams.get("selected");
  const { toast } = useToast();
  const { user } = useAuth();
  const revealRef = useRevealOnMount([]);
  const [gateway, setGateway] = useState<Gateway>("KHALTI");
  const [showGatewayPicker, setShowGatewayPicker] = useState(false);

  const { data: loan, isLoading } = useGetLoanQuery(id || "", { skip: !id });
  const { data: contracts = [] } = useGetContractsQuery();

  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);

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

  const resolvedContract = useMemo(() => {
    if (loan?.contract?.id) return loan.contract;
    if (!loan?.id) return undefined;
    return contracts.find(
      (c) => c.loanId === loan.id || c.loan?.id === loan.id,
    );
  }, [contracts, loan?.contract, loan?.id]);

  const contractId = resolvedContract?.id;
  const { data: schedules = [], isLoading: isLoadingSchedules } =
    useGetPaymentSchedulesByContractQuery(contractId || "", {
      skip: !contractId,
    });

  const payableSchedules = useMemo(
    () =>
      schedules.filter(
        (s) => !isSchedulePaid(s as unknown as Record<string, unknown>),
      ),
    [schedules],
  );

  useEffect(() => {
    const selectedFromQuery = searchParams.get("selected");
    if (selectedFromQuery && selectedScheduleIds.length === 0) {
      const parsedIds = selectedFromQuery
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      if (parsedIds.length > 0) {
        setSelectedScheduleIds(parsedIds);
        return;
      }
    }

    if (payableSchedules.length > 0 && selectedScheduleIds.length === 0) {
      setSelectedScheduleIds([payableSchedules[0].id]);
    }
  }, [payableSchedules, searchParams, selectedScheduleIds.length]);

  const selectedSchedules = useMemo(
    () => payableSchedules.filter((s) => selectedScheduleIds.includes(s.id)),
    [payableSchedules, selectedScheduleIds],
  );

  const selectedAmount = useMemo(
    () =>
      selectedSchedules.reduce(
        (sum, s) =>
          sum + getScheduleDueAmount(s as unknown as Record<string, unknown>),
        0,
      ),
    [selectedSchedules],
  );

  const visibleSchedules = useMemo(() => {
    if (!preselectedParam) return payableSchedules;
    return selectedSchedules.length > 0 ? selectedSchedules : payableSchedules;
  }, [payableSchedules, preselectedParam, selectedSchedules]);

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "NPR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

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

    const paymentAmount = Number(selectedAmount);
    if (!paymentAmount || paymentAmount <= 0) {
      toast({
        title: "Validation Error",
        description: "Select at least one installment to repay.",
        variant: "destructive",
      });
      return;
    }

    setShowGatewayPicker(true);
  };

  const handleGatewayPayment = async () => {
    if (!contractId || !id) return;

    const paymentAmount = Number(selectedAmount);
    if (!paymentAmount || paymentAmount <= 0) {
      toast({
        title: "Validation Error",
        description: "Select at least one installment to repay.",
        variant: "destructive",
      });
      return;
    }

    try {
      const gasPaymentMode =
        blockchainAccess.mode === "USER_WALLET"
          ? "USER_WALLET"
          : "PLATFORM_WALLET";

      const successPath = `/borrower/payment/success?context=repayment&loanId=${encodeURIComponent(id)}&amount=${encodeURIComponent(String(paymentAmount))}`;
      const failurePath = `/borrower/payment/failure?context=repayment&loanId=${encodeURIComponent(id)}&amount=${encodeURIComponent(String(paymentAmount))}`;

      setShowGatewayPicker(false);

      if (gateway === "KHALTI") {
        await payKhalti({
          contractId,
          paymentScheduleId: selectedScheduleIds.join(","),
          amount: paymentAmount,
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
          amount: paymentAmount,
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
      <div className="relative overflow-hidden min-h-[70vh]">
        <Suspense fallback={null}>
          <SceneCanvas
            variant="orb"
            density={22}
            className="opacity-40 h-[260px]"
          />
        </Suspense>
        <PageShell narrow className="relative z-10 space-y-8 pb-16 pt-6">
          <ParallaxLayer speed={0.2} clamp={100}>
            <SectionHeader
              title="Make a Repayment"
              description="Review installments and complete payment securely"
              actions={
                <Button
                  variant="ghost"
                  onClick={() => navigate(`/my-loans/${id}`)}
                  className="rounded-2xl h-11 text-muted-foreground"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Loan Detail
                </Button>
              }
            />
          </ParallaxLayer>

          <Bone
            name="borrower-make-repayment"
            loading={isLoading || isLoadingSchedules}
            minHeight={360}
          >
            {!loan ? null : !resolvedContract ? (
              <GlassCard className="p-8 text-center space-y-3">
                <Info className="w-10 h-10 text-muted-foreground mx-auto" />
                <h2 className="text-base font-bold font-[family-name:var(--font-headline)]">
                  Contract Pending
                </h2>
                <p className="text-sm text-muted-foreground">
                  There is no active contract generated for this loan yet.
                </p>
              </GlassCard>
            ) : (
              <div
                ref={revealRef as React.RefObject<HTMLDivElement>}
                className="space-y-4"
              >
                <GlassCard className="p-4 sm:p-5 space-y-3" data-reveal>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        Loan Purpose
                      </p>
                      <p className="font-bold text-sm mt-1 text-foreground">
                        {loan.purpose || "Loan Repayment"}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Contract: {resolvedContract.contractNumber}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[11px] rounded-lg">
                      {loan.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </GlassCard>

                <GlassCard className="p-4 sm:p-5 space-y-4" data-reveal>
                  <div className="rounded-2xl border border-border bg-muted/20 p-3 flex items-start gap-2">
                    <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-[11px] font-bold text-muted-foreground tracking-wider">
                      Select one or more installments and click Pay Selected.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold font-[family-name:var(--font-headline)]">
                        Repayment Installments
                      </h3>
                      <span className="text-[11px] font-bold text-muted-foreground tracking-wider">
                        {payableSchedules.length} due
                      </span>
                    </div>

                    {payableSchedules.length === 0 ? (
                      <div className="py-8 text-center">
                        <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          All installments are paid.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {visibleSchedules.map((schedule) => {
                          const checked = selectedScheduleIds.includes(
                            schedule.id,
                          );
                          return (
                            <button
                              key={schedule.id}
                              type="button"
                              onClick={() => toggleSchedule(schedule.id)}
                              className={cn(
                                "w-full rounded-2xl border px-3 py-3 text-left transition-all min-h-[56px]",
                                checked
                                  ? "border-primary bg-primary/5"
                                  : "border-border bg-card/80 hover:bg-card",
                              )}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className={cn(
                                      "w-4 h-4 rounded border shrink-0",
                                      checked
                                        ? "bg-primary border-primary"
                                        : "border-border/60",
                                    )}
                                  />
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-foreground">
                                      Installment {schedule.installmentNumber}
                                    </p>
                                    <p className="text-[11px] font-bold text-muted-foreground mt-0.5 inline-flex items-center gap-1 tracking-wider">
                                      <Calendar className="w-3" />
                                      Due{" "}
                                      {new Date(
                                        schedule.dueDate,
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-sm font-semibold text-foreground">
                                    {formatMoney(
                                      getScheduleDueAmount(
                                        schedule as unknown as Record<
                                          string,
                                          unknown
                                        >,
                                      ),
                                    )}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </GlassCard>

                <GlassCard className="p-4 sm:p-5 space-y-3" data-reveal>
                  <h3 className="text-sm font-semibold font-[family-name:var(--font-headline)]">
                    Payment Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl border border-border bg-card/80 p-3">
                      <p className="text-xs text-muted-foreground">
                        Selected installments
                      </p>
                      <p className="text-lg font-bold mt-1 tracking-tight text-foreground">
                        {selectedScheduleIds.length}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-card/80 p-3">
                      <p className="text-xs text-muted-foreground">
                        Total payable
                      </p>
                      <p className="text-lg font-bold mt-1 text-foreground">
                        {formatMoney(selectedAmount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm rounded-2xl border border-border bg-card/80 p-3">
                    <span className="text-muted-foreground">Method</span>
                    <span className="font-bold inline-flex items-center gap-1 tracking-wider text-[11px] text-foreground">
                      <CreditCard className="w-3.5 h-3.5" /> Payment Gateway
                    </span>
                  </div>
                </GlassCard>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={handlePaySelected}
                    disabled={selectedScheduleIds.length === 0 || gatewayBusy}
                    className="h-11 rounded-2xl px-8"
                  >
                    {gatewayBusy ? "Redirecting..." : "Pay Selected"}
                  </Button>
                </div>
              </div>
            )}
          </Bone>
        </PageShell>
      </div>

      <Dialog open={showGatewayPicker} onOpenChange={setShowGatewayPicker}>
        <DialogContent className="sm:max-w-md z-[160] rounded-2xl border-border bg-card">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogTitle className="font-[family-name:var(--font-headline)]">
                  Payment Method
                </DialogTitle>
                <DialogDescription>
                  Select your preferred gateway
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                onClick={() => setShowGatewayPicker(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-24 flex flex-col gap-2 rounded-2xl transition-all",
                  gateway === "KHALTI" && "border-primary bg-primary/5",
                )}
                onClick={() => setGateway("KHALTI")}
              >
                <img src="/images/khalti.png" alt="Khalti" className="h-8" />
                <span className="text-xs">Khalti</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-24 flex flex-col gap-2 rounded-2xl transition-all",
                  gateway === "ESEWA" && "border-primary bg-primary/5",
                )}
                onClick={() => setGateway("ESEWA")}
              >
                <img src="/images/esewa.png" alt="eSewa" className="h-8" />
                <span className="text-xs">eSewa</span>
              </Button>
            </div>

            <div className="rounded-2xl border border-border bg-card/80 p-3 text-sm flex items-center justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold text-foreground">
                {formatMoney(selectedAmount)}
              </span>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="ghost"
                className="rounded-2xl"
                onClick={() => setShowGatewayPicker(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="rounded-2xl"
                onClick={handleGatewayPayment}
                disabled={gatewayBusy}
              >
                {gatewayBusy ? "Processing..." : "Complete Payment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </BorrowerLayout>
  );
}
