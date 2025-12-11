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
import { KycStatus, type Kyc } from "@/types/kyc";

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

interface KycVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Kyc | null;
  onSubmit: (status: KycStatus, notes?: string) => Promise<void>;
  hasNext: boolean;
}

export function KycVerificationModal({
  open,
  onOpenChange,
  document,
  onSubmit,
  hasNext,
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
    setIsSubmitting(true);
    try {
      await onSubmit(status, notes);
      setNotes("");
      setStatus(KycStatus.PENDING);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!document) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="bg-white w-full sm:max-w-[100vw] p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-2xl">KYC Verification</SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Review and verify the KYC details below
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="max-w-48 mr-20 text-right">
                <Label className="text-xs text-muted-foreground">
                  KYC Status
                </Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as KycStatus)}
                >
                  <SelectTrigger className="mt-1 cursor-pointer w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={KycStatus.PENDING}>Pending</SelectItem>
                    <SelectItem value={KycStatus.VERIFIED}>Verified</SelectItem>
                    <SelectItem value={KycStatus.REJECTED}>Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </SheetHeader>

        <Separator />

        <ScrollArea className="h-[calc(95vh-220px)] px-6">
          <div className="space-y-6 py-4">
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
                    {document.borrower?.user?.fullName || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="text-sm font-medium mt-1">
                    {document.borrower?.user?.email || document.email || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Document Types
                  </Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {document.documentTypes?.map((type) => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">
                Personal Information
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    First Name
                  </Label>
                  <p className="text-sm font-medium mt-1">
                    {document.firstName || "N/A"}
                  </p>
                </div>
                {document.middleName && (
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Middle Name
                    </Label>
                    <p className="text-sm font-medium mt-1">
                      {document.middleName}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Last Name
                  </Label>
                  <p className="text-sm font-medium mt-1">
                    {document.lastName || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Date of Birth
                  </Label>
                  <p className="text-sm font-medium mt-1">
                    {formatDate(document.dateOfBirth)}
                  </p>
                </div>
                {document.gender && (
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Gender
                    </Label>
                    <p className="text-sm font-medium mt-1">
                      {document.gender}
                    </p>
                  </div>
                )}
                {document.maritalStatus && (
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Marital Status
                    </Label>
                    <p className="text-sm font-medium mt-1">
                      {document.maritalStatus}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {(document.fatherName ||
              document.motherName ||
              document.grandfatherName ||
              document.spouseName) && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Family Information
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {document.fatherName && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Father's Name
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {document.fatherName}
                        </p>
                      </div>
                    )}
                    {document.motherName && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Mother's Name
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {document.motherName}
                        </p>
                      </div>
                    )}
                    {document.grandfatherName && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Grandfather's Name
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {document.grandfatherName}
                        </p>
                      </div>
                    )}
                    {document.spouseName && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Spouse's Name
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {document.spouseName}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {document.documentTypes?.includes("CITIZENSHIP") && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Citizenship Information
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {document.citizenshipNumber && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Citizenship Number
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {document.citizenshipNumber}
                        </p>
                      </div>
                    )}
                    {document.citizenshipIssueDate && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Issue Date
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {formatDate(document.citizenshipIssueDate)}
                        </p>
                      </div>
                    )}
                    {document.citizenshipDistrict && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Issue District
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {document.citizenshipDistrict}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {document.documentTypes?.includes("PASSPORT") && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Passport Information
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {document.passportNumber && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Passport Number
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {document.passportNumber}
                        </p>
                      </div>
                    )}
                    {document.passportIssueDate && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Issue Date
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {formatDate(document.passportIssueDate)}
                        </p>
                      </div>
                    )}
                    {document.passportExpiryDate && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Expiry Date
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {formatDate(document.passportExpiryDate)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {document.documentTypes?.includes("PAN") && document.panNumber && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    PAN Information
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        PAN Number
                      </Label>
                      <p className="text-sm font-medium mt-1">
                        {document.panNumber}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {document.documentTypes?.includes("DRIVING_LICENSE") && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Driving License Information
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {document.licenseNumber && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          License Number
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {document.licenseNumber}
                        </p>
                      </div>
                    )}
                    {document.licenseIssueDate && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Issue Date
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {formatDate(document.licenseIssueDate)}
                        </p>
                      </div>
                    )}
                    {document.licenseExpiryDate && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Expiry Date
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {formatDate(document.licenseExpiryDate)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">
                Address Information
              </h3>
              <div className="space-y-4">
                {(document.permanentProvince ||
                  document.permanentDistrict ||
                  document.permanentMunicipality) && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Permanent Address
                    </Label>
                    <div className="grid grid-cols-3 gap-4">
                      {document.permanentProvince && (
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Province
                          </Label>
                          <p className="text-sm font-medium mt-1">
                            {document.permanentProvince}
                          </p>
                        </div>
                      )}
                      {document.permanentDistrict && (
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            District
                          </Label>
                          <p className="text-sm font-medium mt-1">
                            {document.permanentDistrict}
                          </p>
                        </div>
                      )}
                      {document.permanentMunicipality && (
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Municipality
                          </Label>
                          <p className="text-sm font-medium mt-1">
                            {document.permanentMunicipality}
                          </p>
                        </div>
                      )}
                      {document.permanentWard && (
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Ward
                          </Label>
                          <p className="text-sm font-medium mt-1">
                            {document.permanentWard}
                          </p>
                        </div>
                      )}
                      {document.permanentTole && (
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Tole
                          </Label>
                          <p className="text-sm font-medium mt-1">
                            {document.permanentTole}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {(document.temporaryProvince ||
                  document.temporaryDistrict ||
                  document.temporaryMunicipality) && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Temporary Address
                    </Label>
                    <div className="grid grid-cols-3 gap-4">
                      {document.temporaryProvince && (
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Province
                          </Label>
                          <p className="text-sm font-medium mt-1">
                            {document.temporaryProvince}
                          </p>
                        </div>
                      )}
                      {document.temporaryDistrict && (
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            District
                          </Label>
                          <p className="text-sm font-medium mt-1">
                            {document.temporaryDistrict}
                          </p>
                        </div>
                      )}
                      {document.temporaryMunicipality && (
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Municipality
                          </Label>
                          <p className="text-sm font-medium mt-1">
                            {document.temporaryMunicipality}
                          </p>
                        </div>
                      )}
                      {document.temporaryWard && (
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Ward
                          </Label>
                          <p className="text-sm font-medium mt-1">
                            {document.temporaryWard}
                          </p>
                        </div>
                      )}
                      {document.temporaryTole && (
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Tole
                          </Label>
                          <p className="text-sm font-medium mt-1">
                            {document.temporaryTole}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {(document.phoneNumber || document.alternatePhone) && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {document.phoneNumber && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Phone Number
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {document.phoneNumber}
                        </p>
                      </div>
                    )}
                    {document.alternatePhone && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Alternate Phone
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {document.alternatePhone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {(document.occupation ||
              document.employerName ||
              document.monthlyIncome) && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Employment Information
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {document.occupation && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Occupation
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {document.occupation}
                        </p>
                      </div>
                    )}
                    {document.employerName && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Employer Name
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {document.employerName}
                        </p>
                      </div>
                    )}
                    {document.monthlyIncome && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Monthly Income
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          NPR {document.monthlyIncome.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {(document.bankName ||
              document.bankAccountNumber ||
              document.bankBranch) && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Bank Information
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {document.bankName && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Bank Name
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {document.bankName}
                        </p>
                      </div>
                    )}
                    {document.bankAccountNumber && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Account Number
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {document.bankAccountNumber}
                        </p>
                      </div>
                    )}
                    {document.bankBranch && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Branch
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {document.bankBranch}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {(document.loanAmount ||
              document.loanPurpose ||
              document.loanDuration) && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Loan Information
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {document.loanAmount && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Loan Amount
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          NPR {document.loanAmount.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {document.loanPurpose && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Loan Purpose
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {document.loanPurpose}
                        </p>
                      </div>
                    )}
                    {document.loanDuration && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Loan Duration
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {document.loanDuration} months
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {(document.collateralType ||
              document.collateralDescription ||
              document.collateralValue) && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Collateral Information
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {document.collateralType && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Collateral Type
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {document.collateralType}
                        </p>
                      </div>
                    )}
                    {document.collateralValue && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Estimated Value
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          NPR {document.collateralValue.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {document.collateralDescription && (
                      <div className="col-span-3">
                        <Label className="text-xs text-muted-foreground">
                          Description
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {document.collateralDescription}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {document.files && document.files.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Uploaded Documents & Images
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    {document.files.map((file, index) => (
                      <div
                        key={file.id || index}
                        className="border rounded-lg p-3 space-y-2"
                      >
                        <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                          {file.mimeType?.startsWith("image/") ? (
                            <img
                              src={file.fileUrl}
                              alt={file.fileType}
                              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() =>
                                window.open(file.fileUrl, "_blank")
                              }
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <a
                                href={file.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm text-center px-2"
                              >
                                View Document
                              </a>
                            </div>
                          )}
                        </div>
                        <div>
                          <Badge variant="outline" className="text-xs">
                            {file.fileType}
                          </Badge>
                          {file.fileName && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {file.fileName}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Verification Notes</h3>
              <div className="space-y-2">
                <Textarea
                  placeholder="Add notes about this verification..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full"
                />
                {document.notes && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <Label className="text-xs text-muted-foreground">
                      Previous Notes
                    </Label>
                    <p className="text-sm mt-1">{document.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <Separator />

        <SheetFooter className="px-6 py-4">
          <div className="flex items-center justify-end w-full gap-10">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="hero"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : hasNext
                ? "Save & Next"
                : "Save & Finish"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
