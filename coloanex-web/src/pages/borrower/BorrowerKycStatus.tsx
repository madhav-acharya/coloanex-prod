import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetKycQuery } from "@/apis/kycApi";
import { KycStatus } from "@/types/kyc";
import {
  CheckCircle2,
  Clock,
  Home,
  ShieldCheck,
  UserCircle2,
  XCircle,
  Upload,
  ChevronLeft,
  Building2,
  Calendar,
  Layers
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface KycDetails {
  gender?: string;
  maritalStatus?: string;
  fatherName?: string;
  motherName?: string;
  grandfatherName?: string;
}

interface AddressDetails {
  province?: string;
  district?: string;
  municipality?: string;
  ward?: string;
  tole?: string;
}

interface BankDetails {
  bankName?: string;
  bankBranch?: string;
  bankAccountNumber?: string;
}

export default function BorrowerKycStatus() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: kyc, isLoading } = useGetKycQuery(id || "", { skip: !id });

  const personalD = (kyc?.personalDetails as unknown as KycDetails) || {};
  const addressD = (kyc?.permanentAddress as unknown as AddressDetails) || {};
  const bankD = (kyc?.bankDetails as unknown as BankDetails) || {};

  const documents = useMemo(() => {
    if (!kyc?.files) return [];
    const groups: Record<string, any> = {};
    kyc.files.forEach(file => {
      const meta = (file.documentMetadata as Record<string, any>) || {};
      const type = (meta.documentType as string) || "Other";
      if (!groups[type]) {
        groups[type] = { 
          type, 
          number: meta.documentNumber as string, 
          issueDate: meta.issueDate as string, 
          expiryDate: meta.expiryDate as string, 
          issueDistrict: meta.issueDistrict as string, 
          front: null as string | null, 
          back: null as string | null 
        };
      }
      if (file.fileType.includes("FRONT") || file.fileType.includes("PASSPORT") || file.fileType.includes("SELFIE")) groups[type].front = file.fileUrl;
      else if (file.fileType.includes("BACK")) groups[type].back = file.fileUrl;
      else if (!groups[type].front) groups[type].front = file.fileUrl;
    });
    return Object.values(groups);
  }, [kyc?.files]);

  const getStatusConfig = (status?: KycStatus) => {
    if (status === KycStatus.VERIFIED) return { icon: ShieldCheck, className: "bg-emerald-50 text-emerald-600 ring-emerald-500/20", label: "Identity Verified" };
    if (status === KycStatus.REJECTED) return { icon: XCircle, className: "bg-rose-50 text-rose-600 ring-rose-500/20", label: "Request Denied" };
    return { icon: Clock, className: "bg-amber-50 text-amber-600 ring-amber-500/20", label: "In Review" };
  };

  const statusTheme = getStatusConfig(kyc?.status);

  return (
    <BorrowerLayout>
      <div className="max-w-7xl mx-auto space-y-10 pb-12">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-8 mt-4">
          <div className="space-y-2">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer uppercase tracking-widest">
              <ChevronLeft className="w-4 h-4" /> Go Back
            </button>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Identity Report</h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-0.5">Verification ID {id?.slice(0,12)}</p>
          </div>
          {kyc?.status === KycStatus.REJECTED && (
            <Button onClick={() => navigate("/lenders")} className="rounded-xl h-11 px-6 font-semibold bg-rose-600 hover:bg-rose-700">
               Repair Verification
            </Button>
          )}
        </section>

        {isLoading ? (
          <div className="grid lg:grid-cols-12 gap-8"><Skeleton className="lg:col-span-8 h-96 rounded-2xl bg-muted/40" /></div>
        ) : !kyc ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-40"><ShieldCheck className="w-12 h-12 mb-4" /><p className="font-bold uppercase tracking-widest text-sm">Artifact not found</p></div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-8 space-y-8">
              <section className="bg-background border border-border/60 rounded-2xl p-8 shadow-sm">
                 <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60 mb-8 flex items-center gap-2">
                    <UserCircle2 className="w-4 h-4" /> Personal Record
                 </h3>
                 <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                    <DataPoint label="Legal Full Name" value={kyc.fullName} />
                    <DataPoint label="Birth Date" value={format(new Date(kyc.dateOfBirth), "MMM dd, yyyy")} />
                    <DataPoint label="Gender" value={personalD.gender} />
                    <DataPoint label="Marital Status" value={personalD.maritalStatus} />
                    <DataPoint label="Father's Name" value={personalD.fatherName} />
                    <DataPoint label="Grandfather" value={personalD.grandfatherName} />
                 </div>
              </section>

              <section className="bg-background border border-border/60 rounded-2xl p-8 shadow-sm">
                 <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60 mb-8 flex items-center gap-2">
                    <Home className="w-4 h-4" /> Permanent Domicile
                 </h3>
                 <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                    <DataPoint label="Province" value={addressD.province} />
                    <DataPoint label="District" value={addressD.district} />
                    <DataPoint label="Municipality" value={addressD.municipality} />
                    <DataPoint label="Ward" value={addressD.ward} />
                    <DataPoint label="Tole / Address" value={addressD.tole} colSpan={2} />
                 </div>
              </section>

              <section className="bg-background border border-border/60 rounded-2xl p-8 shadow-sm">
                 <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60 mb-8 flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> Financial Data
                 </h3>
                 <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                    <DataPoint label="Occupation" value={kyc.occupation} />
                    <DataPoint label="Monthly Capacity" value={`NPR ${Number(kyc.monthlyIncome).toLocaleString()}`} />
                    <DataPoint label="Bank Partner" value={bankD.bankName} />
                    <DataPoint label="Registered Account" value={bankD.bankAccountNumber} colSpan={3} />
                 </div>
              </section>

              <section className="bg-background border border-border/60 rounded-2xl p-8 shadow-sm">
                 <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60 mb-8 flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Identity Artifacts
                 </h3>
                 <div className="grid sm:grid-cols-2 gap-8">
                    <ImageArtifact label="Official Portrait" src={kyc.photoUrl} />
                    {documents.map((doc, i) => (
                       <div key={i} className="space-y-6 sm:col-span-2 bg-muted/5 p-6 rounded-xl border border-border/40">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary">{doc.type} Evidence</p>
                          <div className="grid sm:grid-cols-2 gap-6">
                             <ImageArtifact small label="Front Surface" src={doc.front} />
                             {doc.back && <ImageArtifact small label="Reverse Surface" src={doc.back} />}
                          </div>
                          <div className="pt-4 border-t border-border/40 flex flex-wrap gap-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                             <span>Doc No: <span className="text-foreground">{doc.number || "N/A"}</span></span>
                             <span>Dist: <span className="text-foreground">{doc.issueDistrict || "N/A"}</span></span>
                             <span>Exp: <span className="text-foreground">{doc.expiryDate ? format(new Date(doc.expiryDate), "MMM dd, yyyy") : "None"}</span></span>
                          </div>
                       </div>
                    ))}
                 </div>
              </section>
            </div>

            <div className="lg:col-span-4 space-y-6">
               <div className={cn("p-8 rounded-2xl border border-border/60 shadow-sm text-center space-y-6", statusTheme.className)}>
                  <div className="inline-flex w-14 h-14 rounded-xl bg-background border border-current/10 items-center justify-center shadow-sm">
                     <statusTheme.icon className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Verification State</p>
                     <h3 className="text-xl font-bold uppercase tracking-tight">{statusTheme.label}</h3>
                  </div>
                  <div className="pt-4 border-t border-current/10">
                     <p className="text-xs font-semibold leading-relaxed opacity-80">This profile timestamped on {format(new Date(kyc.createdAt), "MMM dd, hh:mm a")}</p>
                  </div>
               </div>

               {kyc.rejectionReason && (
                 <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5"><XCircle className="w-3 h-3" /> System Outlier Found</p>
                    <p className="text-sm font-semibold leading-relaxed">{kyc.rejectionReason}</p>
                 </div>
               )}

               <div className="bg-background border border-border/60 rounded-2xl p-6 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                     <ShieldCheck className="w-4 h-4" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Digital Assurance</span>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed">Identity profiles on CoLoanEx are encrypted before storage. Once verified, this profile serves as a trust-anchor for all marketplace facilities.</p>
               </div>
            </div>
          </div>
        )}
      </div>
    </BorrowerLayout>
  );
}

function DataPoint({ label, value, colSpan = 1 }: { label: string; value: any; colSpan?: number }) {
  return (
    <div className={cn("space-y-1", colSpan === 2 && "sm:col-span-2", colSpan === 3 && "sm:col-span-3")}>
       <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">{label}</p>
       <p className="text-base font-bold text-foreground break-words">{value || "—"}</p>
    </div>
  );
}

function ImageArtifact({ label, src, small }: { label: string; src?: string; small?: boolean }) {
  return (
    <div className="space-y-3">
       <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">{label}</p>
       <div className={cn("rounded-xl border border-border/40 bg-muted/10 overflow-hidden flex items-center justify-center shadow-inner", small ? "aspect-video" : "aspect-square")}>
          {src ? (
             <img src={src} alt={label} className="w-full h-full object-cover transition-transform hover:scale-105 duration-700" />
          ) : (
             <div className="flex flex-col items-center gap-2 opacity-20"><Upload className="w-6 h-6" /><span className="text-[9px] font-black uppercase tracking-widest">Awaiting</span></div>
          )}
       </div>
    </div>
  );
}
