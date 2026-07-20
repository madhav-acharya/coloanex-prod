import PublicLayout from "@/components/layouts/PublicLayout";
import { PageShell } from "@/components/shared/PageShell";
import { useRevealOnView } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";
import {
  Shield,
  Lock,
  Zap,
  BarChart3,
  Smartphone,
  Network,
  Users,
  ScrollText,
  CreditCard,
} from "lucide-react";

interface FeaturesProps {
  showHeader?: boolean;
  showFooter?: boolean;
  isSubcomponent?: boolean;
}

const items = [
  {
    icon: Shield,
    title: "Multi-tenant isolation",
    desc: "Every lender runs in a sealed workspace with scoped roles, permissions, and activity logs.",
    points: ["Tenant scoping", "Role matrices", "Session controls"],
  },
  {
    icon: Lock,
    title: "Immutable loan ledger",
    desc: "Loan, KYC, contract, and payment events can be anchored on EVM registries when enabled.",
    points: ["Status writes", "Hash references", "Audit friendly"],
  },
  {
    icon: Zap,
    title: "Realtime settlement rails",
    desc: "eSewa and Khalti flows with gas mode selection for web operators and platform sponsorship.",
    points: ["Gateway configs", "Installments", "Receipts"],
  },
  {
    icon: BarChart3,
    title: "Portfolio analytics",
    desc: "Borrower and institution dashboards with status breakdowns and monthly trend views.",
    points: ["Loan health", "KYC funnel", "Cashflow views"],
  },
  {
    icon: Smartphone,
    title: "App + web parity",
    desc: "Borrowers complete discovery, KYC, apply, and repay on web with platform gas on app.",
    points: ["Shared APIs", "Consistent UX", "Mobile ready"],
  },
  {
    icon: Network,
    title: "Subscription gas sponsorship",
    desc: "Plans with expiry, usage windows, and limit enforcement for platform wallet mode.",
    points: ["Plan scopes", "Usage caps", "Renewal flows"],
  },
];

const deep = [
  {
    icon: Users,
    title: "Borrower marketplace",
    desc: "Search lenders, review terms, and open applications without leaving the protocol.",
  },
  {
    icon: ScrollText,
    title: "Contract lifecycle",
    desc: "Generate, present, and track contract status alongside repayment schedules.",
  },
  {
    icon: CreditCard,
    title: "Collections desk",
    desc: "Capture repayments, reconcile gateway callbacks, and surface failures clearly.",
  },
];

export default function Features({
  showHeader = true,
  showFooter = true,
  isSubcomponent = false,
}: FeaturesProps) {
  const ref = useRevealOnView();

  const content = (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        "relative text-foreground",
        isSubcomponent ? "py-16 sm:py-20 md:py-28" : "pt-24 pb-20",
      )}
    >
      <PageShell className="relative z-10 space-y-14 sm:space-y-16 md:space-y-20">
        <div className="max-w-2xl">
          <p
            data-reveal
            className="text-xs font-bold uppercase tracking-[0.22em] text-primary mb-3 leading-normal"
          >
            Features
          </p>
          <h2
            data-reveal
            className="text-2xl sm:text-3xl md:text-5xl font-extrabold font-[family-name:var(--font-headline)] leading-snug mb-4"
          >
            Built for operators who ship credit
          </h2>
          <p
            data-reveal
            className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed"
          >
            Every surface maps to a backend capability — tenancy, KYC, loans,
            contracts, payments, and subscriptions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border/50 bg-card/85 p-5 md:p-7"
            >
              <div data-reveal>
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground leading-snug">
                  {item.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                  {item.desc}
                </p>
                <ul className="space-y-1.5">
                  {item.points.map((p) => (
                    <li
                      key={p}
                      className="text-xs font-semibold text-foreground/75 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-8">
          <h3
            data-reveal
            className="text-2xl md:text-3xl font-extrabold font-[family-name:var(--font-headline)] leading-snug"
          >
            Depth where it matters
          </h3>
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
            {deep.map((d) => (
              <div
                key={d.title}
                className="rounded-2xl border border-border/50 bg-card/85 p-5 md:p-6"
              >
                <div data-reveal>
                  <div className="flex items-center gap-2 mb-2 text-primary">
                    <d.icon className="w-4 h-4" />
                    <h4 className="font-bold text-foreground leading-snug">
                      {d.title}
                    </h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {d.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
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
