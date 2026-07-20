import { lazy, Suspense } from "react";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { PageShell } from "@/components/shared/PageShell";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Bone } from "@/components/shared/Bone";
import { ParallaxLayer } from "@/components/shared/ParallaxLayer";
import { GlassCard } from "@/components/shared/GlassCard";
import { useRevealOnMount } from "@/hooks/useReveal";
import { useGetAllTransactionsQuery } from "@/apis/transactionsApi";
import { Column } from "@/types/components";
import { format } from "date-fns";

const SceneCanvas = lazy(() => import("@/components/shared/SceneCanvas"));

type TxRow = {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  gateway?: string;
};

export default function BorrowerTransactions() {
  const revealRef = useRevealOnMount([]);
  const { data, isLoading } = useGetAllTransactionsQuery();

  const rows: TxRow[] = ((data as any)?.data || data || []).map((tx: any) => ({
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    status: tx.status,
    createdAt: tx.createdAt,
    gateway: tx.paymentDetails?.gateway || tx.gateway,
  }));

  const columns: Column<TxRow>[] = [
    {
      key: "type",
      label: "Type",
      render: (row) => (
        <span className="font-semibold text-foreground">
          {String(row.type).replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (row) => (
        <span className="font-bold text-foreground">
          NPR {Number(row.amount || 0).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "gateway",
      label: "Gateway",
      render: (row) => row.gateway || "—",
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge variant="secondary" className="rounded-lg">
          {row.status}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (row) =>
        row.createdAt ? format(new Date(row.createdAt), "MMM dd, yyyy") : "—",
    },
  ];

  return (
    <BorrowerLayout>
      <div className="relative overflow-hidden min-h-[70vh]">
        <Suspense fallback={null}>
          <SceneCanvas
            variant="panel"
            density={22}
            className="opacity-35 h-[240px]"
          />
        </Suspense>
        <PageShell className="relative z-10 space-y-8 pb-16 pt-6">
          <ParallaxLayer speed={0.2} clamp={100}>
            <SectionHeader
              title="Transactions"
              description="Your payment and disbursement history"
            />
          </ParallaxLayer>
          <Bone name="borrower-transactions" loading={isLoading} minHeight={320}>
            <div ref={revealRef as React.RefObject<HTMLDivElement>} data-reveal>
              <GlassCard className="p-2 sm:p-4 overflow-hidden">
                <DataTable
                  data={rows}
                  columns={columns}
                  isLoading={false}
                  emptyMessage="No transactions yet"
                />
              </GlassCard>
            </div>
          </Bone>
        </PageShell>
      </div>
    </BorrowerLayout>
  );
}
