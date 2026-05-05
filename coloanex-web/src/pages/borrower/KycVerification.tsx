import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useGetTenantsQuery } from "@/apis/tenantsApi";
import { useCreateKycMutation } from "@/apis/kycApi";
import { useUploadSingleMutation } from "@/apis/uploadApi";
import { KycFileType } from "@/types/kyc";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  FileBadge,
  FileScan,
  Home,
  Upload,
  UserCircle2,
} from "lucide-react";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const GENDER_OPTIONS = ["Male", "Female", "Other"];
const MARITAL_STATUS_OPTIONS = ["Single", "Married", "Divorced", "Widowed"];
const DOCUMENT_TYPE_OPTIONS = [
  {
    label: "Citizenship",
    value: "CITIZENSHIP",
    numberLabel: "Citizenship Number",
  },
  { label: "Passport", value: "PASSPORT", numberLabel: "Passport Number" },
  {
    label: "Driving License",
    value: "DRIVING_LICENSE",
    numberLabel: "License Number",
  },
  { label: "PAN", value: "PAN", numberLabel: "PAN Number" },
] as const;

type DocumentType = (typeof DOCUMENT_TYPE_OPTIONS)[number]["value"];

type DocumentInfo = {
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  issueDistrict: string;
  frontImage: string;
  backImage: string;
};

