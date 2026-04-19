import { useState } from "react";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, UploadCloud, X, ArrowRight, ArrowLeft, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGetTenantsQuery } from "@/apis/tenantsApi";
import { Tenant } from "@/types/tenant";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
      <DialogContent className="max-w-7xl p-0 overflow-hidden bg-background border-border/60 shadow-card rounded-[2.5rem]">
        <DialogHeader className="sr-only">
           <DialogTitle>Compliance Verification</DialogTitle>
        </DialogHeader>
        <div className="flex h-[80vh] flex-col p-10 bg-background overflow-y-auto w-full space-y-12 relative">
          {/* Header Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10">
                <ShieldAlert className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground uppercase tracking-widest">Compliance Verification</h1>
                <p className="text-sm text-muted-foreground mt-1 font-medium">Verify your organizational or personal identity for protocol access.</p>
              </div>
            </div>
          </div>

        {/* Stepper Header */}
        <div className="max-w-3xl">
           <div className="flex items-center justify-between relative px-4">
              <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-muted rounded-full pointer-events-none" />
              <div 
                 className="absolute left-4 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full transition-all duration-300 pointer-events-none" 
                 style={{ width: `calc(${((step - 1) / 2) * 100}% - 32px)` }} 
              />
              
              {[1, 2, 3].map((num) => (
                 <div key={num} className="relative z-10 flex flex-col items-center gap-3">
                    <div className={cn(
                       "w-10 h-10 rounded-full flex items-center justify-center text-xs font-black border-2 transition-colors shadow-soft",
                       step > num ? "bg-primary border-primary text-primary-foreground" : 
                       step === num ? "bg-background border-primary text-primary" : 
                       "bg-background border-muted text-muted-foreground"
                    )}>
                       {step > num ? "✓" : num}
                    </div>
                    <span className={cn(
                       "text-[10px] font-black uppercase tracking-widest absolute -bottom-6 w-max text-center",
                       step >= num ? "text-foreground" : "text-muted-foreground"
                    )}>
                       {num === 1 ? "Protocol Node" : num === 2 ? "Artifacts" : "Verification"}
                    </span>
                 </div>
              ))}
           </div>
        </div>

        <div className="mt-8">
           {step === 1 && (
              <Card className="border-border/40 shadow-soft bg-surface/30 animate-in fade-in slide-in-from-bottom-2 rounded-3xl">
                 <CardContent className="p-8">
                    <h2 className="text-lg font-black mb-2 uppercase tracking-wider">Select Infrastructure Host</h2>
                    <p className="text-sm text-muted-foreground mb-8 font-medium">Select the lending institution you wish to submit your verification artifacts to.</p>
                    
                    {isLoadingTenants ? (
                       <p className="text-sm text-muted-foreground">Synchronizing nodes...</p>
                    ) : (
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {tenants.map(tenant => (
                             <div 
                               key={tenant.id}
                               onClick={() => setSelectedTenantId(tenant.id)}
                               className={cn(
                                 "p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4",
                                 selectedTenantId === tenant.id 
                                    ? "border-primary bg-primary/5 shadow-soft" 
                                    : "border-border/40 hover:border-primary/20 bg-background"
                               )}
                             >
                                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                                   {tenant.name.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                   <p className="font-bold text-sm truncate">{tenant.name}</p>
                                   <p className="text-xs text-muted-foreground truncate font-medium">{tenant.contactEmail || "Lending Institution"}</p>
                                </div>
                                {selectedTenantId === tenant.id && (
                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                )}
                             </div>
                          ))}
                       </div>
                    )}
                 </CardContent>
              </Card>
           )}

           {step === 2 && (
              <Card className="border-border/40 shadow-soft bg-surface/30 animate-in fade-in slide-in-from-bottom-2 rounded-3xl">
                 <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-lg font-black uppercase tracking-wider">Artifact Submission</h2>
                        <p className="text-sm text-muted-foreground mt-1 font-medium">Upload clean photographic evidence of your government identification.</p>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-none font-black text-xs px-4 py-1.5 rounded-full">{progressPercent}% Sync</Badge>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-8">
                       {/* Front ID */}
                       <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block">
                            Internal Identity (Front)
                          </label>
                          {!frontImage ? (
                            <label className="group relative w-full aspect-[4/3] rounded-3xl border-2 border-dashed border-border/60 bg-background hover:bg-muted/30 hover:border-primary/40 transition-all cursor-pointer flex flex-col items-center justify-center p-6 text-center">
                              <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => setFrontImage(e.target.files?.[0] || null)} />
                              <UploadCloud className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                              <p className="font-bold text-xs">Upload Front</p>
                            </label>
                          ) : (
                            <div className="w-full aspect-[4/3] rounded-3xl border border-primary/30 bg-primary/5 p-4 flex flex-col items-center justify-center text-center relative">
                              <span className="text-xs font-bold truncate w-full mb-2">{frontImage.name}</span>
                              <Button variant="ghost" size="sm" className="h-8 rounded-full text-foreground/60 hover:text-red-500 font-bold text-xs" onClick={() => setFrontImage(null)}>Replace</Button>
                            </div>
                          )}
                       </div>

                       {/* Back ID */}
                       <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block">
                            Internal Identity (Back)
                          </label>
                          {!backImage ? (
                            <label className="group relative w-full aspect-[4/3] rounded-3xl border-2 border-dashed border-border/60 bg-background hover:bg-muted/30 hover:border-primary/40 transition-all cursor-pointer flex flex-col items-center justify-center p-6 text-center">
                              <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => setBackImage(e.target.files?.[0] || null)} />
                              <UploadCloud className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                              <p className="font-bold text-xs">Upload Back</p>
                            </label>
                          ) : (
                            <div className="w-full aspect-[4/3] rounded-3xl border border-primary/30 bg-primary/5 p-4 flex flex-col items-center justify-center text-center relative">
                              <span className="text-xs font-bold truncate w-full mb-2">{backImage.name}</span>
                              <Button variant="ghost" size="sm" className="h-8 rounded-full text-foreground/60 hover:text-red-500 font-bold text-xs" onClick={() => setBackImage(null)}>Replace</Button>
                            </div>
                          )}
                       </div>

                       {/* Selfie */}
                       <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block">
                            Face Liveness
                          </label>
                          {!selfie ? (
                            <label className="group relative w-full aspect-[4/3] rounded-3xl border-2 border-dashed border-border/60 bg-background hover:bg-muted/30 hover:border-primary/40 transition-all cursor-pointer flex flex-col items-center justify-center p-6 text-center">
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => setSelfie(e.target.files?.[0] || null)} />
                              <UploadCloud className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                              <p className="font-bold text-xs">Upload Liveness</p>
                            </label>
                          ) : (
                            <div className="w-full aspect-[4/3] rounded-3xl border border-primary/30 bg-primary/5 p-4 flex flex-col items-center justify-center text-center relative">
                              <span className="text-xs font-bold truncate w-full mb-2">{selfie.name}</span>
                              <Button variant="ghost" size="sm" className="h-8 rounded-full text-foreground/60 hover:text-red-500 font-bold text-xs" onClick={() => setSelfie(null)}>Replace</Button>
                            </div>
                          )}
                       </div>
                    </div>
                 </CardContent>
              </Card>
           )}

           {step === 3 && (
              <Card className="border-border/40 shadow-soft bg-surface/30 animate-in fade-in slide-in-from-bottom-2 rounded-3xl">
                 <CardContent className="p-12 text-center space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                       <ShieldAlert className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-wider">Final Verification Proof</h2>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto font-medium">
                       By submitting these artifacts, you confirm that all information provided is accurate and belongs to the specified identity.
                    </p>
                    <div className="bg-background rounded-2xl p-6 text-left inline-block w-full max-w-sm mt-4 border border-border/40 font-bold">
                       <p className="text-xs flex justify-between items-center"><span className="text-muted-foreground uppercase tracking-widest text-[10px]">Recipient Node:</span> {tenants.find(t => t.id === selectedTenantId)?.name}</p>
                       <div className="h-px bg-border/40 my-3" />
                       <p className="text-xs flex justify-between items-center"><span className="text-muted-foreground uppercase tracking-widest text-[10px]">Artifacts:</span> 3/3 Staged</p>
                    </div>
                 </CardContent>
              </Card>
           )}

           {step === 4 && (
              <Card className="border-border/40 shadow-card bg-surface/30 animate-in zoom-in-95 duration-500 rounded-[3rem]">
                 <CardContent className="p-20 text-center flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-10 shadow-soft">
                       <ShieldAlert className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-black mb-4 uppercase tracking-widest">Protocol Finalized</h2>
                    <p className="text-sm text-muted-foreground max-w-sm mb-12 font-medium leading-relaxed">
                       Your verification artifacts have been securely transmitted to the lending node. The validation cycle is now active.
                    </p>
                    <Button onClick={() => window.location.href = '/borrower/dashboard'} className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm transition-all shadow-soft">
                       Return to Node Dashboard
                    </Button>
                 </CardContent>
              </Card>
           )}

           {step < 4 && (
              <div className="flex items-center justify-between mt-12 pt-8 border-t border-border/40">
                <Button 
                   variant="ghost" 
                   onClick={handlePrev} 
                   className="font-bold text-sm h-12 px-6 rounded-xl hover:bg-muted"
                   disabled={(isLockedTenant && step === 2) || step === 1 || isSubmitting}
                >
                   <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                </Button>
                
                {step < 3 ? (
                   <Button 
                      onClick={handleNext} 
                      className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-black text-sm shadow-soft hover:opacity-95"
                      disabled={(step === 1 && !selectedTenantId) || (step === 2 && !canSubmit)}
                   >
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                   </Button>
                ) : (
                   <Button 
                      onClick={handleSubmit} 
                      disabled={isSubmitting}
                      className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-black text-sm shadow-soft hover:opacity-95"
                   >
                      {isSubmitting ? "Committing..." : "Finalize Verification"}
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
