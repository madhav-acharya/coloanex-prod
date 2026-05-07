import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetKycQuery } from "@/apis/kycApi";
import { KycStatus } from "@/types/kyc";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Home,
  ShieldCheck,
  UserCircle2,
  XCircle,
  Upload,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export default function BorrowerKycStatus() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: kyc, isLoading } = useGetKycQuery(id || "", {
    skip: !id,
  });

  const personalD = (kyc?.personalDetails as any) || {};
  const addressD = (kyc?.permanentAddress as any) || {};
  const bankD = (kyc?.bankDetails as any) || {};

  const documents = useMemo(() => {
    if (!kyc?.files) return [];
    const groups: Record<string, any> = {};
    kyc.files.forEach(file => {
      const meta = (file.documentMetadata as any) || {};
      const type = meta.documentType || "Other";
      if (!groups[type]) {
        groups[type] = {
          type,
          number: meta.documentNumber,
          issueDate: meta.issueDate,
          expiryDate: meta.expiryDate,
          issueDistrict: meta.issueDistrict,
          front: null,
          back: null,
        };
      }
      if (file.fileType.includes("FRONT")) groups[type].front = file.fileUrl;
      else if (file.fileType.includes("BACK")) groups[type].back = file.fileUrl;
      else if (file.fileType.includes("PASSPORT")) groups[type].front = file.fileUrl;
      else if (file.fileType.includes("SELFIE")) groups[type].front = file.fileUrl;
      else if (!groups[type].front) groups[type].front = file.fileUrl;
    });
    return Object.values(groups);
  }, [kyc?.files]);

  const statusLabel = useMemo(() => {
    if (!kyc?.status) return "Unknown";
    if (kyc.status === KycStatus.VERIFIED) return "Verified";
    if (kyc.status === KycStatus.PENDING) return "Under Review";
    if (kyc.status === KycStatus.REJECTED) return "Rejected";
    return kyc.status;
  }, [kyc?.status]);

  return (
    <BorrowerLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">KYC Verification Request</h1>
            <p className="text-sm text-muted-foreground">Review your submitted verification details and status</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" onClick={() => navigate(-1)} className="rounded-xl border-border/40 font-bold px-6">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
             </Button>
             {kyc?.status === KycStatus.REJECTED && (
               <Button onClick={() => navigate("/lenders")} className="rounded-xl font-bold px-6 shadow-lg shadow-primary/20">
                  Resubmit KYC
               </Button>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-[200px] w-full rounded-2xl" />
                <Skeleton className="h-[300px] w-full rounded-2xl" />
              </div>
            ) : !kyc ? (
              <Card className="rounded-2xl border-border/30 bg-muted/5 p-12 text-center">
                <p className="text-muted-foreground">Verification request not found.</p>
              </Card>
            ) : (
              <>
                <Card className="rounded-xl border-border bg-card shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
                  <div className="h-1.5 w-full bg-primary/20" />
                  <CardHeader className="flex flex-row items-center gap-3 border-b border-border/30 pb-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                       <UserCircle2 className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-base font-bold text-foreground">Personal & Family Details</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                    <DetailItem label="Full Name" value={kyc.fullName} />
                    <DetailItem label="Gender" value={personalD.gender} />
                    <DetailItem label="Date of Birth" value={new Date(kyc.dateOfBirth).toLocaleDateString()} />
                    <DetailItem label="Marital Status" value={personalD.maritalStatus} />
                    <DetailItem label="Father's Name" value={personalD.fatherName} />
                    <DetailItem label="Mother's Name" value={personalD.motherName} />
                    <DetailItem label="Grandfather's Name" value={personalD.grandfatherName} />
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-border bg-card shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 duration-400">
                  <div className="h-1.5 w-full bg-blue-500/20" />
                  <CardHeader className="flex flex-row items-center gap-3 border-b border-border/30 pb-4">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                       <Home className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-base font-bold text-foreground">Residency Address</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                    <DetailItem label="Province" value={addressD.province} />
                    <DetailItem label="District" value={addressD.district} />
                    <DetailItem label="Municipality" value={addressD.municipality} />
                    <DetailItem label="Ward No." value={addressD.ward} />
                    <DetailItem label="Tole / Village" value={addressD.tole} colSpan={2} />
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-border bg-card shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 duration-500">
                  <div className="h-1.5 w-full bg-emerald-500/20" />
                  <CardHeader className="flex flex-row items-center gap-3 border-b border-border/30 pb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                       <IconCurrencyRupeeNepalese className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-base font-bold text-foreground">Professional & Banking</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                    <DetailItem label="Occupation" value={kyc.occupation} />
                    <DetailItem label="Monthly Income" value={`NPR ${Number(kyc.monthlyIncome).toLocaleString()}`} />
                    <DetailItem label="Bank Name" value={bankD.bankName} />
                    <DetailItem label="Account Number" value={bankD.bankAccountNumber} />
                    <DetailItem label="Branch" value={bankD.bankBranch} colSpan={2} />
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-border bg-card shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 duration-600">
                  <div className="h-1.5 w-full bg-amber-500/20" />
                  <CardHeader className="flex flex-row items-center gap-3 border-b border-border/30 pb-4">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                       <ShieldCheck className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-base font-bold text-foreground">Document Evidence</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-8">
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-6">
                       <DocumentImage label="Passport Photo" src={kyc.photoUrl} />
                       <DocumentImage label="Selfie Verification" src={kyc.files?.find(f => f.fileType === "SELFIE")?.fileUrl} />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-8 pt-8 border-t border-border/30">
                       {documents.map((doc, idx) => (
                         <div key={idx} className="space-y-4">
                            <div className="flex items-center justify-between">
                               <h4 className="font-bold text-sm uppercase tracking-wider text-primary">{doc.type} Details</h4>
                               <Badge variant="outline" className="text-[10px] uppercase font-bold border-primary/30 text-primary">{doc.number || "No Number"}</Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               <DocumentImage label={`${doc.type} Front`} src={doc.front} />
                               {doc.back && <DocumentImage label={`${doc.type} Back`} src={doc.back} />}
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-xs bg-muted/10 p-4 rounded-xl border border-border/30">
                               <div>
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Issue Date</p>
                                  <p className="font-bold text-foreground mt-0.5">{doc.issueDate ? new Date(doc.issueDate).toLocaleDateString() : "N/A"}</p>
                               </div>
                               <div>
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Expiry Date</p>
                                  <p className="font-bold text-foreground mt-0.5">{doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : "N/A"}</p>
                               </div>
                               <div>
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">District</p>
                                  <p className="font-bold text-foreground mt-0.5">{doc.issueDistrict || "N/A"}</p>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="space-y-6 text-foreground">
             <Card className="rounded-xl border-border bg-card shadow-sm sticky top-6 overflow-hidden">
                <CardHeader className="border-b border-border/30 pb-4 bg-muted/5">
                   <CardTitle className="text-base font-bold">Request Status</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-muted/10 border border-border/40 text-center space-y-3">
                       <div className={cn("p-4 rounded-xl bg-card shadow-sm border transition-all duration-500", 
                          kyc?.status === KycStatus.VERIFIED ? "text-emerald-500 border-emerald-100 scale-105" :
                          kyc?.status === KycStatus.REJECTED ? "text-red-500 border-red-100" :
                          "text-amber-500 border-amber-100"
                       )}>
                          {kyc?.status === KycStatus.VERIFIED ? <ShieldCheck className="w-8 h-8" /> :
                           kyc?.status === KycStatus.REJECTED ? <XCircle className="w-8 h-8" /> :
                           <Clock className="w-8 h-8" />}
                       </div>
                      <div className="space-y-1">
                         <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current Status</p>
                          <h3 className={cn("text-xl font-bold uppercase tracking-tight", 
                             kyc?.status === KycStatus.VERIFIED ? "text-emerald-600" :
                             kyc?.status === KycStatus.REJECTED ? "text-red-600" :
                             "text-amber-600"
                          )}>{statusLabel}</h3>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="p-4 rounded-xl border border-border/30 bg-muted/5 space-y-3">
                        <div>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Request ID</p>
                           <p className="text-xs font-mono font-bold truncate text-foreground">{kyc?.id}</p>
                        </div>
                        <div>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Submission Date</p>
                           <p className="text-xs font-bold text-foreground">{kyc?.createdAt ? new Date(kyc.createdAt).toLocaleString() : "N/A"}</p>
                        </div>
                      </div>
                      
                      {kyc?.rejectionReason && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-pulse">
                           <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Rejection Reason</p>
                           <p className="text-xs font-bold text-red-800 mt-1">{kyc.rejectionReason}</p>
                        </div>
                      )}
                   </div>
                </CardContent>
             </Card>
          </div>
        </div>
      </div>
    </BorrowerLayout>
  );
}

function DetailItem({ label, value, colSpan = 1 }: { label: string; value: any; colSpan?: number }) {
  return (
    <div className={cn("space-y-1", colSpan === 2 && "sm:col-span-2")}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground">{value || "N/A"}</p>
    </div>
  );
}

function DocumentImage({ label, src }: { label: string; src?: string }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">{label}</p>
      <div className="aspect-[4/3] rounded-xl border border-border/40 overflow-hidden bg-muted/5 flex items-center justify-center p-1 group">
         {src ? (
           <img src={src} alt={label} className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-500" />
         ) : (
           <div className="flex flex-col items-center gap-2 opacity-40">
              <Upload className="w-6 h-6 text-muted-foreground" />
              <div className="text-[10px] font-bold text-muted-foreground uppercase">No Image</div>
           </div>
         )}
      </div>
    </div>
  );
}
