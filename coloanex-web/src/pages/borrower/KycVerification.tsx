import { useState } from "react";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, UploadCloud, X, ArrowRight, ArrowLeft, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGetTenantsQuery } from "@/apis/tenantsApi";
import { Tenant } from "@/types/tenant";
import { cn } from "@/lib/utils";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function KycVerificationModal({ 
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
  
  const [step, setStep] = useState(isLockedTenant ? 2 : 1);
  const [selectedTenantId, setSelectedTenantId] = useState<string>(defaultTenantId);
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: tenantsData, isLoading: isLoadingTenants } = useGetTenantsQuery({ limit: 50, isActive: "true" });
  const tenants = tenantsData?.data || [];

  const completedCount = [frontImage, backImage, selfie].filter(Boolean).length;
  const canSubmit = Boolean(frontImage && backImage && selfie);
  const progressPercent = Math.round((completedCount / 3) * 100);

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const handleSubmit = () => {
     setIsSubmitting(true);
     setTimeout(() => {
        setIsSubmitting(false);
        setStep(4); // Success step
     }, 2000);
  };

  const currentStepLabel = step === 1 ? "Select Lender" : step === 2 ? "Upload Documents" : step === 3 ? "Review & Submit" : "Complete";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl p-0 overflow-hidden bg-background border-border/40 shadow-2xl rounded-[2.5rem]">
        <DialogHeader className="sr-only">
           <DialogTitle>KYC Verification</DialogTitle>
        </DialogHeader>
        <div className="flex h-[80vh] flex-col p-8 bg-background overflow-y-auto w-full space-y-8 relative">
          {/* Header Section */}
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                <ShieldAlert className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">KYC Verification</h1>
                <p className="text-muted-foreground mt-1">Complete identity verification for your chosen lender.</p>
              </div>
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
                       {num === 1 ? "Select Lender" : num === 2 ? "Documents" : "Review"}
                    </span>
                 </div>
              ))}
           </div>
        </div>

        <div className="mt-12">
           {step === 1 && (
              <Card className="border-border/50 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                 <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4">Step 1: Choose Your Lender</h2>
                    <p className="text-muted-foreground mb-6">Select the lending institution you wish to submit your KYC documents to.</p>
                    
                    {isLoadingTenants ? (
                       <p className="text-sm text-muted-foreground">Loading lenders...</p>
                    ) : (
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {tenants.map(tenant => (
                             <div 
                               key={tenant.id}
                               onClick={() => setSelectedTenantId(tenant.id)}
                               className={cn(
                                 "p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3",
                                 selectedTenantId === tenant.id 
                                    ? "border-primary bg-primary/5" 
                                    : "border-border/50 hover:border-primary/40 bg-surface/30"
                               )}
                             >
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                                   {tenant.name.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                   <p className="font-semibold truncate">{tenant.name}</p>
                                   <p className="text-xs text-muted-foreground truncate">{tenant.contactEmail || "Online Lender"}</p>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                 </CardContent>
              </Card>
           )}

           {step === 2 && (
              <Card className="border-border/50 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                 <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold">Step 2: Upload Documents</h2>
                      <span className="text-sm font-medium text-primary">{progressPercent}% Complete</span>
                    </div>
                    <p className="text-muted-foreground mb-6">Please upload clear images of your government-issued ID.</p>

                    <div className="space-y-6">
                       {/* Front ID */}
                       <div className="space-y-3">
                          <label className="text-sm font-medium text-foreground flex justify-between">
                            Government ID (Front)
                          </label>
                          {!frontImage ? (
                            <label className="group relative w-full rounded-2xl border-2 border-dashed border-border/60 bg-surface/30 hover:bg-surface-container/50 hover:border-primary/40 transition-all cursor-pointer block">
                              <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => setFrontImage(e.target.files?.[0] || null)} />
                              <div className="p-6 flex flex-col items-center justify-center text-center gap-2">
                                  <UploadCloud className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                  <p className="font-medium text-sm text-foreground">Upload Front ID</p>
                              </div>
                            </label>
                          ) : (
                            <div className="w-full rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-center justify-between">
                              <span className="text-sm font-medium truncate max-w-[200px]">{frontImage.name}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-400" onClick={() => setFrontImage(null)}><X className="w-4 h-4" /></Button>
                            </div>
                          )}
                       </div>

                       {/* Back ID */}
                       <div className="space-y-3">
                          <label className="text-sm font-medium text-foreground flex justify-between">
                            Government ID (Back)
                          </label>
                          {!backImage ? (
                            <label className="group relative w-full rounded-2xl border-2 border-dashed border-border/60 bg-surface/30 hover:bg-surface-container/50 hover:border-primary/40 transition-all cursor-pointer block">
                              <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => setBackImage(e.target.files?.[0] || null)} />
                              <div className="p-6 flex flex-col items-center justify-center text-center gap-2">
                                  <UploadCloud className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                  <p className="font-medium text-sm text-foreground">Upload Back ID</p>
                              </div>
                            </label>
                          ) : (
                            <div className="w-full rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-center justify-between">
                              <span className="text-sm font-medium truncate max-w-[200px]">{backImage.name}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-400" onClick={() => setBackImage(null)}><X className="w-4 h-4" /></Button>
                            </div>
                          )}
                       </div>

                       {/* Selfie */}
                       <div className="space-y-3">
                          <label className="text-sm font-medium text-foreground flex justify-between">
                            Selfie with ID
                          </label>
                          {!selfie ? (
                            <label className="group relative w-full rounded-2xl border-2 border-dashed border-border/60 bg-surface/30 hover:bg-surface-container/50 hover:border-primary/40 transition-all cursor-pointer block">
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => setSelfie(e.target.files?.[0] || null)} />
                              <div className="p-6 flex flex-col items-center justify-center text-center gap-2">
                                  <UploadCloud className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                  <p className="font-medium text-sm text-foreground">Upload Selfie</p>
                              </div>
                            </label>
                          ) : (
                            <div className="w-full rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-center justify-between">
                              <span className="text-sm font-medium truncate max-w-[200px]">{selfie.name}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-400" onClick={() => setSelfie(null)}><X className="w-4 h-4" /></Button>
                            </div>
                          )}
                       </div>
                    </div>
                 </CardContent>
              </Card>
           )}

           {step === 3 && (
              <Card className="border-border/50 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                 <CardContent className="p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                       <ShieldAlert className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">Review Application</h2>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                       You are verifying your identity for the chosen lender. By clicking submit, you agree to our verification terms.
                    </p>
                    <div className="bg-surface/50 rounded-xl p-4 text-left inline-block w-full max-w-sm mt-4 border border-border/50">
                       <p className="text-sm font-medium flex justify-between"><span className="text-muted-foreground">Lender:</span> {tenants.find(t => t.id === selectedTenantId)?.name}</p>
                       <p className="text-sm font-medium flex justify-between mt-2"><span className="text-muted-foreground">Documents:</span> {completedCount}/3 Uploaded</p>
                    </div>
                 </CardContent>
              </Card>
           )}

           {step === 4 && (
              <Card className="border-border/50 shadow-sm animate-in zoom-in-95 duration-500">
                 <CardContent className="p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                       <ShieldAlert className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Submitted Successfully</h2>
                    <p className="text-muted-foreground max-w-sm mb-8">
                       Your KYC documents have been sent to the lender for review. You will be notified once verified!
                    </p>
                    <Button onClick={() => window.location.href = '/borrower/dashboard'} className="gap-2">
                       Return to Dashboard
                    </Button>
                 </CardContent>
              </Card>
           )}

           {step < 4 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-border/40">
                <Button 
                   variant="outline" 
                   onClick={handlePrev} 
                   disabled={(isLockedTenant && step === 2) || step === 1 || isSubmitting}
                >
                   <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                
                {step < 3 ? (
                   <Button 
                      onClick={handleNext} 
                      disabled={(step === 1 && !selectedTenantId) || (step === 2 && !canSubmit)}
                   >
                      Next Step <ArrowRight className="w-4 h-4 ml-2" />
                   </Button>
                ) : (
                   <Button 
                      onClick={handleSubmit} 
                      disabled={isSubmitting}
                      className="bg-primary hover:bg-primary/90"
                   >
                      {isSubmitting ? "Submitting..." : "Submit Verification"}
                   </Button>
                )}
              </div>
           )}
         </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
