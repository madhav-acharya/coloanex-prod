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
import { useCreateTransactionMutation } from "@/apis/transactionsApi";
import { useGetContractsQuery } from "@/apis/contractsApi";
import { useGetTenantQuery } from "@/apis/tenantsApi";
import { BlockchainProcessingModal } from "@/components/ui/blockchain-processing-modal";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useGetMyWalletsQuery } from "@/apis/walletsApi";
import { useListMySubscriptionsQuery } from "@/apis/subscriptionsApi";
import { getBlockchainAccessSnapshot } from "@/utils/blockchainAccess";
import { recordPaymentOnBlockchain } from "@/utils/blockchain";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  CreditCard,
  Info,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

  const { data: loan, isLoading } = useGetLoanQuery(id || "", { skip: !id });
  const { data: tenantData } = useGetTenantQuery(
    (loan as any)?.tenantId || "",
    {
      skip: !(loan as any)?.tenantId,
    },
  );
  const [createTransaction] = useCreateTransactionMutation();
  const { data: contracts = [] } = useGetContractsQuery();

  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);
  const [step, setStep] = useState(1);
  const [blockchainStep, setBlockchainStep] = useState<
    "blockchain" | "database" | "complete"
  >("blockchain");
  const [isProcessingBlockchain, setIsProcessingBlockchain] = useState(false);

  const { data: wallets = [] } = useGetMyWalletsQuery();
  const { data: mySubscriptions = [] } = useListMySubscriptionsQuery();
  const blockchainAccess = useMemo(
    () =>
      getBlockchainAccessSnapshot({
        gasPaymentMode: (user as any)?.gasPaymentMode,
        wallets,
        subscriptions: mySubscriptions,
      }),
    [user, wallets, mySubscriptions],
  );

  const shouldUseWalletSignature =
    blockchainAccess.canRunBlockchain &&
    blockchainAccess.mode === "USER_WALLET";
  const shouldShowBlockchainProcessing = blockchainAccess.canRunBlockchain;
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
      schedules.filter((s) => !isSchedulePaid(s as Record<string, unknown>)),
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
        (sum, s) => sum + getScheduleDueAmount(s as Record<string, unknown>),
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

  const receiverUserId =
    (loan as any)?.tenant?.ownerId ||
    (tenantData as any)?.ownerId ||
    (resolvedContract as any)?.tenant?.ownerId;

  const toggleSchedule = (scheduleId: string) => {
    setSelectedScheduleIds((prev) =>
      prev.includes(scheduleId)
        ? prev.filter((id) => id !== scheduleId)
        : [...prev, scheduleId],
    );
  };

  const goNext = () => {
    if (step === 1 && selectedScheduleIds.length === 0) {
      toast({
        title: "Select installments",
        description: "Choose at least one installment to continue.",
        variant: "destructive",
      });
      return;
    }
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const goBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    if (!user?.id || !receiverUserId) {
      toast({
        title: "Error",
        description: "Could not identify sender or receiver.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (shouldShowBlockchainProcessing) {
        setIsProcessingBlockchain(true);
        setBlockchainStep("blockchain");
      }

      let blockchainTxHash: string | undefined;
      const paymentId = crypto.randomUUID();

      if (shouldUseWalletSignature) {
        try {
          blockchainTxHash = await recordPaymentOnBlockchain(
            paymentId,
            contractId,
            paymentAmount * 100, // scaled paisa
            "WALLET",
            "blockchain",
          );
        } catch (blockchainError: any) {
          setIsProcessingBlockchain(false);
          toast({
            title: "Blockchain Error",
            description: blockchainError.message || blockchainError.code,
            variant: "destructive",
          });
          return;
        }
      }

      if (shouldShowBlockchainProcessing) {
        setBlockchainStep("database");
      }

      await createTransaction({
        contractId: contractId,
        sentBy: user.id,
        receivedBy: receiverUserId,
        type: "INSTALLMENT_PAYMENT",
        amount: paymentAmount,
        paymentDetails: {
          gateway: "WALLET",
          transactionId: blockchainTxHash || paymentId,
          remarks: `Repayment for installments: ${selectedScheduleIds.join(",")}`,
        },
      }).unwrap();

      if (shouldShowBlockchainProcessing) {
        setBlockchainStep("complete");
        setTimeout(() => {
          setIsProcessingBlockchain(false);
          toast({ title: "Success", description: "Repayment successful!" });
          navigate(`/borrower/my-loans/${id}`);
        }, 1000);
      } else {
        toast({ title: "Success", description: "Repayment successful!" });
        navigate(`/borrower/my-loans/${id}`);
      }
    } catch (err: any) {
      setIsProcessingBlockchain(false);
      toast({
        title: "Error",
        description: err?.data?.message || "Failed to process repayment.",
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
              <form onSubmit={handleSubmit} className="space-y-4">
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

                    <div className="flex justify-center gap-2 pt-1">
                      {[1, 2, 3].map((s) => (
                        <div
                          key={s}
                          className={`h-2 rounded-full transition-all ${
                            step === s ? "w-8 bg-primary" : "w-2 bg-primary/25"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-center text-xs text-muted-foreground">
                      Step {step} of 3
                    </p>
                  </CardContent>
                </Card>

                {step === 1 && (
                  <Card className="border-border/20 bg-card">
                    <CardContent className="p-4 space-y-3">
                      <div className="rounded-xl border border-border/20 bg-muted/10 p-3 flex items-start gap-2">
                        <Info className="w-4 h-4 text-primary mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                          Select one or more installments to repay.
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
                                          Installment{" "}
                                          {schedule.installmentNumber}
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
                                            schedule as Record<string, unknown>,
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
                )}

                {step === 2 && (
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

                      <div className="space-y-2">
                        {selectedSchedules.map((schedule) => (
                          <div
                            key={schedule.id}
                            className="rounded-lg border border-border/20 bg-muted/10 px-3 py-2 flex items-center justify-between"
                          >
                            <p className="text-xs text-muted-foreground">
                              Installment {schedule.installmentNumber}
                            </p>
                            <p className="text-sm font-semibold">
                              {formatMoney(
                                getScheduleDueAmount(
                                  schedule as Record<string, unknown>,
                                ),
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {step === 3 && (
                  <Card className="border-border/20 bg-card">
                    <CardContent className="p-4 space-y-3">
                      <h3 className="text-sm font-semibold">Confirm Payment</h3>
                      <div className="rounded-xl border border-border/20 bg-muted/10 p-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Installments
                          </span>
                          <span className="font-semibold">
                            {selectedScheduleIds.length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Total amount
                          </span>
                          <span className="font-semibold">
                            {formatMoney(selectedAmount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Method</span>
                          <span className="font-semibold inline-flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5" /> Wallet
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goBack}
                    disabled={step === 1}
                  >
                    Back
                  </Button>
                  {step < 3 ? (
                    <Button type="button" onClick={goNext}>
                      Next <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={
                        selectedScheduleIds.length === 0 ||
                        isProcessingBlockchain
                      }
                      className="h-10"
                    >
                      {isProcessingBlockchain
                        ? "Processing..."
                        : "Confirm Payment"}
                    </Button>
                  )}
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BlockchainProcessingModal
        open={isProcessingBlockchain}
        currentStep={blockchainStep}
        message="Processing Repayment"
      />
    </BorrowerLayout>
  );
}
