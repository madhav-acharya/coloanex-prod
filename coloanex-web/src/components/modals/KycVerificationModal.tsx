import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KycStatus, type KycDocument } from "@/types/kyc";

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

interface KycVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: KycDocument;
  onSubmit: (status: KycStatus, notes?: string) => Promise<void>;
  onClose: () => void;
}

export function KycVerificationModal({
  open,
  onOpenChange,
  document,
  onSubmit,
  onClose,
}: KycVerificationModalProps) {
  const [status, setStatus] = useState<KycStatus>(KycStatus.PENDING);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (document) {
      setStatus(document.status);
      setNotes(document.notes || "");
    }
  }, [document]);

  const handleSubmit = async () => {
    if (status === KycStatus.REJECTED && !notes.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(status, notes);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            KYC Verification -{" "}
            {document.borrower?.user.fullName || "Unknown Borrower"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {document.borrower && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-600">Borrower Name</Label>
                <div className="font-medium">
                  {document.borrower.user.fullName}
                </div>
              </div>
              <div>
                <Label className="text-gray-600">Email</Label>
                <div className="font-medium">{document.borrower.user.email}</div>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Document Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {document.type && (
                <div>
                  <Label className="text-gray-600">Document Type</Label>
                  <div>{document.type}</div>
                </div>
              )}

              {document.documentNumber && (
                <div>
                  <Label className="text-gray-600">Document Number</Label>
                  <div>{document.documentNumber}</div>
                </div>
              )}

              {document.firstName && (
                <div>
                  <Label className="text-gray-600">First Name</Label>
                  <div>{document.firstName}</div>
                </div>
              )}

              {document.lastName && (
                <div>
                  <Label className="text-gray-600">Last Name</Label>
                  <div>{document.lastName}</div>
                </div>
              )}

              {document.fullLegalName && (
                <div>
                  <Label className="text-gray-600">Full Legal Name</Label>
                  <div>{document.fullLegalName}</div>
                </div>
              )}

              {document.dateOfBirth && (
                <div>
                  <Label className="text-gray-600">Date of Birth</Label>
                  <div>{formatDate(document.dateOfBirth)}</div>
                </div>
              )}

              {document.nationalId && (
                <div>
                  <Label className="text-gray-600">National ID</Label>
                  <div>{document.nationalId}</div>
                </div>
              )}

              {document.nationalIdType && (
                <div>
                  <Label className="text-gray-600">National ID Type</Label>
                  <div>{document.nationalIdType}</div>
                </div>
              )}

              {document.addressLine1 && (
                <div>
                  <Label className="text-gray-600">Address Line 1</Label>
                  <div>{document.addressLine1}</div>
                </div>
              )}

              {document.addressLine2 && (
                <div>
                  <Label className="text-gray-600">Address Line 2</Label>
                  <div>{document.addressLine2}</div>
                </div>
              )}

              {document.city && (
                <div>
                  <Label className="text-gray-600">City</Label>
                  <div>{document.city}</div>
                </div>
              )}

              {document.state && (
                <div>
                  <Label className="text-gray-600">State/Province</Label>
                  <div>{document.state}</div>
                </div>
              )}

              {document.postalCode && (
                <div>
                  <Label className="text-gray-600">Postal Code</Label>
                  <div>{document.postalCode}</div>
                </div>
              )}

              {document.country && (
                <div>
                  <Label className="text-gray-600">Country</Label>
                  <div>{document.country}</div>
                </div>
              )}

              {document.issuingAuthority && (
                <div>
                  <Label className="text-gray-600">Issuing Authority</Label>
                  <div>{document.issuingAuthority}</div>
                </div>
              )}

              {document.issueDate && (
                <div>
                  <Label className="text-gray-600">Issue Date</Label>
                  <div>{formatDate(document.issueDate)}</div>
                </div>
              )}

              {document.expiryDate && (
                <div>
                  <Label className="text-gray-600">Expiry Date</Label>
                  <div>{formatDate(document.expiryDate)}</div>
                </div>
              )}

              {document.fileUrl && (
                <div className="col-span-2">
                  <Label className="text-gray-600">Document File</Label>
                  <div>
                    <a
                      href={document.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Document
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <div>
              <Label htmlFor="status">Verification Status*</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as KycStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={KycStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={KycStatus.VERIFIED}>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500">Approved</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value={KycStatus.REJECTED}>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-500">Rejected</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">
                Notes {status === KycStatus.REJECTED && "*"}
              </Label>
              <Textarea
                id="notes"
                placeholder={
                  status === KycStatus.REJECTED
                    ? "Please provide reason for rejection (required)"
                    : "Add notes about this verification (optional)"
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className={
                  status === KycStatus.REJECTED && !notes.trim()
                    ? "border-red-500"
                    : ""
                }
              />
              {status === KycStatus.REJECTED && !notes.trim() && (
                <p className="text-sm text-red-500 mt-1">
                  Notes are required when rejecting a KYC document
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Close
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting || (status === KycStatus.REJECTED && !notes.trim())
            }
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
