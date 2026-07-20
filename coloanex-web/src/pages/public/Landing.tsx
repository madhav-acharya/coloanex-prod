import { useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/layouts/PublicLayout";
import {
  ArrowRight,
  ArrowDown,
  Building2,
  Wallet,
  FileCheck2,
  Radio,
  Globe2,
  BadgeCheck,
} from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { StatCounter } from "@/components/shared/StatCounter";
import { useRevealOnMount, useRevealOnView } from "@/hooks/useReveal";
import { useScrollProgress } from "@/hooks/useParallax";
import Features from "./Features";
import HowItWorks from "./HowItWorks";
import Security from "./Security";
import Pricing from "./Pricing";

interface LandingProps {
  isSubcomponent?: boolean;
}

const rails = [
  {
    icon: Building2,
    title: "Institution workspaces",
    desc: "Tenants, roles, and lending rules isolated per organization with audit trails.",
  },
  {
    icon: FileCheck2,
    title: "KYC to contract",
    desc: "Document capture, verification status, and contract generation in one flow.",
  },
  {
    icon: Wallet,
    title: "Repayment rails",
    desc: "eSewa and Khalti collection with installment schedules and receipts.",
  },
  {
    icon: Radio,
    title: "On-chain settlement",
    desc: "Optional EVM writes for loans, KYC, and payments with gas mode control.",
  },
];

export default function Landing({ isSubcomponent = false }: LandingProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const heroRef = useRevealOnMount([]);
  const midRef = useRevealOnView();
  const railsRef = useRevealOnView();
  const progress = useScrollProgress();

  useEffect(() => {
    if (isSubcomponent) return;
    const path = location.pathname;
    const map: Record<string, string> = {
      "/features": "features",
      "/how-it-works": "how-it-works",
      "/security": "security",
      "/pricing": "pricing",
    };
    const id = map[path];
    if (id) {
      const el = document.getElementById(id);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 80);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isSubcomponent, location.pathname]);

  const content = (
    <div id="home" className="text-foreground overflow-x-hidden">
      <div
        className="fixed top-0 left-0 h-[2px] z-[90] bg-primary origin-left"
        style={{ transform: `scaleX(${progress})` }}
      />

      <section
        ref={heroRef as React.RefObject<HTMLElement>}
        id="home"
        className="relative min-h-[100svh] flex items-center border-b border-border/30"
      >
        <div className="pointer-events-none absolute -top-28 -right-16 h-[50vh] w-[50vh] rounded-full bg-primary/12 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-[-12%] left-[-10%] h-[42vh] w-[42vh] rounded-full bg-emerald-600/10 blur-[110px]" />

        <PageShell className="relative z-10 w-full pt-20 pb-28 sm:py-24 md:py-28">
          <div className="max-w-2xl">
            <p
              data-reveal
              className="text-primary font-[family-name:var(--font-headline)] text-3xl min-[360px]:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-snug mb-4 sm:mb-5"
            >
              CoLoanEx
            </p>
            <h1
              data-reveal
              className="text-xl min-[360px]:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-snug mb-4 sm:mb-5"
            >
              Lending infrastructure that settles on-chain.
            </h1>
            <p
              data-reveal
              className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl mb-5 sm:mb-6 leading-relaxed"
            >
              KYC, contracts, repayments, and subscriptions — one protocol for
              institutions and borrowers across Nepal and beyond.
            </p>
            <ul
              data-reveal
              className="hidden min-[400px]:block space-y-2 sm:space-y-2.5 mb-6 sm:mb-8 text-sm md:text-base text-foreground/85"
            >
              <li className="flex gap-2 items-start">
                <BadgeCheck className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0 mt-0.5" />
                Multi-tenant lender workspaces with role permissions
              </li>
              <li className="flex gap-2 items-start">
                <BadgeCheck className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0 mt-0.5" />
                Borrower discovery, applications, and installment capture
              </li>
              <li className="hidden sm:flex gap-2 items-start">
                <BadgeCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                Blockchain anchoring when your policy requires finality
              </li>
            </ul>
            <div data-reveal className="flex flex-col min-[400px]:flex-row flex-wrap gap-2.5 sm:gap-3">
              <Button
                size="lg"
                className="h-11 sm:h-12 md:h-14 px-5 sm:px-7 rounded-2xl font-bold text-sm sm:text-base w-full min-[400px]:w-auto"
                onClick={() => navigate("/signup")}
              >
                Get started <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 sm:h-12 md:h-14 px-5 sm:px-7 rounded-2xl font-bold text-sm sm:text-base w-full min-[400px]:w-auto"
                onClick={() =>
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                See how it works
              </Button>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              document
                .getElementById("services")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="mt-10 sm:mt-14 md:mt-20 hidden sm:inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors"
          >
            Scroll <ArrowDown className="w-4 h-4 animate-bounce" />
          </button>
        </PageShell>
      </section>

      <section
        id="services"
        ref={midRef as React.RefObject<HTMLElement>}
        className="relative py-16 sm:py-20 md:py-28 border-b border-border/30"
      >
        <PageShell className="relative z-10 max-w-3xl">
          <p
            data-reveal
            className="text-xs font-bold uppercase tracking-[0.22em] text-primary mb-3 leading-normal"
          >
            Platform
          </p>
          <h2
            data-reveal
            className="text-2xl sm:text-3xl md:text-5xl font-extrabold font-[family-name:var(--font-headline)] mb-4 sm:mb-5 leading-snug"
          >
            One stack for credit ops
          </h2>
          <p
            data-reveal
            className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed mb-6 sm:mb-8 max-w-md"
          >
            From borrower discovery to disbursement and installment capture —
            with subscription-backed gas sponsorship or user wallet mode on web.
          </p>
          <div data-reveal className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 mb-8">
            {[
              ["Rules engine", "Publish eligibility and pricing"],
              ["Contract desk", "Generate and track signatures"],
              ["Payments", "eSewa / Khalti + receipts"],
              ["Gas modes", "Platform or user wallet"],
            ].map(([t, d]) => (
              <div
                key={t}
                className="rounded-xl border border-border/40 bg-card/80 p-4"
              >
                <p className="font-bold text-sm text-foreground leading-snug">
                  {t}
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {d}
                </p>
              </div>
            ))}
          </div>
          <div data-reveal>
            <Link
              to="/features"
              className="text-sm font-bold text-primary inline-flex items-center gap-1 hover:underline"
            >
              Explore features <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </PageShell>
      </section>

      <section
        ref={railsRef as React.RefObject<HTMLElement>}
        className="relative py-16 sm:py-20 md:py-28 border-b border-border/30"
      >
        <PageShell className="relative z-10">
          <div className="max-w-2xl mb-8 sm:mb-10 md:mb-14">
            <p
              data-reveal
              className="text-xs font-bold uppercase tracking-[0.22em] text-primary mb-3"
            >
              Operating model
            </p>
            <h2
              data-reveal
              className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-[family-name:var(--font-headline)] leading-snug mb-4"
            >
              Built around real lending work
            </h2>
            <p
              data-reveal
              className="text-muted-foreground text-sm sm:text-base leading-relaxed"
            >
              Each module maps to a job your team already does — without
              stitching five vendors together.
            </p>
          </div>
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {rails.map((r) => (
              <div
                key={r.title}
                className="rounded-2xl border border-border/50 bg-card/85 p-4 sm:p-5 md:p-6"
              >
                <div data-reveal>
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 sm:mb-4">
                    <r.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2 leading-snug">
                    {r.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {r.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </PageShell>
      </section>

      <section className="relative py-12 sm:py-16 md:py-24 border-b border-border/30">
        <PageShell className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <StatCounter value={500} suffix="+" label="Institutions" />
          <StatCounter
            value={12000000}
            suffix="+"
            label="API calls / mo"
            format="compact"
          />
          <StatCounter value={99} suffix=".99%" label="Uptime" />
          <div className="rounded-2xl border border-border/50 bg-card/70 p-4 sm:p-5 md:p-7">
            <p className="text-xl sm:text-2xl md:text-4xl font-extrabold text-primary font-[family-name:var(--font-headline)] leading-snug">
              NPR+
            </p>
            <p className="text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-widest text-muted-foreground mt-2 leading-normal">
              Settlements
            </p>
          </div>
        </PageShell>
      </section>

      <section className="relative py-14 sm:py-16 md:py-20 border-b border-border/30">
        <PageShell className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-primary mb-3">
            <Globe2 className="w-5 h-5" />
            <p className="text-xs font-bold uppercase tracking-[0.2em]">
              Nepal-ready, globally extendable
            </p>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-[family-name:var(--font-headline)] leading-snug mb-4">
            Local payment rails. Protocol-grade settlement.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-5 sm:mb-6 max-w-xl">
            Collect in NPR through familiar gateways while keeping loan state,
            KYC status, and repayment events consistent across web and mobile
            borrowers.
          </p>
          <Button
            className="rounded-xl h-11 font-bold w-full min-[400px]:w-auto"
            onClick={() => navigate("/signup")}
          >
            Create your workspace
          </Button>
        </PageShell>
      </section>

      <div id="how-it-works">
        <HowItWorks isSubcomponent />
      </div>
      <div id="features">
        <Features isSubcomponent />
      </div>
      <div id="security">
        <Security isSubcomponent />
      </div>
      <div id="pricing">
        <Pricing isSubcomponent />
      </div>
    </div>
  );

  if (isSubcomponent) return content;
  return <PublicLayout showFooter>{content}</PublicLayout>;
}
