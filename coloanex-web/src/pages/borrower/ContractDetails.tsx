import { useParams, useNavigate } from "react-router-dom";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetContractQuery } from "@/apis/contractsApi";
import { 
  FileText, 
  Download, 
  Calendar, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeft,
  Building
} from "lucide-react";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { BlockchainStatusBadge } from "@/components/shared/BlockchainStatusBadge";

export default function ContractDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contract, isLoading } = useGetContractQuery(id || "", {
    skip: !id,
  });

  const money = (value?: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "NPR",
      maximumFractionDigits: 0,
    }).format(value || 0);

  if (isLoading) {
    return (
      <BorrowerLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-32 md:col-span-2" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </BorrowerLayout>
    );
  }

  if (!contract) {
    return (
      <BorrowerLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold">Contract Not Found</h2>
          <p className="text-muted-foreground">The contract you are looking for does not exist or you do not have permission to view it.</p>
          <Button onClick={() => navigate("/my-loans")}>Back to My Loans</Button>
        </div>
      </BorrowerLayout>
    );
  }

  return (
    <BorrowerLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-2" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Contract Details</h1>
            <p className="text-sm text-muted-foreground">Reference Number: {contract.contractNumber}</p>
          </div>
          <div className="flex items-center gap-3">
             {contract.contractPdfUrl && (
               <Button onClick={() => window.open(contract.contractPdfUrl, "_blank")} className="rounded-xl">
                 <Download className="w-4 h-4 mr-2" /> Download PDF
               </Button>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Loan Agreement</CardTitle>
                  <CardDescription>Legal terms and conditions of your loan</CardDescription>
                </div>
                <Badge variant={contract.status === "ACTIVE" ? "default" : "secondary"}>
                  {contract.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground bg-muted/30 p-6 rounded-xl border border-border/40">
                  {contract.termsAndConditions || "Standard terms and conditions apply to this loan agreement."}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/30 pb-2">
                  <span className="text-sm">Principal Amount</span>
                  <span className="font-bold flex items-center gap-1">
                    <IconCurrencyRupeeNepalese className="w-3.5 h-3.5" />
                    {contract.loanAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-border/30 pb-2">
                  <span className="text-sm">Interest Rate</span>
                  <span className="font-bold">{contract.interestRate}% APR</span>
                </div>
                <div className="flex items-center justify-between border-b border-border/30 pb-2">
                  <span className="text-sm">Loan Term</span>
                  <span className="font-bold">{contract.termMonths} Months</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-bold">Total Repayable</span>
                  <span className="text-lg font-bold text-primary flex items-center gap-1">
                    <IconCurrencyRupeeNepalese className="w-4 h-4" />
                    {contract.totalAmountDue.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Signatures</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contract.signatures?.map((sig, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl border border-border/40 bg-muted/20">
                    {sig.signedBy === "BORROWER" ? (
                      <User className="w-5 h-5 text-primary mt-0.5" />
                    ) : (
                      <Building className="w-5 h-5 text-primary mt-0.5" />
                    )}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-tighter">{sig.signedBy}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Signed on {new Date(sig.signedAt).toLocaleString()}</p>
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600 font-bold uppercase">
                        <CheckCircle2 className="w-3 h-3" /> Verified Secure
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Blockchain Registry</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <BlockchainStatusBadge blockchainTxHash={contract.blockchainTxHash} />
                </div>
                <div className="p-3 rounded-xl border border-border/40 bg-emerald-500/5 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Ownership Verified</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    This contract is anchored to the Ethereum blockchain and is legally binding through cryptographic proof.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </BorrowerLayout>
  );
}
