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
  CheckCircle2,
  FileBadge,
  FileCheck,
  FileScan,
  Heart,
  Home,
  Upload,
  User,
  UserCheck,
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
    { id: 1, label: "Basic Info", icon: UserCircle2 },
    { id: 2, label: "Personal", icon: Heart },
    { id: 3, label: "Address", icon: Home },
    { id: 4, label: "Professional", icon: Building2 },
    { id: 5, label: "Documents", icon: FileBadge },
    { id: 6, label: "Finalize", icon: FileScan },
  ];
  const stepProgress = Math.round((step / stepMeta.length) * 100);
  const inputClass =
    "h-10 bg-muted/20 border-border/40 focus-visible:ring-primary/30 rounded-xl text-sm";
  const selectClass = "h-10 bg-muted/20 border-border/40 rounded-xl text-sm";
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
        Boolean(form.gender) &&
        Boolean(form.maritalStatus) &&
        Boolean(form.fatherName) &&
        Boolean(form.motherName) &&
        Boolean(form.grandfatherName)
      );
    }
    if (currentStep === 3) {
      return (
        Boolean(form.province.trim()) &&
        Boolean(form.district.trim()) &&
        Boolean(form.municipality.trim()) &&
        Boolean(form.ward.trim())
      );
    }
    if (currentStep === 4) {
      return Boolean(form.occupation.trim()) && Boolean(form.monthlyIncome);
    }
    if (currentStep === 5) {
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
    setStep((prev) => Math.min(prev + 1, 6));
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

  const genderIcons = {
    Male: UserCircle2,
    Female: UserCircle2,
    Other: UserCircle2,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-3xl p-0 max-h-[92vh] overflow-y-auto rounded-xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
          <div className="space-y-1">
            <DialogTitle className="text-xl font-bold tracking-tight">KYC Verification</DialogTitle>
            <DialogDescription className="text-sm">
              Complete your identity verification to unlock full platform features.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="px-6 py-6">
          <div className="mb-8 overflow-hidden">
            <div className="flex items-center justify-between relative px-2">
              <div className="absolute top-5 left-8 right-8 h-[2px] bg-border/40 z-0" />
              {stepMeta.map((s, i) => {
                const Icon = s.icon;
                const isDone = step > s.id;
                const isActive = step === s.id;
                return (
                  <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm",
                        isDone
                          ? "bg-primary border-primary text-primary-foreground"
                          : isActive
                          ? "border-primary bg-background text-primary ring-4 ring-primary/10"
                          : "border-border bg-background text-muted-foreground",
                      )}
                    >
                      {step > s.id ? (
                        <Check className="w-5 h-5 stroke-[3px]" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider text-center hidden sm:block",
                        isActive ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                     <UserCircle2 className="w-4 h-4 text-primary" />
                     <h3 className="text-sm font-bold text-foreground">Basic Information</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-y-4">
                    {!isLockedTenant && (
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Target Institution <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={form.tenantId}
                          onValueChange={(value) => setForm((prev) => ({ ...prev, tenantId: value }))}
                        >
                          <SelectTrigger className={inputClass}>
                            <SelectValue placeholder="Select target lender" />
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

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">First Name *</Label>
                      <Input
                        value={form.firstName}
                        onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                        placeholder="John"
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Last Name *</Label>
                      <Input
                        value={form.lastName}
                        onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Doe"
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Middle Name</Label>
                      <Input
                        value={form.middleName}
                        onChange={(e) => setForm((prev) => ({ ...prev, middleName: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date of Birth *</Label>
                      <Input
                        type="date"
                        value={form.dateOfBirth}
                        onChange={(e) => setForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                     <Heart className="w-4 h-4 text-primary" />
                     <h3 className="text-sm font-bold text-foreground">Personal Details</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-y-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Biological Gender *</Label>
                       <div className="grid grid-cols-3 gap-2">
                         {GENDER_OPTIONS.map((opt) => (
                           <button
                            key={opt}
                            type="button"
                            onClick={() => setForm(p => ({ ...p, gender: opt }))}
                            className={cn(
                              "px-2 py-2 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer",
                              form.gender === opt
                                ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20 shadow-sm"
                                : "border-border bg-muted/5 text-muted-foreground hover:border-primary/20"
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                       <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Marital Status *</Label>
                       <div className="grid grid-cols-2 gap-2">
                         {MARITAL_STATUS_OPTIONS.map((opt) => (
                           <button
                            key={opt}
                            type="button"
                            onClick={() => setForm(p => ({ ...p, maritalStatus: opt }))}
                            className={cn(
                              "px-2 py-2 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer",
                              form.maritalStatus === opt
                                ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20 shadow-sm"
                                : "border-border bg-muted/5 text-muted-foreground hover:border-primary/20"
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                       <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Father's Full Name *</Label>
                       <Input value={form.fatherName} onChange={e => setForm(p => ({...p, fatherName: e.target.value}))} className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mother's Full Name *</Label>
                       <Input value={form.motherName} onChange={e => setForm(p => ({...p, motherName: e.target.value}))} className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Grandfather's Full Name *</Label>
                       <Input value={form.grandfatherName} onChange={e => setForm(p => ({...p, grandfatherName: e.target.value}))} className={inputClass} />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                     <Home className="w-4 h-4 text-primary" />
                     <h3 className="text-sm font-bold text-foreground">Permanent Residence</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-y-4">
                    <div className="space-y-1.5">
                       <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Province *</Label>
                       <Input value={form.province} onChange={e => setForm(p => ({...p, province: e.target.value}))} className={inputClass} placeholder="e.g. Bagmati" />
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">District *</Label>
                       <Input value={form.district} onChange={e => setForm(p => ({...p, district: e.target.value}))} className={inputClass} placeholder="e.g. Kathmandu" />
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Municipality / Rural Municipality *</Label>
                       <Input value={form.municipality} onChange={e => setForm(p => ({...p, municipality: e.target.value}))} className={inputClass} placeholder="e.g. Kathmandu Metro" />
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1.5">
                         <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ward No. *</Label>
                         <Input type="number" value={form.ward} onChange={e => setForm(p => ({...p, ward: e.target.value}))} className={inputClass} placeholder="10" />
                      </div>
                      <div className="space-y-1.5">
                         <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tole / Village</Label>
                         <Input value={form.tole} onChange={e => setForm(p => ({...p, tole: e.target.value}))} className={inputClass} placeholder="New Baneshwor" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                     <Building2 className="w-4 h-4 text-primary" />
                     <h3 className="text-sm font-bold text-foreground">Professional & Financials</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-y-4">
                    <div className="space-y-1.5">
                       <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Primary Occupation *</Label>
                       <Input value={form.occupation} onChange={e => setForm(p => ({...p, occupation: e.target.value}))} className={inputClass} placeholder="e.g. Senior Software Engineer" />
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Monthly Take-Home Income (NPR) *</Label>
                       <div className="relative">
                         <IconCurrencyRupeeNepalese className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                         <Input type="number" value={form.monthlyIncome} onChange={e => setForm(p => ({...p, monthlyIncome: e.target.value}))} className={cn(inputClass, "pl-8")} placeholder="75000" />
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Primary Bank Name</Label>
                       <Input value={form.bankName} onChange={e => setForm(p => ({...p, bankName: e.target.value}))} className={inputClass} placeholder="e.g. Nabil Bank Ltd." />
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Account Number</Label>
                       <Input value={form.bankAccountNumber} onChange={e => setForm(p => ({...p, bankAccountNumber: e.target.value}))} className={inputClass} placeholder="00100XXXXXXXXX" />
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bank Branch Location</Label>
                       <Input value={form.bankBranch} onChange={e => setForm(p => ({...p, bankBranch: e.target.value}))} className={inputClass} placeholder="Main Branch, Kathmandu" />
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                    <FileBadge className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Document Management</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Select Identity Documents *</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {DOCUMENT_TYPE_OPTIONS.map((opt) => {
                          const selected = selectedDocumentTypes.includes(opt.value);
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleToggleDocType(opt.value)}
                              className={cn(
                                "group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden relative",
                                selected
                                  ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm"
                                  : "border-border bg-muted/5 hover:border-primary/30 hover:bg-muted/10"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                  selected ? "bg-primary text-primary-foreground" : "bg-background border border-border group-hover:border-primary/30 text-muted-foreground"
                                )}>
                                  <FileCheck className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                   <p className={cn("text-xs font-bold", selected ? "text-primary" : "text-foreground/80")}>{opt.label}</p>
                                   <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold">Lender Requirement</p>
                                </div>
                              </div>
                              {selected && (
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {selectedDocumentTypes.length > 0 ? (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-400">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Document Detail *</Label>
                          <div className="mt-2 p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
                            <div className="space-y-1.5">
                               <Select
                                value={activeDocumentType}
                                onValueChange={(value) => setActiveDocumentType(value as DocumentType)}
                              >
                                <SelectTrigger className="h-10 rounded-lg bg-background border-primary/20 font-bold text-xs">
                                  <SelectValue placeholder="Choose document" />
                                </SelectTrigger>
                                <SelectContent>
                                  {selectedDocumentTypes.map((docType) => {
                                    const label = DOCUMENT_TYPE_OPTIONS.find((d) => d.value === docType)?.label || docType;
                                    return <SelectItem key={docType} value={docType} className="font-bold text-xs">{label}</SelectItem>;
                                  })}
                                </SelectContent>
                              </Select>
                            </div>

                            {activeDocumentType && activeDocDetail && activeDocMeta && (
                              <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="space-y-1.5">
                                   <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{activeDocMeta.numberLabel}</Label>
                                   <Input value={activeDocDetail.documentNumber} onChange={e => updateDocumentDetail(activeDocumentType, "documentNumber", e.target.value)} className={cn(inputClass, "bg-background")} placeholder="ID Number" />
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                  <div className="space-y-1.5">
                                     <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Issue Date</Label>
                                     <Input type="date" value={activeDocDetail.issueDate} onChange={e => updateDocumentDetail(activeDocumentType, "issueDate", e.target.value)} className={cn(inputClass, "bg-background")} />
                                  </div>
                                  <div className="space-y-1.5">
                                     <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Expiry Date</Label>
                                     <Input type="date" value={activeDocDetail.expiryDate} onChange={e => updateDocumentDetail(activeDocumentType, "expiryDate", e.target.value)} className={cn(inputClass, "bg-background")} />
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                   <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Issue District / Authority</Label>
                                   <Input value={activeDocDetail.issueDistrict} onChange={e => updateDocumentDetail(activeDocumentType, "issueDistrict", e.target.value)} className={cn(inputClass, "bg-background")} placeholder="e.g. Kathmandu" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="h-full min-h-[200px] flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-border/40 bg-muted/5 text-muted-foreground text-center">
                           <FileScan className="w-10 h-10 mb-3 opacity-20" />
                           <p className="text-[10px] font-bold uppercase tracking-wider opacity-40">Select documents on the left to proceed</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                    <FileScan className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Upload Verification Assets</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Passport Photo *</Label>
                         <label className="group relative flex flex-col items-center justify-center h-36 rounded-xl border-2 border-dashed border-border/40 bg-muted/5 hover:border-primary/40 hover:bg-muted/10 transition-all duration-300 cursor-pointer overflow-hidden">
                            <input type="file" accept="image/*" className="hidden" onChange={e => uploadImage(e.target.files?.[0] || null, "passportPhoto")} />
                            {passportPhoto ? (
                              <>
                                <img src={passportPhoto} alt="Passport" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <div className="flex flex-col items-center gap-2">
                                    <Upload className="w-6 h-6 text-white" />
                                    <span className="text-[9px] text-white font-bold uppercase tracking-widest">Update</span>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors text-center p-4">
                                <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center bg-background">
                                  <Upload className="w-5 h-5" />
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-widest leading-tight">Passport Size Photo</span>
                              </div>
                            )}
                         </label>
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Verification Selfie *</Label>
                         <label className="group relative flex flex-col items-center justify-center h-36 rounded-xl border-2 border-dashed border-border/40 bg-muted/5 hover:border-primary/40 hover:bg-muted/10 transition-all duration-300 cursor-pointer overflow-hidden">
                            <input type="file" accept="image/*" className="hidden" onChange={e => uploadImage(e.target.files?.[0] || null, "selfie")} />
                            {selfie ? (
                              <>
                                <img src={selfie} alt="Selfie" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <div className="flex flex-col items-center gap-2">
                                    <Upload className="w-6 h-6 text-white" />
                                    <span className="text-[9px] text-white font-bold uppercase tracking-widest">Update</span>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors text-center p-4">
                                <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center bg-background">
                                  <Upload className="w-5 h-5" />
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-widest leading-tight">Live Selfie with ID</span>
                              </div>
                            )}
                         </label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Document Scans *</Label>
                      <div className="grid grid-cols-1 gap-4">
                        {selectedDocumentTypes.map((docType) => {
                          const detail = getDocumentDetail(docType);
                          const label = DOCUMENT_TYPE_OPTIONS.find((d) => d.value === docType)?.label || docType;
                          return (
                            <div key={docType} className="p-4 rounded-xl border border-border/40 bg-muted/5 space-y-3">
                              <div className="flex items-center gap-2">
                                <FileCheck className="w-3.5 h-3.5 text-primary" />
                                <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">{label} Scans</span>
                              </div>

                               <div className="grid grid-cols-2 gap-3">
                                 <div className="space-y-1.5">
                                    <label className="group h-24 rounded-lg border border-dashed border-border/60 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-background hover:border-primary/40 transition-all duration-300">
                                       <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => uploadImage(e.target.files?.[0] || null, "frontImage", docType)} />
                                       {detail.frontImage ? (
                                         <img src={detail.frontImage} alt="Front" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                      ) : (
                                        <div className="flex flex-col items-center gap-1.5 text-muted-foreground group-hover:text-primary transition-colors">
                                          <Upload className="w-4 h-4" />
                                          <span className="text-[8px] font-bold uppercase tracking-widest">Front Page</span>
                                        </div>
                                      )}
                                   </label>
                                </div>
                                {docType !== "PAN" && (
                                  <div className="space-y-1.5">
                                     <label className="group h-24 rounded-lg border border-dashed border-border/60 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-background hover:border-primary/40 transition-all duration-300">
                                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => uploadImage(e.target.files?.[0] || null, "backImage", docType)} />
                                        {detail.backImage ? (
                                          <img src={detail.backImage} alt="Back" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                        ) : (
                                          <div className="flex flex-col items-center gap-1.5 text-muted-foreground group-hover:text-primary transition-colors">
                                            <Upload className="w-4 h-4" />
                                            <span className="text-[8px] font-bold uppercase tracking-widest">Back Page</span>
                                          </div>
                                        )}
                                     </label>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 mt-12 border-t border-border/40">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="h-11 rounded-xl px-6 font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                Discard Application
              </Button>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={step === 1 || isSubmitting}
                  className="h-11 rounded-xl px-6 font-bold border-border/60 bg-muted/10 hover:bg-muted/20 transition-all"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                </Button>
                {step < 6 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={isSubmitting}
                    className="h-11 rounded-xl px-8 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                      type="submit"
                      disabled={!canSubmit || isSubmitting}
                      className="h-11 rounded-xl px-8 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                      {isSubmitting ? "Processing..." : "Submit Verification"}
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
