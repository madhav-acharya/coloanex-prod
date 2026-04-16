import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useParams } from "react-router-dom";
import { useGetLoanQuery } from "@/apis/loansApi";
import { Skeleton } from "@/components/ui/skeleton";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { BlockchainStatusBadge } from "@/components/shared/BlockchainStatusBadge";
import { format } from "date-fns";
import { FileText, Building2, MapPin, Calendar, CreditCard } from "lucide-react";

export default function LoanDetails() {
  const { loanId } = useParams<{ loanId: string }>();
  const { data: loan, isLoading } = useGetLoanQuery(loanId || "", { skip: !loanId });

  return (
    <BorrowerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div>
              <Link to="/borrower/my-loans" className="text-sm text-primary hover:underline mb-2 block">&larr; Back to My Loans</Link>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Loan Details
              </h1>
           </div>
           {loan && (loan.status === "LOAN_PROVIDED" || loan.status === "CONTRACT_SIGNED") && (
             <Link to={`/borrower/repayment/${loanId}`}>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
                  <CreditCard className="w-4 h-4 mr-2" /> Make Repayment
                </Button>
             </Link>
           )}
        </div>
        
        {isLoading || !loan ? (
           <Card className="bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant/15 p-12 text-center rounded-2xl flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-muted-foreground">Loading loan details...</p>
           </Card>
        ) : (
           <div className="space-y-6">
              <Card className="bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant/15 overflow-hidden">
                 <CardContent className="p-0">
                    <div className="bg-surface-container/50 p-6 sm:p-8 flex items-center justify-between border-b border-border/40">
                       <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                             <FileText className="w-8 h-8" />
                          </div>
                          <div>
                             <h2 className="text-2xl font-bold">{loan.purpose || "Loan Request"}</h2>
                             <p className="text-muted-foreground text-sm font-mono mt-1">ID: {loan.id}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-sm text-muted-foreground mb-1">Status</p>
                          <Badge variant="outline" className="px-3 py-1 font-semibold">
                             {loan.status}
                          </Badge>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border/40">
                       <div className="p-6 sm:p-8 space-y-1">
                          <p className="text-sm text-muted-foreground">Requested Amount</p>
                          <p className="text-2xl font-bold flex items-center">
                             <IconCurrencyRupeeNepalese className="w-5 h-5 mr-1" />
                             {Number(loan.requestedAmount).toLocaleString('en-IN')}
                          </p>
                       </div>
                       <div className="p-6 sm:p-8 space-y-1">
                          <p className="text-sm text-muted-foreground">Approved Amount</p>
                          <p className="text-2xl font-bold flex items-center">
                             <IconCurrencyRupeeNepalese className="w-5 h-5 mr-1" />
                             {loan.approvedAmount ? Number(loan.approvedAmount).toLocaleString('en-IN') : "-"}
                          </p>
                       </div>
                       <div className="p-6 sm:p-8 space-y-1">
                          <p className="text-sm text-muted-foreground">Term</p>
                          <p className="text-2xl font-bold">{loan.requestedTermMonths} months</p>
                       </div>
                       <div className="p-6 sm:p-8 space-y-1">
                          <p className="text-sm text-muted-foreground">Blockchain</p>
                          <div className="mt-2">
                             <BlockchainStatusBadge blockchainTxHash={loan.blockchainTxHash} />
                          </div>
                       </div>
                    </div>
                 </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Collateral Info */}
                 <Card className="bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant/15">
                    <CardContent className="p-6 sm:p-8 space-y-4">
                       <h3 className="text-lg font-bold border-b border-border/40 pb-2">Collateral Details</h3>
                       <div className="space-y-3">
                          <div className="flex justify-between">
                             <span className="text-muted-foreground text-sm">Type</span>
                             <span className="font-medium text-sm">{(loan.collateralDetails as any)?.type || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-muted-foreground text-sm">Estimated Value</span>
                             <span className="font-medium text-sm flex items-center">
                               <IconCurrencyRupeeNepalese className="w-3 h-3 mr-0.5" />
                               {Number((loan.collateralDetails as any)?.value || 0).toLocaleString('en-IN')}
                             </span>
                          </div>
                          <div className="pt-2">
                             <span className="text-muted-foreground text-sm block mb-1">Description</span>
                             <span className="font-medium text-sm">{(loan.collateralDetails as any)?.description || "N/A"}</span>
                          </div>
                       </div>
                    </CardContent>
                 </Card>

                 {/* Lender Info (Tenant) */}
                 <Card className="bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant/15">
                    <CardContent className="p-6 sm:p-8 space-y-4">
                       <h3 className="text-lg font-bold border-b border-border/40 pb-2">Lender Information</h3>
                       {(loan as any).tenant ? (
                          <div className="space-y-4">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                 {(loan as any).tenant.name.charAt(0)}
                               </div>
                               <div>
                                 <p className="font-medium">{(loan as any).tenant.name}</p>
                                 <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3"/> {(loan as any).tenant.contactEmail || "Online"}</p>
                               </div>
                             </div>
                             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Building2 className="w-4 h-4"/> Institutional Lender
                             </div>
                             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4"/> Application Date: {format(new Date(loan.createdAt), "PPP")}
                             </div>
                             <Link to={`/borrower/lenders/${loan.tenantId}`} className="block pt-2">
                               <Button variant="outline" size="sm" className="w-full">View Lender Profile</Button>
                             </Link>
                          </div>
                       ) : (
                          <p className="text-muted-foreground text-sm italic">No lender assigned yet.</p>
                       )}
                    </CardContent>
                 </Card>
              </div>
           </div>
        )}
      </div>
    </BorrowerLayout>
  );
}
