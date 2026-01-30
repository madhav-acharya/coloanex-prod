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
import { X, ChevronLeft, ChevronRight } from "lucide-react";

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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string>("");
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const imageFiles =
    document?.files?.filter((f) => f.mimeType?.startsWith("image/")) || [];

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

  const openLightbox = (imageUrl: string, index: number) => {
    setLightboxImage(imageUrl);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    if (lightboxIndex < imageFiles.length - 1) {
      const newIndex = lightboxIndex + 1;
      setLightboxIndex(newIndex);
      setLightboxImage(imageFiles[newIndex].fileUrl);
    }
  };

  const prevImage = () => {
    if (lightboxIndex > 0) {
      const newIndex = lightboxIndex - 1;
      setLightboxIndex(newIndex);
      setLightboxImage(imageFiles[newIndex].fileUrl);
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
                    {document.borrower?.user?.email || "N/A"}
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
              document.grandfatherName) && (
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
                  </div>
                </div>
              </>
            )}

            {document.documentTypes?.includes("CITIZENSHIP") &&
              (() => {
                const citizenshipFile = document.files?.find(
                  (f) =>
                    f.fileType === "CITIZENSHIP_FRONT" ||
                    f.fileType === "CITIZENSHIP_BACK",
                );
                return (
                  citizenshipFile && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-lg font-semibold mb-4">
                          Citizenship Information
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          {citizenshipFile.documentNumber && (
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Citizenship Number
                              </Label>
                              <p className="text-sm font-medium mt-1">
                                {citizenshipFile.documentNumber}
                              </p>
                            </div>
                          )}
                          {citizenshipFile.issueDate && (
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Issue Date
                              </Label>
                              <p className="text-sm font-medium mt-1">
                                {formatDate(citizenshipFile.issueDate)}
                              </p>
                            </div>
                          )}
                          {citizenshipFile.issueDistrict && (
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Issue District
                              </Label>
                              <p className="text-sm font-medium mt-1">
                                {citizenshipFile.issueDistrict}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )
                );
              })()}

            {document.documentTypes?.includes("PASSPORT") &&
              (() => {
                const passportFile = document.files?.find(
                  (f) => f.fileType === "PASSPORT",
                );
                return (
                  passportFile && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-lg font-semibold mb-4">
                          Passport Information
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          {passportFile.documentNumber && (
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Passport Number
                              </Label>
                              <p className="text-sm font-medium mt-1">
                                {passportFile.documentNumber}
                              </p>
                            </div>
                          )}
                          {passportFile.issueDate && (
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Issue Date
                              </Label>
                              <p className="text-sm font-medium mt-1">
                                {formatDate(passportFile.issueDate)}
                              </p>
                            </div>
                          )}
                          {passportFile.expiryDate && (
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Expiry Date
                              </Label>
                              <p className="text-sm font-medium mt-1">
                                {formatDate(passportFile.expiryDate)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )
                );
              })()}

            {document.documentTypes?.includes("PAN") &&
              (() => {
                const panFile = document.files?.find(
                  (f) => f.fileType === "PAN",
                );
                return (
                  panFile?.documentNumber && (
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
                              {panFile.documentNumber}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )
                );
              })()}

            {document.documentTypes?.includes("DRIVING_LICENSE") &&
              (() => {
                const licenseFile = document.files?.find(
                  (f) =>
                    f.fileType === "LICENSE_FRONT" ||
                    f.fileType === "LICENSE_BACK",
                );
                return (
                  licenseFile && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-lg font-semibold mb-4">
                          Driving License Information
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          {licenseFile.documentNumber && (
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                License Number
                              </Label>
                              <p className="text-sm font-medium mt-1">
                                {licenseFile.documentNumber}
                              </p>
                            </div>
                          )}
                          {licenseFile.issueDate && (
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Issue Date
                              </Label>
                              <p className="text-sm font-medium mt-1">
                                {formatDate(licenseFile.issueDate)}
                              </p>
                            </div>
                          )}
                          {licenseFile.expiryDate && (
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Expiry Date
                              </Label>
                              <p className="text-sm font-medium mt-1">
                                {formatDate(licenseFile.expiryDate)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )
                );
              })()}

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
              </div>
            </div>

            {(document.occupation || document.monthlyIncome) && (
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

            {document.files && document.files.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Uploaded Documents & Images
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    {document.files.map((file, index) => {
                      // Check if it's an image by mimeType or file extension
                      const isImage =
                        file.mimeType?.startsWith("image/") ||
                        file.fileUrl?.match(
                          /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i,
                        ) ||
                        file.fileType?.includes("CITIZENSHIP") ||
                        file.fileType?.includes("PASSPORT") ||
                        file.fileType?.includes("LICENSE") ||
                        file.fileType?.includes("SELFIE") ||
                        file.fileType?.includes("PAN");

                      const imageIndex = isImage
                        ? imageFiles.findIndex(
                            (f) => f.fileUrl === file.fileUrl,
                          )
                        : -1;

                      return (
                        <div
                          key={file.id || index}
                          className="border rounded-lg p-3 space-y-2"
                        >
                          <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                            {isImage ? (
                              <img
                                src={file.fileUrl}
                                alt={file.fileType}
                                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity hover:scale-105"
                                onClick={() =>
                                  openLightbox(
                                    file.fileUrl,
                                    imageIndex >= 0 ? imageIndex : index,
                                  )
                                }
                                loading="lazy"
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
                      );
                    })}
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

      {/* Image Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <X size={32} />
          </button>

          {lightboxIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-4 text-white hover:text-gray-300 transition-colors z-10"
            >
              <ChevronLeft size={48} />
            </button>
          )}

          {lightboxIndex < imageFiles.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 text-white hover:text-gray-300 transition-colors z-10"
            >
              <ChevronRight size={48} />
            </button>
          )}

          <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            <img
              src={lightboxImage}
              alt="Full size preview"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
              {lightboxIndex + 1} / {imageFiles.length}
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}
