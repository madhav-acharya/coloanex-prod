import { lazy, Suspense } from "react";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { PageShell } from "@/components/shared/PageShell";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { GlassCard } from "@/components/shared/GlassCard";
import { Bone } from "@/components/shared/Bone";
import { ParallaxLayer } from "@/components/shared/ParallaxLayer";
import { useRevealOnMount } from "@/hooks/useReveal";
import { Button } from "@/components/ui/button";
import {
  useGetNotificationsQuery,
  useMarkAllAsReadMutation,
} from "@/apis/notificationsApi";
import { format } from "date-fns";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const SceneCanvas = lazy(() => import("@/components/shared/SceneCanvas"));

export default function BorrowerActivityLogs() {
  const revealRef = useRevealOnMount([]);
  const { data, isLoading, refetch } = useGetNotificationsQuery({
    limit: 50,
    offset: 0,
  });
  const [markAllRead, { isLoading: marking }] = useMarkAllAsReadMutation();

  const items = Array.isArray(data) ? data : (data as any)?.data || [];

  return (
    <BorrowerLayout>
      <div className="relative overflow-hidden min-h-[70vh]">
        <Suspense fallback={null}>
          <SceneCanvas
            variant="network"
            density={22}
            className="opacity-35 h-[240px]"
          />
        </Suspense>
        <PageShell className="relative z-10 space-y-8 pb-16 pt-6">
          <ParallaxLayer speed={0.2} clamp={100}>
            <SectionHeader
              title="Activity"
              description="Notifications and account activity"
              actions={
                <Button
                  variant="outline"
                  className="rounded-2xl h-11"
                  disabled={marking}
                  onClick={async () => {
                    await markAllRead().unwrap();
                    refetch();
                  }}
                >
                  Mark all read
                </Button>
              }
            />
          </ParallaxLayer>
          <Bone name="borrower-activity-logs" loading={isLoading} minHeight={280}>
            {items.length === 0 ? (
              <GlassCard className="p-10 flex flex-col items-center text-center gap-3">
                <Bell className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No activity yet</p>
              </GlassCard>
            ) : (
              <div
                ref={revealRef as React.RefObject<HTMLDivElement>}
                className="space-y-3"
              >
                {items.map((item: any) => (
                  <GlassCard
                    key={item.id}
                    data-reveal
                    className={cn(
                      "p-4 sm:p-5",
                      !item.isRead && "border-primary/30 bg-primary/5",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {item.title || item.action || "Activity"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.message || item.description || ""}
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-muted-foreground shrink-0">
                        {item.createdAt
                          ? format(new Date(item.createdAt), "MMM dd, HH:mm")
                          : ""}
                      </span>
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
