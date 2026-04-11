import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Wallet } from "lucide-react";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usePurchaseSubscriptionMutation } from "@/apis/subscriptionsApi";
import {
  useLookupPaymentMutation,
  useVerifyPaymentMutation,
  type PaymentGateway,
} from "@/apis/paymentsApi";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { BlockchainProcessingModal } from "@/components/ui/blockchain-processing-modal";
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
  const { user } = useSelector((state: RootState) => state.auth);
  const { verifyFromCallback: verifyEsewa } = useEsewaPayment();
  const { verifyFromCallback: verifyKhalti } = useKhaltiPayment();
  const [lookupPayment] = useLookupPaymentMutation();
  const [verifyPayment] = useVerifyPaymentMutation();
  const [purchaseSubscription] = usePurchaseSubscriptionMutation();
  const [verifying, setVerifying] = useState(true);
  const [currentStep, setCurrentStep] = useState<VerifyStep>("gateway");
  const [amount, setAmount] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const params = new URLSearchParams(window.location.search);
    const context = params.get("context");
    let planCode = params.get("planCode");
    let scope = params.get("scope") as "USER" | "TENANT" | null;
    let persistedPlanPrice: number | null = null;
    let tenantIdForPurchase: string | undefined = user?.tenantId || undefined;

    const persistedRaw =
      sessionStorage.getItem("web_pending_subscription_purchase") ||
      localStorage.getItem("web_pending_subscription_purchase");
    if ((!planCode || !scope) && persistedRaw) {
      try {
        const persisted = JSON.parse(persistedRaw) as {
          planCode?: string;
          scope?: "USER" | "TENANT";
          tenantId?: string;
          planPrice?: number;
          ts?: number;
        };
        if (persisted.planCode && persisted.scope) {
          planCode = persisted.planCode;
          scope = persisted.scope;
          tenantIdForPurchase = persisted.tenantId;
        }
        if (
          typeof persisted.planPrice === "number" &&
          persisted.planPrice > 0
        ) {
          persistedPlanPrice = persisted.planPrice;
        }
      } catch {
        // ignore
      }
    }
    const khaltiParams = parseKhaltiCallbackParams();
    const esewaParams = parseEsewaCallbackParams();

    const rawAmount =
      params.get("total_amount") ?? params.get("amount") ?? null;
    const resolvedAmount =
      Number(rawAmount || 0) > 0
        ? Number(rawAmount)
        : (persistedPlanPrice ?? 0);
    if (rawAmount) setAmount(rawAmount);

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
              type: "FEE",
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
          // continue retrying for transient errors
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
            resolvedAmount || storedKhalti?.amount || storedEsewa?.amount || 0;

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

        if (context === "subscription") {
          if (!planCode || !scope) {
            throw new Error("SUBSCRIPTION_CONTEXT_MISSING");
          }

          await purchaseSubscription({
            planCode,
            scope,
            tenantId: scope === "TENANT" ? tenantIdForPurchase : undefined,
            paymentTransactionId: verifyResult.transactionId,
          }).unwrap();

          sessionStorage.removeItem("web_pending_subscription_purchase");
          localStorage.removeItem("web_pending_subscription_purchase");
        }

        setCurrentStep("blockchain");
        await new Promise((resolve) => setTimeout(resolve, 700));

        setCurrentStep("account");
        await new Promise((resolve) => setTimeout(resolve, 500));

        setCurrentStep("done");

        toast({
          title:
            context === "subscription"
              ? "Subscription Activated"
              : "Payment Successful",
          description:
            context === "subscription"
              ? "Your payment was verified and your plan is now active."
              : "Your payment has been verified and recorded.",
        });
      } catch {
        setCurrentStep("done");
        toast({
          title: "Payment Verification Failed",
          description:
            context === "subscription"
              ? "Payment callback received, but we could not verify and activate your subscription. Please retry from pricing."
              : "Payment callback received, but verification failed. Please retry.",
          variant: "destructive",
        });
        navigate(
          context === "subscription"
            ? "/payment/failure?context=subscription"
            : "/payment/failure",
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
        message="Verifying payment, recording on blockchain, and updating your account..."
      />
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
          <Button className="w-full" onClick={() => navigate("/wallet")}>
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
