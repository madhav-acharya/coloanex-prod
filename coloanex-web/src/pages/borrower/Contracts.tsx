import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { PageShell } from "@/components/shared/PageShell";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Bone } from "@/components/shared/Bone";
import { ParallaxLayer } from "@/components/shared/ParallaxLayer";
import { GlassCard } from "@/components/shared/GlassCard";
import { useRevealOnMount } from "@/hooks/useReveal";
import { useGetContractsQuery } from "@/apis/contractsApi";
import { Column } from "@/types/components";
import { format } from "date-fns";

const SceneCanvas = lazy(() => import("@/components/shared/SceneCanvas"));

type ContractRow = {
  id: string;
  contractNumber?: string;
  status: string;
  loanAmount?: number;
  createdAt?: string;
};

export default function BorrowerContracts() {
  const navigate = useNavigate();
  const revealRef = useRevealOnMount([]);
  const { data, isLoading } = useGetContractsQuery({
    page: 1,
    limit: 50,
    sortBy: "createdAt",
    sortOrder: "desc",
  } as any);

  const rows: ContractRow[] = ((data as any)?.data || []).map((c: any) => ({
    id: c.id,
    contractNumber: c.contractNumber,
    status: c.status,
    loanAmount: c.loanAmount,
    createdAt: c.createdAt,
  }));

  const columns: Column<ContractRow>[] = [
    {
      key: "contractNumber",
      label: "Contract",
      render: (row) => (
        <span className="font-semibold text-foreground">
          {row.contractNumber || row.id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "loanAmount",
      label: "Amount",
      render: (row) =>
        `NPR ${Number(row.loanAmount || 0).toLocaleString("en-IN")}`,
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
      label: "Created",
      render: (row) =>
        row.createdAt ? format(new Date(row.createdAt), "MMM dd, yyyy") : "—",
    },
  ];

  return (
    <BorrowerLayout>
      <div className="relative overflow-hidden min-h-[70vh]">
        <Suspense fallback={null}>
          <SceneCanvas
            variant="lattice"
            density={22}
            className="opacity-35 h-[240px]"
          />
        </Suspense>
        <PageShell className="relative z-10 space-y-8 pb-16 pt-6">
          <ParallaxLayer speed={0.2} clamp={100}>
            <SectionHeader
              title="Contracts"
              description="All agreements linked to your loans"
            />
          </ParallaxLayer>
          <Bone name="borrower-contracts" loading={isLoading} minHeight={320}>
            <div ref={revealRef as React.RefObject<HTMLDivElement>} data-reveal>
              <GlassCard className="p-2 sm:p-4 overflow-hidden">
                <DataTable
                  data={rows}
                  columns={columns}
                  isLoading={false}
                  emptyMessage="No contracts yet"
                  onRowClick={(row) => navigate(`/contracts/${row.id}`)}
                />
              </GlassCard>
            </div>
          </Bone>
        </PageShell>
      </div>
    </BorrowerLayout>
  );
}
