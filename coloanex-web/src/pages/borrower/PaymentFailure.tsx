import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { XCircle, RotateCcw, LayoutDashboard } from "lucide-react";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function BorrowerPaymentFailure() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const ran = useRef(false);
  const [amount, setAmount] = useState<string | null>(null);
  const [loanId, setLoanId] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const params = new URLSearchParams(window.location.search);
    setLoanId(params.get("loanId"));

    const rawAmount =
      params.get("total_amount") ?? params.get("amount") ?? null;
    if (rawAmount) setAmount(rawAmount);

    toast({
      title: "Repayment Failed",
      description: "Your payment could not be completed. Please try again.",
      variant: "destructive",
    });
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        <div className="rounded-full bg-red-100 dark:bg-red-950 p-6">
          <XCircle className="h-16 w-16 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Payment Failed</h1>
          {amount && (
            <p className="text-xl font-semibold text-muted-foreground flex items-center justify-center gap-1">
              <IconCurrencyRupeeNepalese className="inline h-5 w-5" />
              {Number(amount).toLocaleString()}
            </p>
          )}
          <p className="text-muted-foreground">
            We could not verify your repayment payment. No installment update
            was confirmed.
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <Button
            className="w-full"
            variant="destructive"
            onClick={() =>
              navigate(
                loanId ? `/borrower/repayment/${loanId}` : "/borrower/my-loans",
              )
            }
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/borrower/dashboard")}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
