import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
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
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  FileBadge,
  FileCheck,
  FileText,
  Gem,
  Home,
  ImagePlus,
  ListChecks,
  ShieldCheck,
  Tractor,
  Truck,
  Upload,
  Wrench,
} from "lucide-react";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useGetTenantsQuery } from "@/apis/tenantsApi";
import { useGetLoansQuery, useCreateLoanMutation } from "@/apis/loansApi";
import { LoanStatus } from "@/types/loan";
import { useGetMyWalletsQuery } from "@/apis/walletsApi";
import { useListMySubscriptionsQuery } from "@/apis/subscriptionsApi";
import { useGetKycsQuery } from "@/apis/kycApi";
import { KycStatus } from "@/types/kyc";
import { getBlockchainAccessSnapshot } from "@/utils/blockchainAccess";
import { recordLoanOnBlockchain } from "@/utils/blockchain";
import { BlockchainProcessingModal } from "@/components/ui/blockchain-processing-modal";
import { useUploadSingleMutation } from "@/apis/uploadApi";
import { cn } from "@/lib/utils";
import type { ComponentType } from "react";

const COLLATERAL_OPTIONS: Array<{
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}> = [
    { label: "Property/Land", value: "Property", icon: Home },
    { label: "Vehicle", value: "Vehicle", icon: Truck },
    { label: "Gold", value: "Gold", icon: Gem },
    { label: "Machinery", value: "Machinery", icon: Wrench },
    { label: "Stock/Inventory", value: "Stock", icon: Tractor },
    { label: "Other", value: "Other", icon: BriefcaseBusiness },
  ];

const LOAN_PURPOSE_OPTIONS: Array<{
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  desc: string;
}> = [
    { label: "Business Expansion", value: "Business Expansion", icon: BriefcaseBusiness, desc: "Grow your business" },
    { label: "Home Renovation", value: "Home Renovation", icon: Home, desc: "Improve your home" },
    { label: "Education", value: "Education", icon: FileText, desc: "Invest in knowledge" },
    { label: "Medical Emergency", value: "Medical Emergency", icon: ShieldCheck, desc: "Health & care" },
    { label: "Vehicle Purchase", value: "Vehicle Purchase", icon: Truck, desc: "Buy a vehicle" },
    { label: "Debt Consolidation", value: "Debt Consolidation", icon: CheckCircle2, desc: "Simplify payments" },
    { label: "Working Capital", value: "Working Capital", icon: Wrench, desc: "Day-to-day operations" },
    { label: "Other", value: "Other", icon: ListChecks, desc: "Something else" },
  ];

