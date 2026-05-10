import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { XCircle, RotateCcw, LayoutDashboard } from "lucide-react";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
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
    <BorrowerLayout>
      <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4 py-12">
        <div className="w-full rounded-xl border border-border bg-card p-6 text-center shadow-none sm:p-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>

          <div className="mt-5 space-y-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Repayment Failed
            </h1>
            {amount && (
              <p className="text-2xl font-bold text-muted-foreground flex items-center justify-center gap-1 tracking-tight">
                <IconCurrencyRupeeNepalese className="inline h-5 w-5" />
                {Number(amount).toLocaleString()}
              </p>
            )}
            <p className="text-[11px] font-bold text-muted-foreground  tracking-wider leading-relaxed">
              We could not verify your repayment payment. <br /> No installment update was confirmed.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button
              className="w-full"
              variant="destructive"
              onClick={() =>
                navigate(
                  loanId
                    ? `/borrower/repayment/${loanId}`
                    : "/borrower/my-loans",
                )
              }
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              className="w-full border-border bg-muted/20"
              onClick={() => navigate("/borrower/dashboard")}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </BorrowerLayout>
  );
}
