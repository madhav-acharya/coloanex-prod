import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoanStatus, type Loan } from "@/types/loan";
import { useGetRulesQuery } from "@/apis/rulesApi";

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatCurrency = (amount?: number) => {
  if (!amount)
    return (
      <span className="flex items-center gap-1">
        <IconCurrencyRupeeNepalese className="inline h-4 w-4" />0
      </span>
    );
  return (
    <span className="flex items-center gap-1">
      <IconCurrencyRupeeNepalese className="inline h-4 w-4" />
      {amount.toLocaleString()}
    </span>
  );
};

interface LoanReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: Loan | null;
  onSubmit: (
    status: LoanStatus,
    rejectionReason?: string,
    approvedAmount?: number,
    ruleId?: string,
    approvedTermMonths?: number,
  ) => Promise<void>;
  hasNext: boolean;
}

export function LoanReviewModal({
  open,
  onOpenChange,
  loan,
  onSubmit,
  hasNext,
}: LoanReviewModalProps) {
  const [status, setStatus] = useState<LoanStatus>(LoanStatus.UNDER_REVIEW);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState("");
  const [approvedTermMonths, setApprovedTermMonths] = useState("");
  const [selectedRuleId, setSelectedRuleId] = useState("");

  const {
    data: rulesData,
    isLoading: isLoadingRules,
    error: rulesError,
  } = useGetRulesQuery();

  useEffect(() => {
    if (loan) {
      setStatus(loan.status);
      setRejectionReason(loan.rejectionReason || "");
      setApprovedAmount(
        loan.approvedAmount?.toString() || loan.requestedAmount.toString(),
      );
      setApprovedTermMonths(
        loan.approvedTermMonths?.toString() ||
          loan.requestedTermMonths.toString(),
      );
      setSelectedRuleId((loan as any).ruleId || "");
    }
  }, [loan]);

  const openLightbox = () => {
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const handleSubmitClick = () => {
    setConfirmDialogOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setConfirmDialogOpen(false);
    onOpenChange(false);
    try {
      const approvedAmountNumber =
        status === LoanStatus.APPROVED && approvedAmount
          ? parseFloat(approvedAmount)
          : undefined;
      const approvedTermNumber =
        status === LoanStatus.APPROVED && approvedTermMonths
          ? parseInt(approvedTermMonths)
          : undefined;
      await onSubmit(
        status,
        rejectionReason,
        approvedAmountNumber,
        selectedRuleId || undefined,
        approvedTermNumber,
      );
      setRejectionReason("");
      setStatus(LoanStatus.UNDER_REVIEW);
      setSelectedRuleId("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: LoanStatus) => {
    switch (status) {
      case LoanStatus.DRAFT:
        return "bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800";
      case LoanStatus.SUBMITTED:
        return "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800";
      case LoanStatus.UNDER_REVIEW:
        return "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800";
      case LoanStatus.APPROVED:
        return "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800";
      case LoanStatus.REJECTED:
        return "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800";
      case LoanStatus.CONTRACT_GENERATED:
        return "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800";
      case LoanStatus.CONTRACT_SIGNED:
        return "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800";
      case LoanStatus.LOAN_PROVIDED:
        return "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800";
      case LoanStatus.PARTIALLY_PAID:
        return "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800";
      case LoanStatus.PAID:
        return "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800";
      default:
        return "bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800";
    }
  };

  if (!loan) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="!bg-background w-full sm:max-w-[100vw] p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-2xl">Loan Verification</SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Verify and approve or reject the loan request
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="max-w-48 mr-20 text-right">
                <Label className="text-xs text-muted-foreground">
                  Loan Status
                </Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as LoanStatus)}
                >
                  <SelectTrigger className="mt-1 cursor-pointer w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={LoanStatus.DRAFT}>Draft</SelectItem>
                    <SelectItem value={LoanStatus.SUBMITTED}>
                      Submitted
                    </SelectItem>
                    <SelectItem value={LoanStatus.UNDER_REVIEW}>
                      Under Review
                    </SelectItem>
                    <SelectItem value={LoanStatus.APPROVED}>
                      Approved
                    </SelectItem>
                    <SelectItem value={LoanStatus.REJECTED}>
                      Rejected
                    </SelectItem>
                    <SelectItem value={LoanStatus.CONTRACT_GENERATED}>
                      Contract Generated
                    </SelectItem>
                    <SelectItem value={LoanStatus.CONTRACT_SIGNED}>
                      Contract Signed
                    </SelectItem>
                    <SelectItem value={LoanStatus.LOAN_PROVIDED}>
                      Loan Provided
                    </SelectItem>
                    <SelectItem value={LoanStatus.PARTIALLY_PAID}>
                      Partially Paid
                    </SelectItem>
                    <SelectItem value={LoanStatus.PAID}>Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </SheetHeader>

        <Separator />

        <ScrollArea className="h-[calc(95vh-220px)] px-6">
          <div className="space-y-6 py-4">
            {/* Borrower Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Borrower Information
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Full Name
                  </Label>
                  <p className="text-sm font-medium mt-1">
                    {loan.borrower?.user?.fullName || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="text-sm font-medium mt-1">
                    {loan.borrower?.user?.email || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Current Status
                  </Label>
                  <Badge className={`mt-1 ${getStatusColor(loan.status)}`}>
                    {loan.status}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Loan Amount Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Loan Amount Details
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Requested Amount
                  </Label>
                  <p className="text-sm font-medium mt-1">
                    {formatCurrency(loan.requestedAmount)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Approved Amount
                  </Label>
                  <p className="text-sm font-medium mt-1">
                    {formatCurrency(loan.approvedAmount)}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Loan Purpose */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Loan Purpose</h3>
              <div>
                <Label className="text-xs text-muted-foreground">Purpose</Label>
                <p className="text-sm font-medium mt-1">
                  {loan.purpose || "N/A"}
                </p>
              </div>
            </div>

            <Separator />

            {/* Collateral Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Collateral Information
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Collateral Type
                  </Label>
                  <p className="text-sm font-medium mt-1">
                    {(loan.collateralDetails as any)?.type || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Collateral Value
                  </Label>
                  <p className="text-sm font-medium mt-1">
                    {formatCurrency((loan.collateralDetails as any)?.value)}
                  </p>
                </div>
                <div className="col-span-3">
                  <Label className="text-xs text-muted-foreground">
                    Collateral Image
                  </Label>
                  {(loan.collateralDetails as any)?.imageUrl ? (
                    <div className="mt-2">
                      <img
                        src={(loan.collateralDetails as any)?.imageUrl}
                        alt="Collateral"
                        className="max-w-full h-auto rounded-lg border max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={openLightbox}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Click to view full size
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm font-medium mt-1">N/A</p>
                  )}
                </div>
              </div>
              {(loan.collateralDetails as any)?.description && (
                <div className="mt-4">
                  <Label className="text-xs text-muted-foreground">
                    Description
                  </Label>
                  <p className="text-sm font-medium mt-1">
                    {(loan.collateralDetails as any)?.description}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Loan Terms */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Loan Terms</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Requested Term (Months)
                  </Label>
                  <p className="text-sm font-medium mt-1">
                    {loan.requestedTermMonths} months
                  </p>
                </div>
              </div>
            </div>

            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-4">Important Dates</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Created At
                  </Label>
                  <p className="text-sm font-medium mt-1">
                    {formatDate(loan.createdAt)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Updated At
                  </Label>
                  <p className="text-sm font-medium mt-1">
                    {formatDate(loan.updatedAt)}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Review Notes */}
            <div>
              <Label htmlFor="rejectionReason">
                {status === LoanStatus.REJECTED
                  ? "Rejection Reason (Required)"
                  : "Verification Notes (Optional)"}
              </Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={
                  status === LoanStatus.REJECTED
                    ? "Please provide a reason for rejection..."
                    : "Add any additional notes about this verification..."
                }
                className="mt-2 min-h-[100px]"
              />
            </div>
          </div>
        </ScrollArea>

        <Separator />

        <SheetFooter className="px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleSubmitClick}
                disabled={
                  isSubmitting ||
                  (status === LoanStatus.REJECTED && !rejectionReason.trim())
                }
                className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
              >
                {isSubmitting
                  ? "Submitting..."
                  : hasNext
                    ? "Verify & Next"
                    : "Submit Verification"}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>

      {/* Image Lightbox */}
      {lightboxOpen && (loan.collateralDetails as any)?.imageUrl && (
        <div
          className="fixed inset-0 z-[150] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <X size={32} />
          </button>

          <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            <img
              src={(loan.collateralDetails as any)?.imageUrl}
              alt="Collateral - Full Size"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Custom Confirmation Dialog */}
      {confirmDialogOpen && (
        <div
          className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            if (!isSubmitting) setConfirmDialogOpen(false);
          }}
        >
          <div
            className="bg-background border border-border rounded-lg shadow-2xl max-w-md w-full mx-4 p-6 relative pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6 pb-4 border-b border-border">
              <div>
                <h3
                  className={`text-xl font-bold ${
                    status === LoanStatus.APPROVED
                      ? "text-primary"
                      : status === LoanStatus.REJECTED
                        ? "text-destructive"
                        : "text-foreground"
                  }`}
                >
                  {status === LoanStatus.APPROVED
                    ? "Approve Loan"
                    : status === LoanStatus.REJECTED
                      ? "Reject Loan"
                      : "Update Loan Status"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {status === LoanStatus.APPROVED
                    ? "Please confirm the loan approval details"
                    : status === LoanStatus.REJECTED
                      ? "Please confirm the loan rejection"
                      : "Please confirm the status change"}
                </p>
              </div>
              <button
                onClick={() => setConfirmDialogOpen(false)}
                disabled={isSubmitting}
                className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 mb-6">
              {/* Borrower Info Section */}
              <div className="bg-card rounded-lg p-4 space-y-3 border border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Loan Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Borrower
                    </Label>
                    <p className="text-sm font-medium mt-1">
                      {loan.borrower?.user?.fullName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Requested Amount
                    </Label>
                    <p className="text-sm font-medium mt-1 text-primary">
                      {formatCurrency(loan.requestedAmount)}
                    </p>
                  </div>
                </div>
              </div>

              {status === LoanStatus.APPROVED && (
                <>
                  {/* Approval Details Section */}
                  <div className="bg-primary/5 rounded-lg p-4 space-y-4 border border-primary/20">
                    <h4 className="text-xs font-semibold text-primary uppercase tracking-wide flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      Approval Details
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <Label
                          htmlFor="approvedAmount"
                          className="text-sm font-medium text-foreground"
                        >
                          Approved Amount{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="approvedAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={approvedAmount}
                          onChange={(e) => setApprovedAmount(e.target.value)}
                          placeholder="Enter approved amount"
                          className="mt-2 bg-background"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="approvedTermMonths"
                          className="text-sm font-medium text-foreground"
                        >
                          Approved Term (Months){" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="approvedTermMonths"
                          type="number"
                          min="1"
                          step="1"
                          value={approvedTermMonths}
                          onChange={(e) =>
                            setApprovedTermMonths(e.target.value)
                          }
                          placeholder="Enter term in months"
                          className="mt-2 bg-background"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="ruleId"
                          className="text-sm font-medium text-foreground"
                        >
                          Select Loan Rule{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={selectedRuleId}
                          onValueChange={setSelectedRuleId}
                          disabled={isSubmitting || isLoadingRules}
                        >
                          <SelectTrigger className="mt-2 bg-background">
                            <SelectValue
                              placeholder={
                                isLoadingRules
                                  ? "Loading rules..."
                                  : "Select a rule"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="z-[200]">
                            {isLoadingRules ? (
                              <SelectItem value="loading" disabled>
                                Loading rules...
                              </SelectItem>
                            ) : rulesError ? (
                              <SelectItem value="error" disabled>
                                Error loading rules
                              </SelectItem>
                            ) : rulesData && rulesData.length > 0 ? (
                              rulesData.map((rule) => (
                                <SelectItem key={rule.id} value={rule.id}>
                                  {rule.name} - {rule.interestRate}% (
                                  {rule.ruleType})
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-rules" disabled>
                                No rules available. Please create rules first.
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-2">
                          {rulesError
                            ? "⚠️ Failed to load rules. Please refresh the page."
                            : rulesData && rulesData.length === 0
                              ? "⚠️ No loan rules found. Please create rules in the Rules page before approving loans."
                              : "💡 The selected rule will be used for contract generation"}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {status === LoanStatus.REJECTED && (
                <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/20">
                  <h4 className="text-xs font-semibold text-destructive uppercase tracking-wide flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 bg-destructive rounded-full"></span>
                    Rejection Details
                  </h4>
                  <div>
                    <Label className="text-sm font-medium text-foreground">
                      Rejection Reason
                    </Label>
                    <p className="text-sm mt-2 bg-background p-3 rounded border border-destructive/20">
                      {rejectionReason || "No reason provided"}
                    </p>
                  </div>
                </div>
              )}

              {status !== LoanStatus.APPROVED &&
                status !== LoanStatus.REJECTED && (
                  <div className="bg-secondary/5 rounded-lg p-4 border border-secondary/20">
                    <h4 className="text-xs font-semibold text-secondary-foreground uppercase tracking-wide flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 bg-secondary-foreground rounded-full"></span>
                      Verification Status Update
                    </h4>
                    <div>
                      <Label className="text-sm font-medium text-foreground">
                        New Status
                      </Label>
                      <p className="text-sm font-medium mt-2">
                        {status.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                )}
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setConfirmDialogOpen(false)}
                disabled={isSubmitting}
                className="min-w-[100px]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSubmit}
                disabled={
                  isSubmitting ||
                  isLoadingRules ||
                  (status === LoanStatus.APPROVED &&
                    (!approvedAmount ||
                      parseFloat(approvedAmount) <= 0 ||
                      !approvedTermMonths ||
                      parseInt(approvedTermMonths) <= 0 ||
                      !selectedRuleId ||
                      !rulesData ||
                      rulesData.length === 0))
                }
                className={`min-w-[120px] text-white ${
                  status === LoanStatus.REJECTED
                    ? "bg-destructive hover:bg-destructive/90"
                    : "bg-primary hover:bg-primary/90"
                }`}
                title={
                  status === LoanStatus.APPROVED &&
                  (!rulesData || rulesData.length === 0)
                    ? "Please create at least one loan rule before approving loans"
                    : undefined
                }
              >
                {isSubmitting
                  ? "Processing..."
                  : status === LoanStatus.APPROVED
                    ? "Approve Loan"
                    : status === LoanStatus.REJECTED
                      ? "Reject Loan"
                      : "Update Status"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}
