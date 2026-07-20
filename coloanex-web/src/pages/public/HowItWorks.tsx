import { useNavigate } from "react-router-dom";
import PublicLayout from "@/components/layouts/PublicLayout";
import { PageShell } from "@/components/shared/PageShell";
import { useRevealOnView } from "@/hooks/useReveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  UserPlus,
  WalletCards,
  ShieldCheck,
  FileSignature,
  Banknote,
  Link2,
} from "lucide-react";

interface HowItWorksProps {
  showHeader?: boolean;
  showFooter?: boolean;
  isSubcomponent?: boolean;
}

const steps = [
  {
    n: "01",
    title: "Create your account",
    desc: "Sign up as a lender institution or borrower. Lenders configure an organization workspace; borrowers prepare a personal profile.",
    icon: UserPlus,
  },
  {
    n: "02",
    title: "Connect payments and plan",
    desc: "Attach eSewa or Khalti credentials and choose a subscription plan when you need platform-sponsored gas for on-chain writes.",
    icon: WalletCards,
  },
  {
    n: "03",
    title: "Complete KYC",
    desc: "Borrowers submit identity documents and selfies. Lenders review and approve verification before credit can move.",
    icon: ShieldCheck,
  },
  {
    n: "04",
    title: "Publish rules and apply",
    desc: "Lenders publish eligibility and pricing rules. Borrowers discover lenders, open applications, and attach required details.",
    icon: FileSignature,
  },
  {
    n: "05",
    title: "Contract and disburse",
    desc: "Approved loans produce contracts and schedules. Funds move through your configured rails with clear status tracking.",
    icon: Banknote,
  },
  {
    n: "06",
    title: "Repay and settle on-chain",
    desc: "Installments are collected via gateways. When blockchain is enabled, loan, KYC, and payment events follow your gas mode policy.",
    icon: Link2,
  },
];

export default function HowItWorks({
  showHeader = true,
  showFooter = true,
  isSubcomponent = false,
}: HowItWorksProps) {
  const navigate = useNavigate();
  const ref = useRevealOnView();

  const content = (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        "relative text-foreground",
        isSubcomponent ? "py-16 sm:py-20 md:py-28" : "pt-24 pb-20",
      )}
    >
      <PageShell className="relative z-10">
        <div className="max-w-2xl mx-auto text-center mb-10 sm:mb-14 md:mb-16">
          <p
            data-reveal
            className="text-xs font-bold uppercase tracking-[0.22em] text-primary mb-3 leading-normal"
          >
            How it works
          </p>
          <h2
            data-reveal
            className="text-2xl sm:text-3xl md:text-5xl font-extrabold font-[family-name:var(--font-headline)] leading-snug mb-4"
          >
            From signup to settled credit
          </h2>
          <p
            data-reveal
            className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed"
          >
            Six steps that mirror how CoLoanEx actually runs — onboarding,
            KYC, underwriting, contracts, repayments, and optional on-chain
            settlement.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-border/60 md:-translate-x-1/2" />

          <div className="space-y-8 sm:space-y-10 md:space-y-12">
            {steps.map((step, i) => {
              const left = i % 2 === 0;
              const Icon = step.icon;
              return (
                <div
                  key={step.n}
                  className={cn(
                    "relative grid md:grid-cols-2 gap-4 md:gap-10 items-stretch",
                  )}
                >
                  <div
                    className={cn(
                      "pl-10 md:pl-0",
                      left ? "md:pr-10 md:text-right" : "md:col-start-2 md:pl-10",
                    )}
                  >
                    <div
                      data-reveal
                      className={cn(
                        "rounded-2xl border border-border/50 bg-card/85 p-5 sm:p-6 h-full",
                        left ? "md:ml-auto" : "",
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center gap-3 mb-3",
                          left ? "md:flex-row-reverse" : "",
                        )}
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                          Step {step.n}
                        </p>
                      </div>
                      <h3
                        className={cn(
                          "text-lg sm:text-xl font-bold text-foreground leading-snug mb-2",
                        )}
                      >
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "hidden md:block",
                      left ? "md:col-start-2" : "md:col-start-1 md:row-start-1",
                    )}
                  />

                  <div className="absolute left-4 md:left-1/2 top-6 md:top-1/2 -translate-x-1/2 md:-translate-y-1/2 z-10">
                    <div className="w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-background" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {!isSubcomponent && (
          <div data-reveal className="mt-12 text-center">
            <Button
              className="rounded-2xl h-12 px-8 font-bold w-full min-[400px]:w-auto"
              onClick={() => navigate("/signup")}
            >
              Start now <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )}
      </PageShell>
    </div>
  );

  if (isSubcomponent) return content;
  return (
    <PublicLayout showHeader={showHeader} showFooter={showFooter}>
      {content}
    </PublicLayout>
  );
}
