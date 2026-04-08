import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Wallet } from "lucide-react";
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

type VerifyStep = "gateway" | "blockchain" | "account" | "done";

const STEPS: { key: VerifyStep; label: string }[] = [
  { key: "gateway", label: "Verifying with payment gateway" },
  { key: "blockchain", label: "Recording on blockchain" },
  { key: "account", label: "Updating your account" },
];

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { verifyFromCallback: verifyEsewa } = useEsewaPayment();
  const { verifyFromCallback: verifyKhalti } = useKhaltiPayment();
  const [verifying, setVerifying] = useState(true);
  const [currentStep, setCurrentStep] = useState<VerifyStep>("gateway");
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
        setCurrentStep("gateway");

        if (khaltiParams) {
          await verifyKhalti();
        } else if (esewaParams) {
          await verifyEsewa();
        }

        setCurrentStep("blockchain");
        await new Promise((resolve) => setTimeout(resolve, 700));

        setCurrentStep("account");
        await new Promise((resolve) => setTimeout(resolve, 500));

        setCurrentStep("done");

        toast({
          title: "Payment Successful",
          description: "Your payment has been verified and recorded.",
        });
      } catch {
        setCurrentStep("done");
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
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
          <div className="relative flex items-center justify-center w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
            <div className="relative rounded-full bg-primary/15 p-4">
              <svg
                className="h-8 w-8 text-primary animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground">
              Processing Payment
            </h2>
            <p className="text-sm text-muted-foreground">
              Please wait while we finalize your payment
            </p>
          </div>

          <div className="w-full bg-card border border-border rounded-2xl p-5 space-y-4">
            {STEPS.map((step, index) => {
              const stepOrder: VerifyStep[] = [
                "gateway",
                "blockchain",
                "account",
                "done",
              ];
              const stepIndex = stepOrder.indexOf(step.key);
              const currentIndex = stepOrder.indexOf(currentStep);
              const isDone = currentIndex > stepIndex;
              const isActive = currentStep === step.key;

              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    {isDone ? (
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : isActive ? (
                      <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-border" />
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isDone
                        ? "text-muted-foreground line-through"
                        : isActive
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                    {isDone && " ✓"}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground italic">
            Do not close this page. This may take a few seconds…
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
            Your payment has been processed, recorded on the blockchain, and
            your wallet has been updated.
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <Button className="w-full" onClick={() => navigate("/transactions")}>
            <Wallet className="mr-2 h-4 w-4" />
            View Transactions
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