export function ApplyLoanModal({
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  const stepMeta = [
    { id: 1, label: "Basics & Purpose", icon: Building2 },
    { id: 2, label: "Collateral Type", icon: ShieldCheck },
    { id: 3, label: "Collateral Details", icon: ListChecks },
    { id: 4, label: "Review", icon: CheckCircle2 },
  ];

  const [createLoan] = useCreateLoanMutation();
  const [uploadSingle, { isLoading: isUploading }] = useUploadSingleMutation();
  const { data: previousLoans } = useGetLoansQuery(
    { limit: 1 },
    { skip: !user?.id }
  );
  const { data: tenantsData } = useGetTenantsQuery({
    limit: 100,
    isActive: "true",
  });

  const [formData, setFormData] = useState({
    requestedAmount: "",
    purpose: "",
    collateralType: "",
    collateralDescription: "",
    collateralValue: "",
    collateralImageUrl: "",
    requestedTermMonths: "",
    tenantId: defaultTenantId,
  });

  const currentTenantId = isLockedTenant ? defaultTenantId : formData.tenantId;
  const { data: tenantLoansData } = useGetLoansQuery(
    { tenantId: currentTenantId, userId: user?.id, limit: 1, sortOrder: "desc" } as any,
    { skip: !user?.id || !currentTenantId }
  );

  const existingLoan = tenantLoansData?.data?.[0];
  const isLoanBlocked =
    existingLoan &&
    [
      LoanStatus.DRAFT,
      LoanStatus.SUBMITTED,
      LoanStatus.UNDER_REVIEW,
      LoanStatus.APPROVED,
      LoanStatus.CONTRACT_GENERATED,
      LoanStatus.CONTRACT_SIGNED,
    ].includes(existingLoan.status as LoanStatus);
  const tenants = tenantsData?.data || [];

  useEffect(() => {
    if (open && previousLoans?.data?.length) {
      const loan = previousLoans.data[0];
      setFormData((prev) => ({
        ...prev,
        requestedAmount: (loan.requestedAmount?.toString() as string) || prev.requestedAmount,
        requestedTermMonths: (loan.requestedTermMonths?.toString() as string) || prev.requestedTermMonths,
        tenantId: (loan.tenantId as string) || prev.tenantId,
        purpose: (loan.purpose as string) || "",
        collateralType: (loan.collateralDetails?.type as string) || prev.collateralType,
        collateralDescription: (loan.collateralDetails?.description as string) || "",
        collateralValue: (loan.collateralDetails?.value?.toString() as string) || "",
        collateralImageUrl: (loan.collateralDetails?.imageUrl as string) || "",
      }));
    }
  }, [open, previousLoans]);

  const { data: wallets = [] } = useGetMyWalletsQuery();
  const { data: mySubscriptions = [] } = useListMySubscriptionsQuery();

  const { data: kycsData } = useGetKycsQuery(
    {
      userId: user?.id,
      tenantId: formData.tenantId || undefined,
      status: KycStatus.VERIFIED,
    },
    { skip: !user?.id || !formData.tenantId },
  );

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

  const [blockchainStep, setBlockchainStep] = useState<
    "blockchain" | "database" | "complete"
  >("blockchain");
  const [isProcessingBlockchain, setIsProcessingBlockchain] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const uploadCollateral = async (file: File | null) => {
    if (!file) return;
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("category", "loan-collateral");
      const uploaded = await uploadSingle(data).unwrap();
      setFormData((prev) => ({ ...prev, collateralImageUrl: uploaded.url }));
      toast({ title: "Uploaded", description: "Collateral image uploaded." });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error?.data?.message || "Unable to upload collateral image.",
        variant: "destructive",
      });
    }
  };

  const isStepValid = (currentStep: number) => {
    if (currentStep === 1) {
      return Boolean(
        formData.requestedAmount &&
        formData.requestedTermMonths &&
        formData.purpose &&
        (isLockedTenant ? defaultTenantId : formData.tenantId),
      );
    }
    if (currentStep === 2) {
      return Boolean(formData.collateralType);
    }
    if (currentStep === 3) {
      return Boolean(
        formData.collateralDescription &&
        formData.collateralValue &&
        formData.collateralImageUrl,
      );
    }
    return true;
  };

  const nextStep = () => {
    if (!isStepValid(step)) {
      toast({
        title: "Missing fields",
        description: "Please complete required fields before continuing.",
        variant: "destructive",
      });
      return;
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    if (!formData.tenantId || !formData.requestedAmount || !formData.requestedTermMonths) {
      toast({ title: "Validation Error", description: "Missing required fields.", variant: "destructive" });
      return;
    }
    const isKycVerified = kycsData && kycsData.total > 0;
    if (!isKycVerified) {
      toast({
        title: "KYC Required",
        description: "You must have a verified KYC for this lender before applying for a loan.",
        variant: "destructive",
      });
      return;
    }

    const requestedAmount = Number(formData.requestedAmount);
    const requestedTermMonths = Number(formData.requestedTermMonths);
    const payload = {
      requestedAmount,
      purpose: formData.purpose,
      collateralDetails: {
        type: formData.collateralType,
        description: formData.collateralDescription,
        value: Number(formData.collateralValue) || 0,
        imageUrl: formData.collateralImageUrl,
      },
      requestedTermMonths,
      tenantId: formData.tenantId,
    };

    try {
      if (shouldShowBlockchainProcessing) {
        setIsProcessingBlockchain(true);
        setBlockchainStep("blockchain");
      }
      let blockchainTxHash: string | undefined;
      let loanId: string | undefined;

      if (shouldUseWalletSignature) {
        try {
          loanId = crypto.randomUUID();
          blockchainTxHash = await recordLoanOnBlockchain(
            loanId, requestedAmount * 100, 1200, requestedTermMonths,
          );
        } catch (blockchainError: any) {
          setIsProcessingBlockchain(false);
          toast({ title: "Blockchain Error", description: blockchainError.message || blockchainError.code, variant: "destructive" });
          return;
        }
      }

      if (shouldShowBlockchainProcessing) setBlockchainStep("database");
      const finalPayload = blockchainTxHash && loanId
        ? { ...payload, blockchainTxHash, id: loanId }
        : payload;

      await createLoan(finalPayload).unwrap();

      if (shouldShowBlockchainProcessing) {
        setBlockchainStep("complete");
        setTimeout(() => {
          setIsProcessingBlockchain(false);
          navigate("/my-loans");
        }, 1000);
      } else {
        toast({ title: "Success", description: "Loan request submitted successfully." });
        navigate("/my-loans");
      }
    } catch (err: any) {
      setIsProcessingBlockchain(false);
      toast({ title: "Error", description: err?.data?.message || "Failed to submit loan request.", variant: "destructive" });
    }
  };

  const inputClass = "h-10 bg-muted/20 border-border/40 focus-visible:ring-primary/30 rounded-xl text-sm";

  const selectedLenderName = tenants.find((t) => t.id === formData.tenantId)?.name || "-";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-xl p-0 max-h-[92vh] overflow-y-auto rounded-xl"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-xl font-bold tracking-tight">Apply for a Loan</DialogTitle>
                <DialogDescription className="text-sm">
                  Complete your financing requirements in a few simple steps.
                </DialogDescription>
              </div>
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
                        {isDone ? (
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

            <div className="space-y-6">
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  {isLoanBlocked && (
                    <div className="bg-destructive/10 text-destructive text-xs font-bold p-3 rounded-xl border border-destructive/20 flex gap-2 items-center">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      You already have a {existingLoan?.status} loan request for this institution.
                    </div>
                  )}

                  <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
                    <div className="flex gap-3 items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                      </div>
                      <div className="space-y-0">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Lender Recommendation</p>
                        <p className="text-xs text-foreground/80 leading-tight">
                          Aim for a Loan-to-Value (LTV) ratio under <span className="text-primary font-bold">70%</span> for prioritized approval.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-1 border-b border-border/40">
                        <Building2 className="w-3.5 h-3.5 text-primary" />
                        <h3 className="text-xs font-bold text-foreground">Basic Requirements</h3>
                      </div>
                    </div>

                    {!isLockedTenant && (
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Target Institution <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={formData.tenantId}
                          onValueChange={(value) => handleSelectChange("tenantId", value)}
                        >
                          <SelectTrigger className={inputClass}>
                            <SelectValue placeholder="Choose a partner lender" />
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
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Requested Amount (NPR) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        name="requestedAmount"
                        value={formData.requestedAmount}
                        onChange={handleChange}
                        placeholder="Amount in Rupees"
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Duration (Months) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        name="requestedTermMonths"
                        value={formData.requestedTermMonths}
                        onChange={handleChange}
                        placeholder="e.g. 12, 24, 36"
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-4 mt-2">
                      <div className="flex items-center gap-2 pb-1 border-b border-border/40">
                        <FileText className="w-3.5 h-3.5 text-primary" />
                        <h3 className="text-xs font-bold text-foreground">Facility Purpose</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {LOAN_PURPOSE_OPTIONS.map((option) => {
                          const Icon = option.icon;
                          const isSelected = formData.purpose === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleSelectChange("purpose", option.value)}
                              className={cn(
                                "group rounded-xl border p-2 text-left transition-all duration-200 cursor-pointer relative",
                                isSelected
                                  ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm"
                                  : "border-border bg-muted/5 hover:border-primary/30 hover:bg-muted/10",
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                  isSelected ? "bg-primary text-primary-foreground" : "bg-background border border-border group-hover:border-primary/30 text-muted-foreground",
                                )}>
                                  <Icon className="w-3 h-3" />
                                </div>
                                <p className={cn(
                                  "text-[10px] font-bold leading-tight",
                                  isSelected ? "text-primary" : "text-foreground/80 group-hover:text-foreground",
                                )}>
                                  {option.label}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 py-2">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Select Collateral Type</h3>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {COLLATERAL_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const isSelected = formData.collateralType === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleSelectChange("collateralType", option.value)}
                          className={cn(
                            "group rounded-xl border p-4 flex flex-col items-center gap-2 transition-all duration-200 cursor-pointer relative",
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm"
                              : "border-border bg-muted/5 hover:border-primary/30 hover:bg-muted/10",
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                            isSelected ? "bg-primary text-primary-foreground shadow-md scale-105" : "bg-background border border-border group-hover:border-primary/30 text-muted-foreground",
                          )}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            isSelected ? "text-primary" : "text-foreground/80 group-hover:text-foreground",
                          )}>
                            {option.label}
                          </span>
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                    <FileBadge className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Collateral Verification</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-8 items-start">
                    <div className="space-y-5">
                      <div className="space-y-2.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Estimated Value (NPR) <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <IconCurrencyRupeeNepalese className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="number"
                            name="collateralValue"
                            value={formData.collateralValue}
                            onChange={handleChange}
                            placeholder="Current market valuation"
                            className={cn(inputClass, "pl-9")}
                          />
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Description & Features <span className="text-destructive">*</span>
                        </Label>
                        <textarea
                          name="collateralDescription"
                          value={formData.collateralDescription}
                          onChange={(e: any) => setFormData(prev => ({ ...prev, collateralDescription: e.target.value }))}
                          placeholder="Provide details about the collateral (e.g., location, model, condition)"
                          className="min-h-[160px] w-full rounded-xl border border-border/40 bg-muted/10 px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Supporting Evidence <span className="text-destructive">*</span>
                      </Label>
                      <label className="group h-[230px] rounded-xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-muted/5 hover:border-primary/40 hover:bg-muted/10 transition-all duration-300">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => uploadCollateral(e.target.files?.[0] || null)}
                        />
                        {formData.collateralImageUrl ? (
                          <div className="relative w-full h-full">
                            <img
                              src={formData.collateralImageUrl}
                              alt="Collateral"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white">
                              <div className="flex flex-col items-center gap-2">
                                <Upload className="w-8 h-8" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">Update Document</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-3 text-muted-foreground p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center group-hover:border-primary/40 group-hover:text-primary transition-all duration-300">
                              <ImagePlus className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-[11px] font-bold text-foreground">
                                {isUploading ? "Uploading..." : "Upload Asset Photo"}
                              </p>
                              <p className="text-[10px] leading-tight text-muted-foreground max-w-[150px]">
                                JPG or PNG. High resolution images speed up appraisal.
                              </p>
                            </div>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                    <ListChecks className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Application Summary</h3>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { label: "Institution", value: selectedLenderName, icon: Building2 },
                      { label: "Principal", value: `NPR ${Number(formData.requestedAmount || 0).toLocaleString("en-IN")}`, icon: IconCurrencyRupeeNepalese },
                      { label: "Loan Term", value: `${formData.requestedTermMonths} months`, icon: CalendarClock },
                      { label: "Purpose", value: formData.purpose, icon: FileText },
                      { label: "Asset Type", value: formData.collateralType, icon: ShieldCheck },
                      { label: "Asset Value", value: `NPR ${Number(formData.collateralValue || 0).toLocaleString("en-IN")}`, icon: IconCurrencyRupeeNepalese },
                    ].map((row) => (
                      <div key={row.label} className="p-3 rounded-xl border border-border/40 bg-muted/5 flex flex-col gap-1.5 transition-all hover:bg-muted/10">
                        <div className="flex items-center gap-1.5">
                          <row.icon className="w-3 h-3 text-primary/70" />
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{row.label}</span>
                        </div>
                        <p className="text-xs font-bold text-foreground truncate">{row.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-muted/5">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        formData.collateralImageUrl ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                      )}>
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Supporting Docs</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formData.collateralImageUrl ? "Verified & Attached" : "Missing collateral photo"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-muted/5">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <Clock3 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Timeline</p>
                        <p className="text-xs text-muted-foreground mt-0.5">3–5 Business Days</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap justify-between gap-2 pt-4 border-t border-border/30">
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
                    disabled={step === 1 || isProcessingBlockchain}
                    className="h-11 rounded-xl"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  {step < 4 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={isProcessingBlockchain || (step === 1 && isLoanBlocked)}
                      className="h-11 rounded-xl"
                    >
                      Next <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isProcessingBlockchain || !isStepValid(3)}
                      className="h-11 rounded-xl"
                    >
                      {isProcessingBlockchain ? "Processing..." : "Submit Application"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BlockchainProcessingModal
        open={isProcessingBlockchain}
        currentStep={blockchainStep}
      />
    </>
  );
}
