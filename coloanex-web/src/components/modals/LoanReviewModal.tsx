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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoanStatus, type Loan } from "@/types/loan";

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatCurrency = (amount?: number) => {
  if (!amount) return "NPR 0";
  return `NPR ${amount.toLocaleString()}`;
};

interface LoanReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: Loan | null;
  onSubmit: (
    status: LoanStatus,
    rejectionReason?: string,
    approvedAmount?: number,
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

  useEffect(() => {
    if (loan) {
      setStatus(loan.status);
      setRejectionReason(loan.rejectionReason || "");
      setApprovedAmount(
        loan.approvedAmount?.toString() || loan.requestedAmount.toString(),
      );
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
    try {
      const approvedAmountNumber =
        status === LoanStatus.APPROVED && approvedAmount
          ? parseFloat(approvedAmount)
          : undefined;
      await onSubmit(status, rejectionReason, approvedAmountNumber);
      setRejectionReason("");
      setStatus(LoanStatus.UNDER_REVIEW);
      setConfirmDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: LoanStatus) => {
    switch (status) {
      case LoanStatus.DRAFT:
        return "bg-gray-100 text-gray-800";
      case LoanStatus.SUBMITTED:
        return "bg-blue-100 text-blue-800";
      case LoanStatus.UNDER_REVIEW:
        return "bg-yellow-100 text-yellow-800";
      case LoanStatus.APPROVED:
        return "bg-green-100 text-green-800";
      case LoanStatus.REJECTED:
        return "bg-red-100 text-red-800";
      case LoanStatus.CONTRACT_GENERATED:
        return "bg-purple-100 text-purple-800";
      case LoanStatus.CONTRACT_SIGNED:
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!loan) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="bg-white w-full sm:max-w-[100vw] p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-2xl">Loan Review</SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Review and approve or reject the loan request
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
                        className="max-w-full h-auto rounded-lg border border-gray-200 max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity"
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
                  : "Review Notes (Optional)"}
              </Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={
                  status === LoanStatus.REJECTED
                    ? "Please provide a reason for rejection..."
                    : "Add any additional notes about this review..."
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
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting
                  ? "Submitting..."
                  : hasNext
                    ? "Submit & Next"
                    : "Submit Review"}
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
          className="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            if (!isSubmitting) setConfirmDialogOpen(false);
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 relative pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">
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
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <Label className="text-sm font-medium">Borrower</Label>
                <p className="text-sm mt-1">
                  {loan.borrower?.user?.fullName || "N/A"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Requested Amount</Label>
                <p className="text-sm mt-1">
                  {formatCurrency(loan.requestedAmount)}
                </p>
              </div>

              {status === LoanStatus.APPROVED && (
                <div>
                  <Label
                    htmlFor="approvedAmount"
                    className="text-sm font-medium"
                  >
                    Approved Amount <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="approvedAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                    placeholder="Enter approved amount"
                    className="mt-1"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {status === LoanStatus.REJECTED && (
                <div>
                  <Label className="text-sm font-medium">
                    Rejection Reason
                  </Label>
                  <p className="text-sm mt-1 bg-red-50 p-2 rounded border border-red-200">
                    {rejectionReason || "No reason provided"}
                  </p>
                </div>
              )}

              {status !== LoanStatus.APPROVED &&
                status !== LoanStatus.REJECTED && (
                  <div>
                    <Label className="text-sm font-medium">New Status</Label>
                    <p className="text-sm mt-1">{status.replace(/_/g, " ")}</p>
                  </div>
                )}
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setConfirmDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSubmit}
                disabled={
                  isSubmitting ||
                  (status === LoanStatus.APPROVED &&
                    (!approvedAmount || parseFloat(approvedAmount) <= 0))
                }
                className={
                  status === LoanStatus.REJECTED
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
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
