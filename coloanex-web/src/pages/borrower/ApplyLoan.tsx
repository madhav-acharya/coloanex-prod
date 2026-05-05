import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Check,
  FileText,
  ImagePlus,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useGetTenantsQuery } from "@/apis/tenantsApi";
import { useCreateLoanMutation } from "@/apis/loansApi";
import { useGetMyWalletsQuery } from "@/apis/walletsApi";
import { useListMySubscriptionsQuery } from "@/apis/subscriptionsApi";
import { useGetKycsQuery } from "@/apis/kycApi";
import { KycStatus } from "@/types/kyc";
import { getBlockchainAccessSnapshot } from "@/utils/blockchainAccess";
import { recordLoanOnBlockchain } from "@/utils/blockchain";
import { BlockchainProcessingModal } from "@/components/ui/blockchain-processing-modal";
import { useUploadSingleMutation } from "@/apis/uploadApi";
import { cn } from "@/lib/utils";

const COLLATERAL_TYPE_OPTIONS = [
  { label: "Property/Land", value: "Property" },
  { label: "Vehicle", value: "Vehicle" },
  { label: "Gold", value: "Gold" },
  { label: "Machinery", value: "Machinery" },
  { label: "Stock/Inventory", value: "Stock" },
  { label: "Other", value: "Other" },
];

