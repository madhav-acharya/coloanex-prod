import { lazy, Suspense } from "react";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { PageShell } from "@/components/shared/PageShell";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { GlassCard } from "@/components/shared/GlassCard";
import { Bone } from "@/components/shared/Bone";
import { ParallaxLayer } from "@/components/shared/ParallaxLayer";
import { useRevealOnMount } from "@/hooks/useReveal";
import { useGetRulesQuery } from "@/apis/rulesApi";
import { Badge } from "@/components/ui/badge";

const SceneCanvas = lazy(() => import("@/components/shared/SceneCanvas"));

export default function BorrowerRules() {
  const revealRef = useRevealOnMount([]);
  const { data, isLoading } = useGetRulesQuery({
    page: 1,
    limit: 50,
  } as any);

  const rules = (data as any)?.data || [];

  return (
    <BorrowerLayout>
      <div className="relative overflow-hidden min-h-[70vh]">
        <Suspense fallback={null}>
          <SceneCanvas
            variant="subtle"
            density={22}
            className="opacity-35 h-[240px]"
          />
        </Suspense>
        <PageShell className="relative z-10 space-y-8 pb-16 pt-6">
          <ParallaxLayer speed={0.2} clamp={100}>
            <SectionHeader
              title="Lending Rules"
              description="Browse available lending terms across institutions"
            />
          </ParallaxLayer>
          <Bone name="borrower-rules" loading={isLoading} minHeight={280}>
            {rules.length === 0 ? (
              <GlassCard className="p-10 text-center text-muted-foreground text-sm">
                No rules available
              </GlassCard>
            ) : (
              <div
                ref={revealRef as React.RefObject<HTMLDivElement>}
                className="space-y-3"
              >
                {rules.map((rule: any) => (
                  <GlassCard
                    key={rule.id}
                    className="p-5 sm:p-6 space-y-2"
                    data-reveal
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-foreground font-[family-name:var(--font-headline)]">
                        {rule.name || rule.title || "Lending Rule"}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="rounded-lg shrink-0"
                      >
                        {rule.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {rule.description || "Institution lending policy"}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs font-semibold text-muted-foreground pt-1">
                      {rule.maxAmount != null && (
                        <span>
                          Max NPR{" "}
                          {Number(rule.maxAmount).toLocaleString("en-IN")}
                        </span>
                      )}
                      {rule.maxTermMonths != null && (
                        <span>Term {rule.maxTermMonths} mo</span>
                      )}
                      {rule.interestRate != null && (
                        <span>Rate {rule.interestRate}%</span>
                      )}
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </Bone>
        </PageShell>
      </div>
    </BorrowerLayout>
  );
}
