import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  useLookupPaymentMutation,
  useVerifyPaymentMutation,
  type PaymentGateway,
} from "@/apis/paymentsApi";
import {
  useEsewaPayment,
  parseEsewaCallbackParams,
} from "@/hooks/useEsewaPayment";
import {
  useKhaltiPayment,
  parseKhaltiCallbackParams,
} from "@/hooks/useKhaltiPayment";
import { BlockchainProcessingModal } from "@/components/ui/blockchain-processing-modal";

type VerifyStep = "gateway" | "blockchain" | "account" | "done";

export default function BorrowerPaymentSuccess() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { verifyFromCallback: verifyEsewa } = useEsewaPayment();
  const { verifyFromCallback: verifyKhalti } = useKhaltiPayment();
  const [lookupPayment] = useLookupPaymentMutation();
  const [verifyPayment] = useVerifyPaymentMutation();
  const [verifying, setVerifying] = useState(true);
  const [currentStep, setCurrentStep] = useState<VerifyStep>("gateway");
  const [amount, setAmount] = useState<string | null>(null);
  const [loanId, setLoanId] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const params = new URLSearchParams(window.location.search);
    const resolvedLoanId = params.get("loanId");
    setLoanId(resolvedLoanId);

    const rawAmount =
      params.get("total_amount") ?? params.get("amount") ?? null;
    if (rawAmount) setAmount(rawAmount);

    const khaltiParams = parseKhaltiCallbackParams();
    const esewaParams = parseEsewaCallbackParams();

    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const readStoredPending = (
      sessionKey: string,
      localKey: string,
    ): { transactionUuid?: string; amount?: number } | null => {
      const raw =
        sessionStorage.getItem(sessionKey) || localStorage.getItem(localKey);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as { transactionUuid?: string; amount?: number };
      } catch {
        return null;
      }
    };

    const recoverViaLookupAndVerify = async (
      gateway: PaymentGateway,
      transactionUuid: string,
      totalAmount: number,
      attempts = 12,
    ) => {
      for (let i = 0; i < attempts; i++) {
        try {
          const lookup = await lookupPayment({
            transactionUuid,
            totalAmount,
            gateway,
          }).unwrap();

          if (lookup.alreadyProcessed && lookup.transactionId) {
            return {
              success: true,
              transactionId: lookup.transactionId,
              status: "COMPLETED",
            };
          }

          if (lookup.status === "COMPLETED") {
            const verified = await verifyPayment({
              transactionUuid,
              totalAmount,
              gateway,
              type: "INSTALLMENT_PAYMENT",
              gasPaymentMode: "PLATFORM_WALLET",
              platform: "WEB",
            }).unwrap();

            if (verified?.success && verified.transactionId) {
              return verified;
            }
          }

          if (
            lookup.status === "FAILED" ||
            lookup.status === "EXPIRED" ||
            lookup.status === "REFUNDED"
          ) {
            return { success: false, transactionId: null, status: "FAILED" };
          }
        } catch {
          // keep retrying for transient callback timing issues
        }

        if (i < attempts - 1) {
          await sleep(2000);
        }
      }

      return { success: false, transactionId: null, status: "FAILED" };
    };

    const run = async () => {
      try {
        setCurrentStep("gateway");
        let verifyResult: any = null;

        if (khaltiParams) {
          verifyResult = await verifyKhalti();
        } else if (esewaParams) {
          verifyResult = await verifyEsewa();
        } else {
          verifyResult = await verifyKhalti();
          if (!verifyResult?.success) {
            verifyResult = await verifyEsewa();
          }
        }

        if (!verifyResult?.success || !verifyResult?.transactionId) {
          const storedKhalti = readStoredPending(
            "khalti_pending_payment",
            "khalti_pending_payment_fallback",
          );
          const storedEsewa = readStoredPending(
            "esewa_pending_payment",
            "esewa_pending_payment_fallback",
          );

          const recoveryCandidates: Array<{
            gateway: PaymentGateway;
            tx?: string;
          }> = [
            {
              gateway: "KHALTI",
              tx: khaltiParams?.pidx || storedKhalti?.transactionUuid,
            },
            {
              gateway: "ESEWA",
              tx: esewaParams?.transactionUuid || storedEsewa?.transactionUuid,
            },
          ];

          const recoveryAmount =
            Number(rawAmount || 0) ||
            storedKhalti?.amount ||
            storedEsewa?.amount ||
            0;

          if (recoveryAmount > 0) {
            for (const candidate of recoveryCandidates) {
              if (!candidate.tx) continue;
              const recovered = await recoverViaLookupAndVerify(
                candidate.gateway,
                candidate.tx,
                recoveryAmount,
              );
              if (recovered?.success && recovered?.transactionId) {
                verifyResult = recovered;
                break;
              }
            }
          }
        }

        if (!verifyResult?.success || !verifyResult?.transactionId) {
          throw new Error("PAYMENT_NOT_VERIFIED");
        }

        setCurrentStep("blockchain");
        await new Promise((resolve) => setTimeout(resolve, 650));

        setCurrentStep("account");
        await new Promise((resolve) => setTimeout(resolve, 450));

        setCurrentStep("done");

        toast({
          title: "Repayment Successful",
          description:
            "Payment verified and installment repayment recorded successfully.",
        });
      } catch {
        setCurrentStep("done");
        toast({
          title: "Payment Verification Failed",
          description:
            "Payment callback received but verification failed. Please retry repayment.",
          variant: "destructive",
        });

        navigate(
          `/borrower/payment/failure?context=repayment${resolvedLoanId ? `&loanId=${encodeURIComponent(resolvedLoanId)}` : ""}`,
          { replace: true },
        );
      } finally {
        setVerifying(false);
      }
    };

    run();
  }, []);

  if (verifying) {
    const modalStep =
      currentStep === "gateway"
        ? "blockchain"
        : currentStep === "blockchain"
          ? "blockchain"
          : currentStep === "account"
            ? "database"
            : "complete";

    return (
      <BlockchainProcessingModal
        open
        currentStep={modalStep}
        message="Verifying payment and updating your repayment..."
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        <div className="rounded-full bg-green-100 dark:bg-green-950 p-6">
          <CheckCircle2 className="h-16 w-16 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Repayment Successful
          </h1>
          {amount && (
            <p className="text-xl font-semibold text-primary flex items-center justify-center gap-1">
              <IconCurrencyRupeeNepalese className="inline h-5 w-5" />
              {Number(amount).toLocaleString()}
            </p>
          )}
          <p className="text-muted-foreground">
            Your gateway payment has been verified and the selected installments
            were updated.
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <Button
            className="w-full"
            onClick={() =>
              navigate(
                loanId ? `/borrower/my-loans/${loanId}` : "/borrower/my-loans",
              )
            }
          >
            View Loan Details
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/borrower/dashboard")}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