const LOAN_PURPOSE_OPTIONS = [
  { label: "Business Expansion", value: "Business Expansion" },
  { label: "Home Renovation", value: "Home Renovation" },
  { label: "Education", value: "Education" },
  { label: "Medical Emergency", value: "Medical Emergency" },
  { label: "Vehicle Purchase", value: "Vehicle Purchase" },
  { label: "Debt Consolidation", value: "Debt Consolidation" },
  { label: "Working Capital", value: "Working Capital" },
  { label: "Other", value: "Other" },
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
    {
      id: 1,
      title: "Loan Basics",
      description: "Amount, term, and lender selection",
    },
    {
      id: 2,
      title: "Loan Purpose",
      description: "Tell us why you need the financing",
    },
    {
      id: 3,
      title: "Collateral",
      description: "Assets to secure your loan request",
    },
    {
      id: 4,
      title: "Review & Submit",
      description: "Confirm details before sending",
    },
  ];
  const activeStep = stepMeta[step - 1];
  const stepProgress = Math.round((step / stepMeta.length) * 100);
  const inputClass =
    "h-11 bg-background/60 border-border/40 focus-visible:ring-primary/30";
  const selectClass = "h-11 bg-background/60 border-border/40";

  const [createLoan] = useCreateLoanMutation();
  const [uploadSingle, { isLoading: isUploading }] = useUploadSingleMutation();
  const { data: tenantsData } = useGetTenantsQuery({
    limit: 100,
    isActive: "true",
  });
  const tenants = tenantsData?.data || [];

  const { data: wallets = [] } = useGetMyWalletsQuery();
  const { data: mySubscriptions = [] } = useListMySubscriptionsQuery();

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
        description:
          error?.data?.message || "Unable to upload collateral image.",
        variant: "destructive",
      });
    }
  };

  const isStepValid = (currentStep: number) => {
    if (currentStep === 1) {
      return Boolean(
        formData.requestedAmount &&
        formData.requestedTermMonths &&
        (isLockedTenant ? defaultTenantId : formData.tenantId),
      );
    }
    if (currentStep === 2) {
      return Boolean(formData.purpose);
    }
    if (currentStep === 3) {
      return Boolean(
        formData.collateralType &&
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
    if (
      !formData.tenantId ||
      !formData.requestedAmount ||
      !formData.requestedTermMonths
    ) {
      toast({
        title: "Validation Error",
        description: "Missing required fields.",
        variant: "destructive",
      });
      return;
    }

    const isKycVerified = kycsData && kycsData.total > 0;
    if (!isKycVerified) {
      toast({
        title: "KYC Required",
        description:
          "You must have a verified KYC for this lender before applying for a loan.",
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
            loanId,
            requestedAmount * 100,
            1200,
            requestedTermMonths,
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

      const finalPayload =
        blockchainTxHash && loanId
          ? { ...payload, blockchainTxHash, id: loanId }
          : payload;

      await createLoan(finalPayload).unwrap();

      if (shouldShowBlockchainProcessing) {
        setBlockchainStep("complete");
        setTimeout(() => {
          setIsProcessingBlockchain(false);
          navigate("/borrower/my-loans");
        }, 1000);
      } else {
        toast({
          title: "Success",
          description: "Loan request submitted successfully.",
        });
        navigate("/borrower/my-loans");
      }
    } catch (err: any) {
      setIsProcessingBlockchain(false);
      toast({
        title: "Error",
        description: err?.data?.message || "Failed to submit loan request.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-3xl p-0 max-h-[92vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="px-6 pt-6 pb-4 border-b border-border/40 bg-muted/5">
              <DialogTitle className="text-xl">Apply for a Loan</DialogTitle>
              <DialogDescription>
                Submit your financing requirements in simple steps.
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
                    {activeStep?.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeStep?.description}
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
                {stepMeta.map((item) => (
                  <span
                    key={item.id}
                    className={cn(
                      "px-2.5 py-1 rounded-full border",
                      step >= item.id
                        ? "border-primary/40 text-primary bg-primary/10"
                        : "border-border/40 text-muted-foreground bg-muted/30",
                    )}
                  >
                    {item.title}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                {step === 1 && (
                  <Card className="rounded-2xl border-border/40 bg-card/70 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                        <Building2 className="w-4 h-4 text-primary" />
                        Loan Basics
                      </div>
                      {!isLockedTenant && (
                        <div className="space-y-2">
                          <Label>
                            Select Lender{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={formData.tenantId}
                            onValueChange={(value) =>
                              handleSelectChange("tenantId", value)
                            }
                          >
                            <SelectTrigger className={selectClass}>
                              <SelectValue placeholder="Choose lender" />
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>
                            Requested Amount (NPR){" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="number"
                            name="requestedAmount"
                            value={formData.requestedAmount}
                            onChange={handleChange}
                            placeholder="50000"
                            className={inputClass}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>
                            Loan Term (Months){" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="number"
                            name="requestedTermMonths"
                            value={formData.requestedTermMonths}
                            onChange={handleChange}
                            placeholder="12"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {step === 2 && (
                  <Card className="rounded-2xl border-border/40 bg-card/70 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                        <FileText className="w-4 h-4 text-primary" />
                        Loan Purpose
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Loan Purpose{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={formData.purpose}
                          onValueChange={(value) =>
                            handleSelectChange("purpose", value)
                          }
                        >
                          <SelectTrigger className={selectClass}>
                            <SelectValue placeholder="Select purpose" />
                          </SelectTrigger>
                          <SelectContent>
                            {LOAN_PURPOSE_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {step === 3 && (
                  <Card className="rounded-2xl border-border/40 bg-card/70 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        Collateral Details
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>
                            Collateral Type{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={formData.collateralType}
                            onValueChange={(value) =>
                              handleSelectChange("collateralType", value)
                            }
                          >
                            <SelectTrigger className={selectClass}>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {COLLATERAL_TYPE_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>
                            Collateral Value (NPR){" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="number"
                            name="collateralValue"
                            value={formData.collateralValue}
                            onChange={handleChange}
                            placeholder="100000"
                            className={inputClass}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Collateral Description{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          name="collateralDescription"
                          value={formData.collateralDescription}
                          onChange={handleChange}
                          placeholder="Describe your collateral"
                          className={inputClass}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Collateral Image{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <label className="h-40 rounded-xl border border-dashed border-border/40 flex items-center justify-center cursor-pointer overflow-hidden bg-muted/10 hover:bg-muted/20 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              uploadCollateral(e.target.files?.[0] || null)
                            }
                          />
                          {formData.collateralImageUrl ? (
                            <img
                              src={formData.collateralImageUrl}
                              alt="Collateral"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                              <ImagePlus className="w-4 h-4" />
                              {isUploading ? "Uploading..." : "Upload image"}
                            </div>
                          )}
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {step === 4 && (
                  <Card className="rounded-2xl border-border/40 bg-card/70 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                    <CardContent className="p-5 space-y-3 text-sm">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90 pb-1 border-b border-border/40">
                        <ListChecks className="w-4 h-4 text-primary" />
                        Review & Submit
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lender</span>
                        <span className="font-medium">
                          {tenants.find((t) => t.id === formData.tenantId)
                            ?.name || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-medium">
                          NPR{" "}
                          {Number(formData.requestedAmount || 0).toLocaleString(
                            "en-IN",
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Term</span>
                        <span className="font-medium">
                          <CalendarClock className="w-3.5 h-3.5 inline mr-1 text-primary" />
                          {formData.requestedTermMonths} months
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Purpose</span>
                        <span className="font-medium">{formData.purpose}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Collateral
                        </span>
                        <span className="font-medium">
                          {formData.collateralType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Image</span>
                        <span className="font-medium inline-flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-500" />{" "}
                          Uploaded
                        </span>
                      </div>
                    </CardContent>
                  </Card>
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
                    disabled={step === 1 || isProcessingBlockchain}
                    className="h-11 rounded-xl"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  {step < 4 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={isProcessingBlockchain}
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
                      {isProcessingBlockchain
                        ? "Processing..."
                        : "Submit Application"}
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
