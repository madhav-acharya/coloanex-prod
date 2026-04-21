import { useEffect, useMemo, useState } from "react";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Link,
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
import { Calendar, CheckCircle2, CreditCard, Info, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) navigate(`/borrower/my-loans/${id}`);
        }}
      >
        <DialogContent className="sm:max-w-2xl p-0 max-h-[calc(100dvh-8.5rem)] sm:max-h-[90vh] overflow-y-auto mb-20 sm:mb-0">
          <DialogHeader>
            <div className="px-4 sm:px-6 pt-5">
              <DialogTitle>Make a Repayment</DialogTitle>
              <DialogDescription>
                Process a repayment transaction for your active loan securely.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="px-4 sm:px-6 pb-24 sm:pb-5 space-y-4">
            <Link
              to={`/borrower/my-loans/${id}`}
              className="text-xs text-primary hover:underline block"
            >
              &larr; Back to Loan Detail
            </Link>

            {isLoading || !loan ? (
              <Card className="border-border/20 bg-card">
                <CardContent className="p-8 text-center">
                  <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Loading repayment details...
                  </p>
                </CardContent>
              </Card>
            ) : !resolvedContract ? (
              <Card className="border-red-500/20 bg-card">
                <CardContent className="p-6 text-center">
                  <Info className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                  <h2 className="text-base font-bold mb-1">Contract Pending</h2>
                  <p className="text-sm text-muted-foreground">
                    There is no active contract generated for this loan yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card className="border-border/20 bg-card">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] text-muted-foreground">
                          Loan Purpose
                        </p>
                        <p className="font-semibold text-sm mt-1">
                          {loan.purpose || "Loan Repayment"}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Contract: {resolvedContract.contractNumber}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {loan.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/20 bg-card">
                  <CardContent className="p-4 space-y-3">
                    <div className="rounded-xl border border-border/20 bg-muted/10 p-3 flex items-start gap-2">
                      <Info className="w-4 h-4 text-primary mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        Select one or more installments and click Pay Selected.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">
                          Repayment Installments
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {payableSchedules.length} due
                        </span>
                      </div>

                      {isLoadingSchedules ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                          Loading schedules...
                        </div>
                      ) : payableSchedules.length === 0 ? (
                        <div className="py-8 text-center">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
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
                                className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                                  checked
                                    ? "border-primary bg-primary/5"
                                    : "border-border/20 bg-muted/5 hover:bg-muted/10"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div
                                      className={`w-4 h-4 rounded border ${checked ? "bg-primary border-primary" : "border-border/60"}`}
                                    />
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-foreground">
                                        Installment {schedule.installmentNumber}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
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
                  </CardContent>
                </Card>

                <Card className="border-border/20 bg-card">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="text-sm font-semibold">Payment Summary</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-border/20 bg-muted/10 p-3">
                        <p className="text-xs text-muted-foreground">
                          Selected installments
                        </p>
                        <p className="text-lg font-bold mt-1">
                          {selectedScheduleIds.length}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border/20 bg-muted/10 p-3">
                        <p className="text-xs text-muted-foreground">
                          Total payable
                        </p>
                        <p className="text-lg font-bold mt-1">
                          {formatMoney(selectedAmount)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm rounded-xl border border-border/20 bg-muted/10 p-3">
                      <span className="text-muted-foreground">Method</span>
                      <span className="font-semibold inline-flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5" /> Payment Gateway
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handlePaySelected}
                    disabled={selectedScheduleIds.length === 0 || gatewayBusy}
                    className="h-10"
                  >
                    {gatewayBusy ? "Redirecting..." : "Pay Selected"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showGatewayPicker} onOpenChange={setShowGatewayPicker}>
        <DialogContent className="sm:max-w-md z-[160]">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogTitle>Payment Method</DialogTitle>
                <DialogDescription>
                  Select your preferred gateway
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
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
                className={`h-24 flex flex-col gap-2 transition-all ${gateway === "KHALTI" ? "border-primary bg-primary/5" : ""}`}
                onClick={() => setGateway("KHALTI")}
              >
                <img src="/images/khalti.png" alt="Khalti" className="h-8" />
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
              <span className="font-semibold">
                {formatMoney(selectedAmount)}
              </span>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowGatewayPicker(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
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
