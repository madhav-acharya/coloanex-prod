import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { XCircle, RotateCcw, LayoutDashboard } from "lucide-react";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { useToast } from "@/hooks/use-toast";
import { PageShell } from "@/components/shared/PageShell";
import { GlassCard } from "@/components/shared/GlassCard";
import { Bone } from "@/components/shared/Bone";
import { ParallaxLayer } from "@/components/shared/ParallaxLayer";
import { useRevealOnMount } from "@/hooks/useReveal";

const SceneCanvas = lazy(() => import("@/components/shared/SceneCanvas"));

export default function BorrowerPaymentFailure() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const revealRef = useRevealOnMount([]);
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
      <div className="relative overflow-hidden min-h-[70vh]">
        <Suspense fallback={null}>
          <SceneCanvas
            variant="subtle"
            density={22}
            className="opacity-35 h-[280px]"
          />
        </Suspense>
        <PageShell narrow className="relative z-10 flex min-h-[70vh] items-center justify-center pb-16 pt-6">
          <Bone name="borrower-payment-failure" loading={false}>
            <ParallaxLayer speed={0.15} clamp={60}>
              <GlassCard className="w-full max-w-lg p-6 sm:p-10 text-center">
                <div
                  ref={revealRef as React.RefObject<HTMLDivElement>}
                  className="space-y-6"
                  data-reveal
                >
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                    <XCircle className="h-10 w-10 text-destructive" />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight font-[family-name:var(--font-headline)]">
                      Repayment Failed
                    </h1>
                    {amount && (
                      <p className="text-2xl font-bold text-muted-foreground flex items-center justify-center gap-1 tracking-tight">
                        <IconCurrencyRupeeNepalese className="inline h-5 w-5" />
                        {Number(amount).toLocaleString()}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      We could not verify your repayment. No installment update
                      was confirmed.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row pt-2">
                    <Button
                      className="w-full rounded-2xl h-11"
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
                      className="w-full rounded-2xl h-11 border-border"
                      onClick={() => navigate("/borrower/dashboard")}
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Go to Dashboard
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </ParallaxLayer>
          </Bone>
        </PageShell>
      </div>
    </BorrowerLayout>
  );
}
