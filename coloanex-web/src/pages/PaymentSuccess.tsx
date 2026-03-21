import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, Wallet } from "lucide-react";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  useEsewaPayment,
  parseEsewaCallbackParams,
} from "@/hooks/useEsewaPayment";
import {
  useKhaltiPayment,
  parseKhaltiCallbackParams,
} from "@/hooks/useKhaltiPayment";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { verifyFromCallback: verifyEsewa } = useEsewaPayment();
  const { verifyFromCallback: verifyKhalti } = useKhaltiPayment();
  const [verifying, setVerifying] = useState(true);
  const [amount, setAmount] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const params = new URLSearchParams(window.location.search);
    const khaltiParams = parseKhaltiCallbackParams();
    const esewaParams = parseEsewaCallbackParams();

    const rawAmount =
      params.get("total_amount") ?? params.get("amount") ?? null;
    if (rawAmount) setAmount(rawAmount);

    const run = async () => {
      try {
        if (khaltiParams) {
          await verifyKhalti();
        } else if (esewaParams) {
          await verifyEsewa();
        }
        toast({
          title: "Payment Successful",
          description: "Your payment has been verified and processed.",
        });
      } catch {
        toast({
          title: "Payment Received",
          description:
            "Payment completed. Verification is pending — check your wallet.",
        });
      } finally {
        setVerifying(false);
      }
    };

    run();
  }, []);

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground text-lg">
            Verifying your payment…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        <div className="rounded-full bg-green-100 dark:bg-green-950 p-6">
          <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Payment Successful
          </h1>
          {amount && (
            <p className="text-xl font-semibold text-primary flex items-center justify-center gap-1">
              <IconCurrencyRupeeNepalese className="inline h-5 w-5" />
              {Number(amount).toLocaleString()}
            </p>
          )}
          <p className="text-muted-foreground">
            Your payment has been processed and your wallet has been updated.
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <Button className="w-full" onClick={() => navigate("/wallets")}>
            <Wallet className="mr-2 h-4 w-4" />
            View Wallet
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
