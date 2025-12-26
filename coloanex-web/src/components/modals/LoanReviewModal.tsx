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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  onSubmit: (status: LoanStatus, rejectionReason?: string) => Promise<void>;
  hasNext: boolean;
}

export function LoanReviewModal({
  open,
  onOpenChange,
  loan,
  onSubmit,
  hasNext,
}: LoanReviewModalProps) {
  const [status, setStatus] = useState<LoanStatus>(LoanStatus.PENDING_REVIEW);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (loan) {
      setStatus(loan.status);
      setRejectionReason(loan.rejectionReason || "");
    }
  }, [loan]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(status, rejectionReason);
      setRejectionReason("");
      setStatus(LoanStatus.PENDING_REVIEW);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: LoanStatus) => {
    switch (status) {
      case LoanStatus.APPROVED:
        return "bg-green-100 text-green-800";
      case LoanStatus.REJECTED:
        return "bg-red-100 text-red-800";
      case LoanStatus.DISBURSED:
        return "bg-blue-100 text-blue-800";
      case LoanStatus.DRAFT:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
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
                    <SelectItem value={LoanStatus.PENDING_REVIEW}>
                      Pending Review
                    </SelectItem>
                    <SelectItem value={LoanStatus.APPROVED}>
                      Approved
                    </SelectItem>
                    <SelectItem value={LoanStatus.REJECTED}>
                      Rejected
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
                    Provided Loan Amount
                  </Label>
                  <p className="text-sm font-medium mt-1">
                    {formatCurrency(loan.providedLoanAmount)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Expected Loan Amount
                  </Label>
                  <p className="text-sm font-medium mt-1">
                    {formatCurrency(loan.expectedLoanAmount)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Final Amount
                  </Label>
                  <p className="text-sm font-medium mt-1">
                    {formatCurrency(loan.amount)}
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
                  {loan.loanPurpose || "N/A"}
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
                    {loan.collateralType || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Collateral Value
                  </Label>
                  <p className="text-sm font-medium mt-1">
                    {formatCurrency(loan.collateralValue)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Collateral Image
                  </Label>
                  {loan.collateralImageUrl ? (
                    <a
                      href={loan.collateralImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline mt-1 block"
                    >
                      View Image
                    </a>
                  ) : (
                    <p className="text-sm font-medium mt-1">N/A</p>
                  )}
                </div>
              </div>
              {loan.collateralDescription && (
                <div className="mt-4">
                  <Label className="text-xs text-muted-foreground">
                    Description
                  </Label>
                  <p className="text-sm font-medium mt-1">
                    {loan.collateralDescription}
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
                    Interest Rate
                  </Label>
                  <p className="text-sm font-medium mt-1">
                    {loan.interestRate}%
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Term (Months)
                  </Label>
                  <p className="text-sm font-medium mt-1">
                    {loan.termMonths} months
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Due Date
                  </Label>
                  <p className="text-sm font-medium mt-1">
                    {formatDate(loan.dueDate)}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Transaction Hash */}
            {loan.txHash && (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Transaction Details
                  </h3>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Transaction Hash
                    </Label>
                    <p className="text-sm font-medium mt-1 break-all">
                      {loan.txHash}
                    </p>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Dates */}
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
                {loan.disbursedAt && (
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Disbursed At
                    </Label>
                    <p className="text-sm font-medium mt-1">
                      {formatDate(loan.disbursedAt)}
                    </p>
                  </div>
                )}
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
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  (status === LoanStatus.REJECTED && !rejectionReason.trim())
                }
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
    </Sheet>
  );
}