export function KycVerificationModal({
  open,
  onOpenChange,
  defaultTenantId = "",
  isLockedTenant = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTenantId?: string;
  isLockedTenant?: boolean;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const stepMeta = [
    { id: 1, label: "Identity", icon: UserCircle2 },
    { id: 2, label: "Address", icon: Home },
    { id: 3, label: "Income", icon: IconCurrencyRupeeNepalese },
    { id: 4, label: "Document", icon: FileBadge },
    { id: 5, label: "Upload", icon: FileScan },
  ];
  const stepProgress = Math.round((step / stepMeta.length) * 100);
  const inputClass =
    "h-11 bg-background/60 border-border/40 focus-visible:ring-primary/30";
  const selectClass = "h-11 bg-background/60 border-border/40";
  const [createKyc, { isLoading: isCreating }] = useCreateKycMutation();
  const [uploadSingle, { isLoading: isUploading }] = useUploadSingleMutation();

  const { data: tenantsData } = useGetTenantsQuery({
    page: 1,
    limit: 100,
    isActive: "true",
  });

  const tenants = tenantsData?.data || [];

  const [form, setForm] = useState({
    tenantId: defaultTenantId,
    firstName: user?.fullName?.split(" ")[0] || "",
    middleName: "",
    lastName: user?.fullName?.split(" ").slice(1).join(" ") || "",
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    fatherName: "",
    motherName: "",
    grandfatherName: "",
    province: "",
    district: "",
    municipality: "",
    ward: "",
    tole: "",
    occupation: "",
    monthlyIncome: "",
    bankName: "",
    bankAccountNumber: "",
    bankBranch: "",
  });

  const [passportPhoto, setPassportPhoto] = useState("");
  const [selfie, setSelfie] = useState("");
  const [selectedDocumentTypes, setSelectedDocumentTypes] = useState<
    DocumentType[]
  >([]);
  const [activeDocumentType, setActiveDocumentType] = useState<
    DocumentType | ""
  >("");
  const [documentDetails, setDocumentDetails] = useState<
    Record<string, DocumentInfo>
  >({});

  const isSubmitting = isCreating || isUploading;

  const getDocumentDetail = (docType: DocumentType): DocumentInfo =>
    documentDetails[docType] || {
      documentNumber: "",
      issueDate: "",
      expiryDate: "",
      issueDistrict: "",
      frontImage: "",
      backImage: "",
    };

  const updateDocumentDetail = (
    docType: DocumentType,
    key: keyof DocumentInfo,
    value: string,
  ) => {
    setDocumentDetails((prev) => ({
      ...prev,
      [docType]: {
        ...getDocumentDetail(docType),
        [key]: value,
      },
    }));
  };

  const canSubmit = useMemo(() => {
    const hasTenant = isLockedTenant
      ? Boolean(defaultTenantId)
      : Boolean(form.tenantId);
    return (
      hasTenant &&
      Boolean(form.firstName.trim()) &&
      Boolean(form.lastName.trim()) &&
      Boolean(form.dateOfBirth) &&
      Boolean(form.province.trim()) &&
      Boolean(form.district.trim()) &&
      Boolean(form.municipality.trim()) &&
      Boolean(form.ward.trim()) &&
      Boolean(form.occupation.trim()) &&
      Boolean(form.monthlyIncome) &&
      Boolean(selectedDocumentTypes.length) &&
      Boolean(passportPhoto) &&
      Boolean(selfie) &&
      selectedDocumentTypes.every((docType) => {
        const detail = getDocumentDetail(docType);
        return (
          Boolean(detail.documentNumber.trim()) &&
          Boolean(detail.frontImage) &&
          (docType === "PAN" || Boolean(detail.backImage))
        );
      })
    );
  }, [
    defaultTenantId,
    form,
    getDocumentDetail,
    isLockedTenant,
    passportPhoto,
    selectedDocumentTypes,
    selfie,
  ]);

  const uploadDoc = async (file: File) => {
    const data = new FormData();
    data.append("file", file);
    data.append("category", "kyc");
    const uploaded = await uploadSingle(data).unwrap();
    return uploaded.url;
  };

  const uploadImage = async (
    file: File | null,
    target: "passportPhoto" | "selfie" | "frontImage" | "backImage",
    docType?: DocumentType,
  ) => {
    if (!file) return;
    try {
      const url = await uploadDoc(file);
      if (target === "passportPhoto") setPassportPhoto(url);
      if (target === "selfie") setSelfie(url);
      if (docType && (target === "frontImage" || target === "backImage")) {
        updateDocumentDetail(docType, target, url);
      }
      toast({ title: "Uploaded", description: "Image uploaded successfully." });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error?.data?.message || "Unable to upload image.",
        variant: "destructive",
      });
    }
  };

  const stepValid = (currentStep: number) => {
    if (currentStep === 1) {
      return (
        (isLockedTenant ? Boolean(defaultTenantId) : Boolean(form.tenantId)) &&
        Boolean(form.firstName.trim()) &&
        Boolean(form.lastName.trim()) &&
        Boolean(form.dateOfBirth)
      );
    }
    if (currentStep === 2) {
      return (
        Boolean(form.province.trim()) &&
        Boolean(form.district.trim()) &&
        Boolean(form.municipality.trim()) &&
        Boolean(form.ward.trim())
      );
    }
    if (currentStep === 3) {
      return Boolean(form.occupation.trim()) && Boolean(form.monthlyIncome);
    }
    if (currentStep === 4) {
      return (
        Boolean(selectedDocumentTypes.length) && Boolean(activeDocumentType)
      );
    }
    return canSubmit;
  };

  const handleToggleDocType = (docType: DocumentType) => {
    setSelectedDocumentTypes((prev) => {
      if (prev.includes(docType)) {
        const next = prev.filter((d) => d !== docType);
        if (activeDocumentType === docType) {
          setActiveDocumentType(next[0] || "");
        }
        return next;
      }
      const next = [...prev, docType];
      if (!activeDocumentType) setActiveDocumentType(docType);
      return next;
    });
  };

  const activeDocDetail = activeDocumentType
    ? getDocumentDetail(activeDocumentType)
    : null;

  const activeDocMeta = DOCUMENT_TYPE_OPTIONS.find(
    (opt) => opt.value === activeDocumentType,
  );

  const nextStep = () => {
    if (!stepValid(step)) {
      toast({
        title: "Missing fields",
        description: "Please complete required fields before continuing.",
        variant: "destructive",
      });
      return;
    }
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      const fullName = [form.firstName, form.middleName, form.lastName]
        .filter(Boolean)
        .join(" ");

      const files = [
        {
          fileType: KycFileType.SELFIE,
          fileUrl: selfie,
          documentMetadata: {},
        },
        ...selectedDocumentTypes.flatMap((docType) => {
          const detail = getDocumentDetail(docType);
          const baseMeta = {
            documentType: docType,
            documentNumber: detail.documentNumber,
            issueDate: detail.issueDate || undefined,
            expiryDate: detail.expiryDate || undefined,
            issueDistrict: detail.issueDistrict || undefined,
          };

          if (docType === "CITIZENSHIP") {
            return [
              {
                fileType: KycFileType.CITIZENSHIP_FRONT,
                fileUrl: detail.frontImage,
                documentMetadata: baseMeta,
              },
              {
                fileType: KycFileType.CITIZENSHIP_BACK,
                fileUrl: detail.backImage,
                documentMetadata: baseMeta,
              },
            ];
          }

          if (docType === "DRIVING_LICENSE") {
            return [
              {
                fileType: KycFileType.LICENSE_FRONT,
                fileUrl: detail.frontImage,
                documentMetadata: baseMeta,
              },
              {
                fileType: KycFileType.LICENSE_BACK,
                fileUrl: detail.backImage,
                documentMetadata: baseMeta,
              },
            ];
          }

          if (docType === "PASSPORT") {
            return [
              {
                fileType: KycFileType.PASSPORT,
                fileUrl: detail.frontImage,
                documentMetadata: baseMeta,
              },
            ];
          }

          return [
            {
              fileType: KycFileType.PAN,
              fileUrl: detail.frontImage,
              documentMetadata: baseMeta,
            },
          ];
        }),
      ];

      await createKyc({
        tenantId: isLockedTenant ? defaultTenantId : form.tenantId,
        fullName,
        dateOfBirth: form.dateOfBirth,
        photoUrl: passportPhoto,
        personalDetails: {
          firstName: form.firstName,
          middleName: form.middleName,
          lastName: form.lastName,
          gender: form.gender,
          maritalStatus: form.maritalStatus,
          fatherName: form.fatherName,
          motherName: form.motherName,
          grandfatherName: form.grandfatherName,
          source: "borrower-web",
        },
        permanentAddress: {
          province: form.province,
          district: form.district,
          municipality: form.municipality,
          ward: form.ward,
          tole: form.tole,
        },
        occupation: form.occupation,
        monthlyIncome: Number(form.monthlyIncome),
        bankDetails: {
          bankName: form.bankName,
          bankAccountNumber: form.bankAccountNumber,
          bankBranch: form.bankBranch,
        },
        files,
      }).unwrap();

      toast({
        title: "KYC submitted",
        description: "Your request has been submitted for review.",
      });

      onOpenChange(false);
      setStep(1);
    } catch (error: any) {
      toast({
        title: "KYC submission failed",
        description: error?.data?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-4xl p-0 max-h-[92vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="px-6 pt-6 pb-4 border-b border-border/40 bg-muted/5">
            <DialogTitle className="text-xl">Verify KYC</DialogTitle>
            <DialogDescription>
              Complete verification for this lender before applying for a loan.
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="px-6 pb-6 pt-5">
          <div className="mb-6 rounded-2xl border border-border/40 bg-background/60 p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Step {step} of {stepMeta.length}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {stepMeta[step - 1]?.label}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Complete each section to submit your KYC verification.
                </p>
              </div>
              <div className="text-xs font-semibold text-muted-foreground">
                {stepProgress}%
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${stepProgress}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-widest">
              {stepMeta.map((item) => {
                const Icon = item.icon;
                return (
                  <span
                    key={item.id}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border",
                      step >= item.id
                        ? "border-primary/40 text-primary bg-primary/10"
                        : "border-border/40 text-muted-foreground bg-muted/30",
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {item.label}
                  </span>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              {step === 1 && (
                <div className="rounded-2xl border border-border/40 bg-card/70 shadow-sm p-5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                    <Building2 className="w-4 h-4 text-primary" />
                    Identity Information
                  </div>
                  {!isLockedTenant && (
                    <div className="space-y-2">
                      <Label>
                        Lender <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={form.tenantId}
                        onValueChange={(value) =>
                          setForm((prev) => ({ ...prev, tenantId: value }))
                        }
                      >
                        <SelectTrigger className={selectClass}>
                          <SelectValue placeholder="Select lender" />
                        </SelectTrigger>
                        <SelectContent>
                          {tenants.map((tenant) => (
                            <SelectItem key={tenant.id} value={tenant.id}>
                              {tenant.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>
                        First Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={form.firstName}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Middle Name</Label>
                      <Input
                        value={form.middleName}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            middleName: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Last Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={form.lastName}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>
                        Date of Birth{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={form.dateOfBirth}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            dateOfBirth: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select
                        value={form.gender}
                        onValueChange={(value) =>
                          setForm((prev) => ({ ...prev, gender: value }))
                        }
                      >
                        <SelectTrigger className={selectClass}>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDER_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Marital Status</Label>
                      <Select
                        value={form.maritalStatus}
                        onValueChange={(value) =>
                          setForm((prev) => ({ ...prev, maritalStatus: value }))
                        }
                      >
                        <SelectTrigger className={selectClass}>
                          <SelectValue placeholder="Select marital status" />
                        </SelectTrigger>
                        <SelectContent>
                          {MARITAL_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="rounded-2xl border border-border/40 bg-card/70 shadow-sm p-5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                    <Home className="w-4 h-4 text-primary" />
                    Family & Address Details
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>Father&apos;s Name</Label>
                      <Input
                        value={form.fatherName}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            fatherName: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mother&apos;s Name</Label>
                      <Input
                        value={form.motherName}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            motherName: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Grandfather&apos;s Name</Label>
                      <Input
                        value={form.grandfatherName}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            grandfatherName: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>
                        Province <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={form.province}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            province: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        District <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={form.district}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            district: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Municipality <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={form.municipality}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            municipality: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Ward <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={form.ward}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, ward: e.target.value }))
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tole/Street</Label>
                    <Input
                      value={form.tole}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, tole: e.target.value }))
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="rounded-2xl border border-border/40 bg-card/70 shadow-sm p-5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                    <IconCurrencyRupeeNepalese className="w-4 h-4 text-primary" />
                    Occupation & Banking
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>
                        Occupation <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={form.occupation}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            occupation: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Monthly Income (NPR){" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        value={form.monthlyIncome}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            monthlyIncome: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input
                        value={form.bankName}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            bankName: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Account Number</Label>
                      <Input
                        value={form.bankAccountNumber}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            bankAccountNumber: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Bank Branch</Label>
                    <Input
                      value={form.bankBranch}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          bankBranch: e.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="rounded-2xl border border-border/40 bg-card/70 shadow-sm p-5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                    <FileBadge className="w-4 h-4 text-primary" />
                    Document Selection
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Select Document Type(s){" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {DOCUMENT_TYPE_OPTIONS.map((option) => {
                        const selected = selectedDocumentTypes.includes(
                          option.value,
                        );
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleToggleDocType(option.value)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs border transition-colors",
                              selected
                                ? "bg-primary/10 border-primary/40 text-primary"
                                : "bg-muted/20 border-border/40 text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedDocumentTypes.length > 0 && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Active Document</Label>
                        <Select
                          value={activeDocumentType}
                          onValueChange={(value) =>
                            setActiveDocumentType(value as DocumentType)
                          }
                        >
                          <SelectTrigger className={selectClass}>
                            <SelectValue placeholder="Choose document to fill" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedDocumentTypes.map((docType) => {
                              const label =
                                DOCUMENT_TYPE_OPTIONS.find(
                                  (d) => d.value === docType,
                                )?.label || docType;
                              return (
                                <SelectItem key={docType} value={docType}>
                                  {label}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {activeDocumentType &&
                        activeDocDetail &&
                        activeDocMeta && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-2 sm:col-span-2">
                              <Label>
                                {activeDocMeta.numberLabel}{" "}
                                <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                value={activeDocDetail.documentNumber}
                                onChange={(e) =>
                                  updateDocumentDetail(
                                    activeDocumentType,
                                    "documentNumber",
                                    e.target.value,
                                  )
                                }
                                className={inputClass}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Issue Date</Label>
                              <Input
                                type="date"
                                value={activeDocDetail.issueDate}
                                onChange={(e) =>
                                  updateDocumentDetail(
                                    activeDocumentType,
                                    "issueDate",
                                    e.target.value,
                                  )
                                }
                                className={inputClass}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Expiry Date</Label>
                              <Input
                                type="date"
                                value={activeDocDetail.expiryDate}
                                onChange={(e) =>
                                  updateDocumentDetail(
                                    activeDocumentType,
                                    "expiryDate",
                                    e.target.value,
                                  )
                                }
                                className={inputClass}
                              />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                              <Label>Issue District</Label>
                              <Input
                                value={activeDocDetail.issueDistrict}
                                onChange={(e) =>
                                  updateDocumentDetail(
                                    activeDocumentType,
                                    "issueDistrict",
                                    e.target.value,
                                  )
                                }
                                className={inputClass}
                              />
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}

              {step === 5 && (
                <div className="rounded-2xl border border-border/40 bg-card/70 shadow-sm p-5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                    <FileScan className="w-4 h-4 text-primary" />
                    Upload Verification Files
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>
                        Passport Size Photo{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <label className="h-36 rounded-xl border border-dashed border-border/40 flex items-center justify-center cursor-pointer overflow-hidden bg-muted/10 hover:bg-muted/20 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            uploadImage(
                              e.target.files?.[0] || null,
                              "passportPhoto",
                            )
                          }
                        />
                        {passportPhoto ? (
                          <img
                            src={passportPhoto}
                            alt="Passport"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                            <Upload className="w-4 h-4" /> Upload Image
                          </div>
                        )}
                      </label>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Selfie <span className="text-destructive">*</span>
                      </Label>
                      <label className="h-36 rounded-xl border border-dashed border-border/40 flex items-center justify-center cursor-pointer overflow-hidden bg-muted/10 hover:bg-muted/20 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            uploadImage(e.target.files?.[0] || null, "selfie")
                          }
                        />
                        {selfie ? (
                          <img
                            src={selfie}
                            alt="Selfie"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                            <Upload className="w-4 h-4" /> Upload Image
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {activeDocumentType && activeDocDetail && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>
                          Document Front{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <label className="h-28 rounded-xl border border-dashed border-border/40 flex items-center justify-center cursor-pointer overflow-hidden bg-muted/10 hover:bg-muted/20 transition-colors">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) =>
                              uploadImage(
                                e.target.files?.[0] || null,
                                "frontImage",
                                activeDocumentType,
                              )
                            }
                          />
                          {activeDocDetail.frontImage ? (
                            <img
                              src={activeDocDetail.frontImage}
                              alt="Document front"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                              <Upload className="w-4 h-4" /> Upload Front
                            </div>
                          )}
                        </label>
                      </div>
                      {activeDocumentType !== "PAN" && (
                        <div className="space-y-2">
                          <Label>
                            Document Back{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <label className="h-28 rounded-xl border border-dashed border-border/40 flex items-center justify-center cursor-pointer overflow-hidden bg-muted/10 hover:bg-muted/20 transition-colors">
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={(e) =>
                                uploadImage(
                                  e.target.files?.[0] || null,
                                  "backImage",
                                  activeDocumentType,
                                )
                              }
                            />
                            {activeDocDetail.backImage ? (
                              <img
                                src={activeDocDetail.backImage}
                                alt="Document back"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                                <Upload className="w-4 h-4" /> Upload Back
                              </div>
                            )}
                          </label>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {selectedDocumentTypes.map((docType) => {
                      const detail = getDocumentDetail(docType);
                      const done = Boolean(
                        detail.documentNumber &&
                        detail.frontImage &&
                        (docType === "PAN" || detail.backImage),
                      );
                      const label =
                        DOCUMENT_TYPE_OPTIONS.find((d) => d.value === docType)
                          ?.label || docType;
                      return (
                        <Badge
                          key={docType}
                          variant="outline"
                          className={
                            done ? "border-emerald-500 text-emerald-600" : ""
                          }
                        >
                          {done ? <Check className="w-3 h-3 mr-1" /> : null}
                          {label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-between gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-11 rounded-xl"
              >
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={step === 1 || isSubmitting}
                  className="h-11 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                {step < 5 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={isSubmitting}
                    className="h-11 rounded-xl"
                  >
                    Next <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!canSubmit || isSubmitting}
                    className="h-11 rounded-xl"
                  >
                    {isSubmitting ? "Submitting..." : "Submit KYC"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
