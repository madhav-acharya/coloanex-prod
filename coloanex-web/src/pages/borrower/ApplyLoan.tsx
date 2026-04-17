import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, UploadCloud, Link as LinkIcon, FileText } from "lucide-react";
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
import React from "react";
import { cn } from "@/lib/utils";

export function ApplyLoanModal({ 
  open, 
  onOpenChange,
  defaultTenantId = "",
  isLockedTenant = false
}: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void,
  defaultTenantId?: string,
  isLockedTenant?: boolean
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  
  const [createLoan] = useCreateLoanMutation();
  const { data: tenantsData } = useGetTenantsQuery({ limit: 100, isActive: "true" });
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
    tenantId: defaultTenantId
  });

  const { data: kycsData } = useGetKycsQuery({ 
    userId: user?.id, 
    tenantId: formData.tenantId || undefined, 
    status: KycStatus.VERIFIED 
  }, { skip: !user?.id || !formData.tenantId });

  const blockchainAccess = useMemo(() => getBlockchainAccessSnapshot({
    gasPaymentMode: (user as any)?.gasPaymentMode,
    wallets,
    subscriptions: mySubscriptions,
  }), [user, wallets, mySubscriptions]);

  const shouldUseWalletSignature = blockchainAccess.canRunBlockchain && blockchainAccess.mode === "USER_WALLET";
  const shouldShowBlockchainProcessing = blockchainAccess.canRunBlockchain;

  const [blockchainStep, setBlockchainStep] = useState<"blockchain" | "database" | "complete">("blockchain");
  const [isProcessingBlockchain, setIsProcessingBlockchain] = useState(false);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

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
        variant: "destructive" 
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
            requestedAmount * 100, // scaled
            1200, // default rate or passed in backend
            requestedTermMonths
          );
        } catch (blockchainError: any) {
          setIsProcessingBlockchain(false);
          const errMsg = blockchainError.message || blockchainError.code;
          toast({ title: "Blockchain Error", description: errMsg, variant: "destructive" });
          return;
        }
      }

      if (shouldShowBlockchainProcessing) {
        setBlockchainStep("database");
      }

      const finalPayload = blockchainTxHash && loanId
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
        toast({ title: "Success", description: "Loan request submitted successfully." });
        navigate("/borrower/my-loans");
      }
    } catch (err: any) {
      setIsProcessingBlockchain(false);
      toast({ title: "Error", description: err?.data?.message || "Failed to submit loan request.", variant: "destructive" });
    }
  };

  const isStep1Valid = Boolean(formData.tenantId && formData.requestedAmount);
  const isStep2Valid = Boolean(formData.purpose && formData.requestedTermMonths);
  const isStep3Valid = Boolean(formData.collateralType && formData.collateralDescription && formData.collateralValue);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl p-0 overflow-hidden bg-background border-border/40 shadow-2xl rounded-[2.5rem]">
        <DialogHeader className="sr-only">
           <DialogTitle>Apply for a Loan</DialogTitle>
        </DialogHeader>
        <div className="flex h-[80vh] flex-col p-8 overflow-y-auto w-full space-y-8 relative">
           <div className="flex flex-col gap-2 mb-4">
              <div className="flex flex-col">
                 <h1 className="text-3xl font-bold tracking-tight text-foreground">
                   Apply for a Loan
                 </h1>
                 <p className="text-muted-foreground mt-1">Submit your financing requirements across 3 easy steps.</p>
              </div>
           </div>

         {/* Stepper Header */}
         <div className="mb-8">
            <div className="flex items-center justify-between relative">
               <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full pointer-events-none" />
               <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full transition-all duration-300 pointer-events-none" 
                  style={{ width: `${((step - 1) / 2) * 100}%` }} 
               />
               
               {[1, 2, 3].map((num) => (
                  <div key={num} className="relative z-10 flex flex-col items-center gap-2">
                     <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors",
                        step > num ? "bg-primary border-primary text-primary-foreground" : 
                        step === num ? "bg-background border-primary text-primary" : 
                        "bg-background border-muted text-muted-foreground"
                     )}>
                        {step > num ? "✓" : num}
                     </div>
                     <span className={cn(
                        "text-xs font-medium absolute -bottom-6 w-max text-center",
                        step >= num ? "text-foreground" : "text-muted-foreground"
                     )}>
                        {num === 1 ? (isLockedTenant ? "Amount" : "Lender & Amount") : num === 2 ? "Purpose & Term" : "Collateral"}
                     </span>
                  </div>
               ))}
            </div>
         </div>

         <div className="mt-12">
            {step === 1 && (
               <Card className="border-border/50 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                  <CardContent className="p-8 space-y-6">
                     <h2 className="text-xl font-bold">Step 1: {isLockedTenant ? "Amount" : "Lender & Amount"}</h2>
                     <div className="space-y-4 pt-2">
                        {!isLockedTenant && (
                          <div className="space-y-2">
                            <label className="text-sm font-semibold">Select Lender *</label>
                            <Select name="tenantId" value={formData.tenantId} onValueChange={(val) => handleSelectChange('tenantId', val)}>
                              <SelectTrigger className="h-12 bg-surface/30">
                                <SelectValue placeholder="Choose a lending institution" />
                              </SelectTrigger>
                              <SelectContent>
                                {tenants.map((t: any) => (
                                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div className="space-y-2">
                          <label className="text-sm font-semibold">Requested Amount *</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">NPR</span>
                            <Input
                              type="number"
                              name="requestedAmount"
                              value={formData.requestedAmount}
                              onChange={handleChange}
                              placeholder="e.g., 50000"
                              className="pl-14 h-12 bg-surface/30 font-medium"
                              required
                            />
                          </div>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            )}

            {step === 2 && (
               <Card className="border-border/50 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                  <CardContent className="p-8 space-y-6">
                     <h2 className="text-xl font-bold">Step 2: Term & Purpose</h2>
                     <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold">Loan Term (Months) *</label>
                          <Input
                            type="number"
                            name="requestedTermMonths"
                            value={formData.requestedTermMonths}
                            onChange={handleChange}
                            placeholder="e.g., 12"
                            className="h-12 bg-surface/30"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold">Loan Purpose *</label>
                          <Select name="purpose" value={formData.purpose} onValueChange={(val) => handleSelectChange('purpose', val)}>
                            <SelectTrigger className="h-12 bg-surface/30">
                              <SelectValue placeholder="What will this loan be used for?" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Business Expansion">Business Expansion</SelectItem>
                              <SelectItem value="Equipment Purchase">Equipment Purchase</SelectItem>
                              <SelectItem value="Working Capital">Working Capital</SelectItem>
                              <SelectItem value="Real Estate">Real Estate</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            )}

            {step === 3 && (
               <Card className="border-border/50 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                  <CardContent className="p-8 space-y-6">
                     <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-bold">Step 3: Collateral Details</h2>
                     </div>
                     <p className="text-muted-foreground text-sm">Provide details about the collateral backing this loan.</p>
                     <div className="space-y-4 pt-2">
                        <div className="grid sm:grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <label className="text-sm font-semibold">Collateral Type *</label>
                             <Select name="collateralType" value={formData.collateralType} onValueChange={(val) => handleSelectChange('collateralType', val)}>
                               <SelectTrigger className="h-12 bg-surface/30">
                                 <SelectValue placeholder="e.g., Real Estate" />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="Real Estate">Real Estate</SelectItem>
                                 <SelectItem value="Vehicle">Vehicle</SelectItem>
                                 <SelectItem value="Equipment">Equipment</SelectItem>
                                 <SelectItem value="Inventory">Inventory</SelectItem>
                                 <SelectItem value="Other">Other</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                           <div className="space-y-2">
                             <label className="text-sm font-semibold">Collateral Value *</label>
                             <div className="relative">
                               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">NPR</span>
                               <Input
                                 type="number"
                                 name="collateralValue"
                                 value={formData.collateralValue}
                                 onChange={handleChange}
                                 placeholder="Estimated Value"
                                 className="pl-14 h-12 bg-surface/30 font-medium"
                               />
                             </div>
                           </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold">Description *</label>
                          <Input
                            name="collateralDescription"
                            value={formData.collateralDescription}
                            onChange={handleChange}
                            placeholder="Provide a brief description"
                            className="h-12 bg-surface/30"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-muted-foreground">Proof of Ownership / Images (Optional)</label>
                          <label className="group relative w-full h-32 rounded-xl border-2 border-dashed border-border/60 bg-surface/30 hover:bg-surface-container/50 hover:border-primary/40 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2">
                            <input type="file" className="hidden" />
                            <UploadCloud className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="text-sm font-medium text-foreground">Upload Collateral Images</span>
                          </label>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            )}

            <div className="flex items-center justify-between mt-6 pt-6 border-t border-border/40">
              <Button 
                 variant="outline" 
                 onClick={handlePrev} 
                 disabled={step === 1 || isProcessingBlockchain}
              >
                 <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              
              {step < 3 ? (
                 <Button 
                    onClick={handleNext} 
                    disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
                 >
                    Next Step <ArrowRight className="w-4 h-4 ml-2" />
                 </Button>
              ) : (
                 <Button 
                    onClick={handleSubmit} 
                    disabled={isProcessingBlockchain || !isStep3Valid}
                    className="bg-primary hover:bg-primary/90 min-w-[150px]"
                 >
                    {isProcessingBlockchain ? "Processing..." : "Submit Application"}
                 </Button>
              )}
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
