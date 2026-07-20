import PublicLayout from "@/components/layouts/PublicLayout";
import { PageShell } from "@/components/shared/PageShell";
import { useRevealOnView } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  Fingerprint,
  KeyRound,
  Lock,
  Server,
  Eye,
} from "lucide-react";

interface SecurityProps {
  showHeader?: boolean;
  showFooter?: boolean;
  isSubcomponent?: boolean;
}

const pillars = [
  {
    icon: ShieldCheck,
    title: "Permissioned access",
    desc: "JWT sessions, role permissions, and tenant scoping on every protected route.",
  },
  {
    icon: Fingerprint,
    title: "KYC integrity",
    desc: "Documented verification with on-chain status updates when blockchain is enabled.",
  },
  {
    icon: KeyRound,
    title: "Gas mode control",
    desc: "Platform sponsorship via subscription or user wallet signing on web — never ambiguous.",
  },
  {
    icon: Lock,
    title: "Encrypted credentials",
    desc: "Payment gateway secrets and wallet material stay server-side with controlled access.",
  },
  {
    icon: Server,
    title: "Tenant isolation",
    desc: "Data and actions stay inside the institution boundary — no cross-tenant leakage.",
  },
  {
    icon: Eye,
    title: "Activity visibility",
    desc: "Operators can review key actions and statuses without guessing what happened.",
  },
];

export default function Security({
  showHeader = true,
  showFooter = true,
  isSubcomponent = false,
}: SecurityProps) {
  const ref = useRevealOnView();

  const content = (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        "relative text-foreground",
        isSubcomponent ? "py-16 sm:py-20 md:py-28" : "pt-24 pb-20",
      )}
    >
      <PageShell className="relative z-10 space-y-10 sm:space-y-12 md:space-y-16">
        <div className="max-w-2xl">
          <p
            data-reveal
            className="text-xs font-bold uppercase tracking-[0.22em] text-primary mb-3 leading-normal"
          >
            Security
          </p>
          <h2
            data-reveal
            className="text-2xl sm:text-3xl md:text-5xl font-extrabold font-[family-name:var(--font-headline)] leading-snug mb-4 sm:mb-5"
          >
            Trust is a product feature
          </h2>
          <p
            data-reveal
            className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed mb-5 max-w-lg"
          >
            Hardened auth, auditable money movement, and blockchain anchoring
            when you need cryptographic finality.
          </p>
          <ul data-reveal className="space-y-2 text-sm text-foreground/85">
            <li>• Role-aware APIs and route guards</li>
            <li>• Clear separation of platform vs user gas</li>
            <li>• Gateway callbacks verified before state changes</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-border/50 bg-card/85 p-4 sm:p-5 md:p-6 flex gap-3 sm:gap-4"
            >
              <div data-reveal className="flex gap-3 sm:gap-4 w-full">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <p.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-foreground mb-1.5 leading-snug text-base sm:text-lg">
                    {p.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
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
