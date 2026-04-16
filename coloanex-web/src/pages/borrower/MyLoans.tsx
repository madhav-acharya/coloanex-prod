import { useState, useMemo } from "react";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { PlusCircle, FileText, Activity, Clock, XCircle, CheckCircle2, AlertCircle, Link as LinkIcon, Download, SlidersHorizontal, ArrowUpDown, ChevronDown, Plus } from "lucide-react";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { useGetLoansQuery } from "@/apis/loansApi";
import { DataTable } from "@/components/shared/DataTable";
import { Column } from "@/types/components";
import { Badge } from "@/components/ui/badge";
import { BlockchainStatusBadge } from "@/components/shared/BlockchainStatusBadge";
import type { Loan, LoanQuery } from "@/types/loan";
import { LoanStatus } from "@/types/loan";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { ApplyLoanModal } from "./ApplyLoan";

export default function MyLoans() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showApply, setShowApply] = useState(false);

  const [filters, setFilters] = useState<LoanQuery>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { data: loansData, isLoading, isFetching } = useGetLoansQuery(filters);

  const loans = useMemo(() => loansData?.data || [], [loansData]);
  const total = loansData?.total || 0;

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleSort = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key,
      sortOrder: prev.sortBy === key && prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  const getStatusBadge = (status: LoanStatus) => {
    const statusConfig: Record<LoanStatus, { className: string; label: string }> = {
      [LoanStatus.DRAFT]: { className: "bg-gray-100 text-gray-700 border-gray-200", label: "Draft" },
      [LoanStatus.SUBMITTED]: { className: "bg-blue-100 text-blue-700 border-blue-200", label: "Submitted" },
      [LoanStatus.UNDER_REVIEW]: { className: "bg-amber-100 text-amber-700 border-amber-200", label: "Under Review" },
      [LoanStatus.APPROVED]: { className: "bg-green-100 text-green-700 border-green-200", label: "Approved" },
      [LoanStatus.REJECTED]: { className: "bg-red-100 text-red-700 border-red-200", label: "Rejected" },
      [LoanStatus.CONTRACT_GENERATED]: { className: "bg-purple-100 text-purple-700 border-purple-200", label: "Contract Generated" },
      [LoanStatus.CONTRACT_SIGNED]: { className: "bg-indigo-100 text-indigo-700 border-indigo-200", label: "Contract Signed" },
      [LoanStatus.LOAN_PROVIDED]: { className: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Loan Provided" },
      [LoanStatus.PARTIALLY_PAID]: { className: "bg-orange-100 text-orange-700 border-orange-200", label: "Partially Paid" },
      [LoanStatus.PAID]: { className: "bg-green-100 text-green-700 border-green-200", label: "Paid" },
    };
    const config = statusConfig[status] || statusConfig[LoanStatus.DRAFT];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const columns: Column<Loan>[] = [
    {
      key: "purpose",
      label: "Purpose",
      sortable: false,
      render: (loan) => loan.purpose ? loan.purpose : "N/A",
    },
    {
      key: "requestedAmount",
      label: "Requested Amount",
      sortable: true,
      render: (loan) => (
        <span className="flex items-center gap-1">
          <IconCurrencyRupeeNepalese className="inline h-4 w-4" />
          {Number(loan.requestedAmount).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: "requestedTermMonths",
      label: "Term",
      sortable: true,
      render: (loan) => `${loan.requestedTermMonths} months`,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (loan) => getStatusBadge(loan.status),
    },
    {
      key: "blockchainTxHash",
      label: "Blockchain",
      sortable: false,
      render: (c) => <BlockchainStatusBadge blockchainTxHash={(c as any).blockchainTxHash || (c as any).blockchain_tx_hash} />,
    },
    {
      key: "createdAt",
      label: "Applied On",
      sortable: true,
      render: (loan) => loan.createdAt ? format(new Date(loan.createdAt), "MMM dd, yyyy") : "N/A",
    },
  ];

  return (
    <BorrowerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              My Loans
            </h1>
            <p className="text-muted-foreground text-lg">Track and manage your submitted loan applications</p>
          </div>
          <div className="flex items-center gap-3">
          <Button className="gap-2" onClick={() => setShowApply(true)}>
            <Plus className="w-4 h-4" /> New Loan Request
          </Button>
        </div>
        </div>

        {/* List Section */}
        <Card className="bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant/15">
          <CardContent className="p-0">
            <Card className="border-border/40 shadow-sm bg-surface/50 overflow-hidden">
              <CardContent className="p-0">
                <DataTable
                  columns={columns}
                  data={loans}
                  isLoading={isLoading || isFetching}
                  onSort={handleSort}
                  sortBy={filters.sortBy}
                />
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
      <ApplyLoanModal open={showApply} onOpenChange={setShowApply} />
    </BorrowerLayout>
  );
}
