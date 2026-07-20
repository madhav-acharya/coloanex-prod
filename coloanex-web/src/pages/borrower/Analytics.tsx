import { lazy, Suspense } from "react";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { PageShell } from "@/components/shared/PageShell";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { StatCard } from "@/components/shared/StatCard";
import { GlassCard } from "@/components/shared/GlassCard";
import { Bone } from "@/components/shared/Bone";
import { ParallaxLayer } from "@/components/shared/ParallaxLayer";
import { useRevealOnMount } from "@/hooks/useReveal";
import {
  useGetBorrowerAnalyticsQuery,
  useGetBorrowerMonthlyLoansQuery,
} from "@/apis/analyticsApi";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { FileText, Wallet, TrendingUp, AlertCircle } from "lucide-react";

const SceneCanvas = lazy(() => import("@/components/shared/SceneCanvas"));

export default function BorrowerAnalytics() {
  const revealRef = useRevealOnMount([]);
  const { data, isLoading } = useGetBorrowerAnalyticsQuery();
  const { data: monthly, isLoading: loadingMonthly } =
    useGetBorrowerMonthlyLoansQuery(6);

  const chartData = (monthly || []).map((item) => ({
    name: item.month,
    loans: Number(item.count || 0),
  }));

  return (
    <BorrowerLayout>
      <div className="relative overflow-hidden min-h-[70vh]">
        <Suspense fallback={null}>
          <SceneCanvas
            variant="prism"
            density={22}
            className="opacity-40 h-[260px]"
          />
        </Suspense>
        <PageShell className="relative z-10 space-y-8 pb-16 pt-6">
          <ParallaxLayer speed={0.2} clamp={100}>
            <SectionHeader
              title="Analytics"
              description="Your borrowing activity and repayment trends"
            />
          </ParallaxLayer>

          <Bone name="borrower-analytics" loading={isLoading} minHeight={200}>
            <div
              ref={revealRef as React.RefObject<HTMLDivElement>}
              className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <div data-reveal>
                <StatCard
                  title="Active Loans"
                  value={data?.activeLoans ?? 0}
                  icon={<FileText className="w-5 h-5" />}
                />
              </div>
              <div data-reveal>
                <StatCard
                  title="Total Borrowed"
                  value={`NPR ${Number(data?.totalBorrowed || 0).toLocaleString("en-IN")}`}
                  icon={<Wallet className="w-5 h-5" />}
                />
              </div>
              <div data-reveal>
                <StatCard
                  title="Total Paid"
                  value={`NPR ${Number(data?.totalPaid || 0).toLocaleString("en-IN")}`}
                  icon={<TrendingUp className="w-5 h-5" />}
                />
              </div>
              <div data-reveal>
                <StatCard
                  title="Overdue"
                  value={data?.overduePayments ?? 0}
                  icon={<AlertCircle className="w-5 h-5" />}
                />
              </div>
            </div>
          </Bone>

          <Bone
            name="borrower-analytics-chart"
            loading={loadingMonthly}
            minHeight={280}
          >
            <GlassCard className="p-4 sm:p-6" data-reveal>
              <h3 className="text-sm font-bold text-foreground mb-4 font-[family-name:var(--font-headline)]">
                Monthly Loan Activity
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="loans"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary) / 0.2)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </Bone>
        </PageShell>
      </div>
    </BorrowerLayout>
  );
}
