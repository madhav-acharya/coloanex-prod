import { useState, useMemo } from "react";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useGetLoanQuery } from "@/apis/loansApi";
import { useCreateTransactionMutation } from "@/apis/transactionsApi";
import { Skeleton } from "@/components/ui/skeleton";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { BlockchainProcessingModal } from "@/components/ui/blockchain-processing-modal";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useGetMyWalletsQuery } from "@/apis/walletsApi";
import { useListMySubscriptionsQuery } from "@/apis/subscriptionsApi";
import { getBlockchainAccessSnapshot } from "@/utils/blockchainAccess";
import { recordPaymentOnBlockchain } from "@/utils/blockchain";
import { ArrowRight, Info, Wallet } from "lucide-react";

export default function MakeRepayment() {
  const { loanId } = useParams<{ loanId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { data: loan, isLoading } = useGetLoanQuery(loanId || "", { skip: !loanId });
  const [createTransaction] = useCreateTransactionMutation();

  const [amount, setAmount] = useState("");
  const [blockchainStep, setBlockchainStep] = useState<"blockchain" | "database" | "complete">("blockchain");
  const [isProcessingBlockchain, setIsProcessingBlockchain] = useState(false);

  const { data: wallets = [] } = useGetMyWalletsQuery();
  const { data: mySubscriptions = [] } = useListMySubscriptionsQuery();
  const blockchainAccess = useMemo(() => getBlockchainAccessSnapshot({
    gasPaymentMode: (user as any)?.gasPaymentMode,
    wallets,
    subscriptions: mySubscriptions,
  }), [user, wallets, mySubscriptions]);

  const shouldUseWalletSignature = blockchainAccess.canRunBlockchain && blockchainAccess.mode === "USER_WALLET";
  const shouldShowBlockchainProcessing = blockchainAccess.canRunBlockchain;
  const contractId = loan?.contract?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contractId) {
      toast({ title: "Error", description: "Loan contract not found. Ensure loan is approved and contract generated.", variant: "destructive" });
      return;
    }
    
    const paymentAmount = Number(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      toast({ title: "Validation Error", description: "Please enter a valid amount to repay.", variant: "destructive" });
      return;
    }

    if (!user?.id || !(loan as any).tenant?.ownerId) {
      toast({ title: "Error", description: "Could not identify sender or receiver.", variant: "destructive" });
      return;
    }

    try {
      if (shouldShowBlockchainProcessing) {
        setIsProcessingBlockchain(true);
        setBlockchainStep("blockchain");
      }

      let blockchainTxHash: string | undefined;
      const paymentId = crypto.randomUUID();

      if (shouldUseWalletSignature) {
        try {
          blockchainTxHash = await recordPaymentOnBlockchain(
            paymentId,
            contractId,
            paymentAmount * 100, // scaled paisa
            "WALLET",
            "blockchain"
          );
        } catch (blockchainError: any) {
          setIsProcessingBlockchain(false);
          toast({ title: "Blockchain Error", description: blockchainError.message || blockchainError.code, variant: "destructive" });
          return;
        }
      }

      if (shouldShowBlockchainProcessing) {
        setBlockchainStep("database");
      }

      await createTransaction({
         contractId: contractId,
         sentBy: user.id,
         receivedBy: (loan as any).tenant.ownerId, // paying the lender
         type: "INSTALLMENT_PAYMENT",
         amount: paymentAmount,
         paymentDetails: {
           gateway: "WALLET",
           transactionId: blockchainTxHash || paymentId
         }
      }).unwrap();

      if (shouldShowBlockchainProcessing) {
        setBlockchainStep("complete");
        setTimeout(() => {
          setIsProcessingBlockchain(false);
          toast({ title: "Success", description: "Repayment successful!" });
          navigate(`/borrower/my-loans/${loanId}`);
        }, 1000);
      } else {
        toast({ title: "Success", description: "Repayment successful!" });
        navigate(`/borrower/my-loans/${loanId}`);
      }

    } catch (err: any) {
      setIsProcessingBlockchain(false);
      toast({ title: "Error", description: err?.data?.message || "Failed to process repayment.", variant: "destructive" });
    }
  };

  return (
    <BorrowerLayout>
      <div className="max-w-3xl mx-auto p-8 py-12">
        <div>
           <Link to={`/borrower/my-loans/${loanId}`} className="text-sm text-primary hover:underline mb-2 block">&larr; Back to Loan Detail</Link>
           <h1 className="text-3xl font-bold tracking-tight text-foreground">
             Make a Repayment
           </h1>
           <p className="text-muted-foreground mt-1">Process a repayment transaction for your active loan securely.</p>
        </div>
        
        {isLoading || !loan ? (
           <Card className="bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant/15 p-12 text-center rounded-2xl flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-muted-foreground">Loading repayment details...</p>
           </Card>
        ) : !loan.contract ? (
           <Card className="bg-surface-container-low/40 backdrop-blur-xl border border-red-500/20 p-12 text-center rounded-2xl flex flex-col items-center justify-center min-h-[400px]">
              <Info className="w-16 h-16 text-amber-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">Contract Pending</h2>
              <p className="text-muted-foreground">There is no active contract generated for this loan yet. You can only make repayments on active loans.</p>
           </Card>
        ) : (
           <form onSubmit={handleSubmit} className="space-y-6">
              <Card className="bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant/15">
                 <CardContent className="p-6 sm:p-8 space-y-6">
                    <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
                       <div>
                          <p className="text-sm text-muted-foreground">Loan Purpose</p>
                          <p className="font-semibold text-lg">{loan.purpose || "Loan Repayment"}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-sm text-muted-foreground">Principal</p>
                          <p className="font-semibold text-lg flex items-center justify-end">
                             <IconCurrencyRupeeNepalese className="w-4 h-4 mr-1"/>
                             {Number(loan.approvedAmount || loan.requestedAmount).toLocaleString('en-IN')}
                          </p>
                       </div>
                    </div>

                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
                       <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                       <div className="text-sm text-muted-foreground">
                          Depending on your smart contract terms, late fees or penalties may apply to this repayment. The exact allocation is calculated on-chain.
                       </div>
                    </div>

                    <div className="space-y-3">
                       <label className="text-sm font-medium">Repayment Amount</label>
                       <div className="relative">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground flex items-center"><IconCurrencyRupeeNepalese className="w-5 h-5"/></span>
                         <Input 
                           type="number"
                           value={amount}
                           onChange={(e) => setAmount(e.target.value)}
                           placeholder="Enter amount to repay..." 
                           className="pl-10 text-lg h-14 bg-surface/50 border-outline-variant/20 rounded-xl font-semibold"
                           required
                         />
                       </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-border/40">
                       <label className="text-sm font-medium">Payment Method</label>
                       <div className="p-4 rounded-xl border-2 border-primary/30 bg-primary/5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                               <Wallet className="w-5 h-5" />
                             </div>
                             <div>
                               <p className="font-semibold text-foreground">Web3 Digital Wallet</p>
                               <p className="text-xs text-muted-foreground">Smart contract execution</p>
                             </div>
                          </div>
                          <div className="w-4 h-4 rounded-full border-4 border-primary bg-surface" />
                       </div>
                    </div>
                 </CardContent>
              </Card>
              
              <Button type="submit" className="w-full h-14 text-lg font-semibold bg-emerald-500 hover:bg-emerald-600">
                 Confirm Payment <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
           </form>
        )}

        <BlockchainProcessingModal
          open={isProcessingBlockchain}
          currentStep={blockchainStep}
          message="Processing Repayment"
        />
      </div>
    </BorrowerLayout>
  );
}
