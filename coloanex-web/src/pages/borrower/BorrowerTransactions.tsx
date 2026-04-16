import { useState, useMemo } from "react";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { useGetAllTransactionsQuery, useGetWalletSummaryQuery } from "@/apis/transactionsApi";
import { format } from "date-fns";
import { Column } from "@/types/components";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Transaction } from "@/apis/transactionsApi";
import { useAuth } from "@/hooks/useAuth";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";

export default function BorrowerTransactions() {
  const { user } = useAuth();
  
  // Wait, there's no pagination supported natively in `useGetAllTransactionsQuery`?
  // Let's implement local pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  const { data: summaryData, isLoading: isLoadingSummary } = useGetWalletSummaryQuery();
  const { data: transactionsData, isLoading: isLoadingTx } = useGetAllTransactionsQuery();

  const transactions = useMemo(() => {
    // filter to only transactions where user is involved if necessary
    // Assuming backend returns only what borrower is allowed to see, if they are restricted
    return Array.isArray(transactionsData) ? transactionsData : [];
  }, [transactionsData]);

  const total = transactions.length;
  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * limit;
    return transactions.slice(start, start + limit);
  }, [transactions, page, limit]);

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">Completed</Badge>;
      case "PENDING":
        return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">Pending</Badge>;
      case "FAILED":
        return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Failed</Badge>;
      case "CANCELLED":
        return <Badge className="bg-gray-500/10 text-gray-500 hover:bg-gray-500/20">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: Column<Transaction>[] = [
    {
      key: "id",
      label: "Tx ID",
      sortable: false,
      render: (tx) => <span className="font-mono text-muted-foreground">{tx.id.substring(0, 8)}...</span>,
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (tx) => format(new Date(tx.createdAt), "MMM dd, yyyy"),
    },
    {
      key: "party",
      label: "Party",
      sortable: false,
      render: (tx) => {
        const isCredit = tx.receivedBy === user?.id;
        const otherParty = isCredit ? tx.sentByUser?.fullName : tx.receivedByUser?.fullName;
        return <span className="text-foreground">{otherParty || 'External Wallet'}</span>;
      },
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (tx) => {
        const isCredit = tx.receivedBy === user?.id;
        return (
          <span className={`font-bold tabular-nums flex items-center ${isCredit ? 'text-emerald-400' : 'text-foreground'}`}>
            {isCredit ? '+' : '-'}
            <IconCurrencyRupeeNepalese className="w-4 h-4 mr-0.5" />
            {Number(tx.amount).toLocaleString('en-IN')}
          </span>
        );
      },
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (tx) => tx.type.replace(/_/g, ' '),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (tx) => getStatusBadge(tx.status),
    },
    {
      key: "hash",
      label: "Hash",
      sortable: false,
      render: (tx) => {
        const hash = tx.gatewayDetails?.gatewayTransactionId;
        if (!hash) return <span className="text-xs text-muted-foreground px-2 py-1 bg-surface-bright rounded-md">Off-chain</span>;
        return (
          <span className="text-xs text-purple-400 font-mono flex items-center gap-1 cursor-pointer hover:underline">
            {hash.substring(0, 10)}... <ArrowUpRight className="w-3 h-3" />
          </span>
        );
      },
    },
  ];

  return (
    <BorrowerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Transactions & Wallet
            </h1>
            <p className="text-muted-foreground mt-1">Manage your funds, view history, and connect your wallet.</p>
          </div>
          <Button className="gap-2">
            <Wallet className="w-4 h-4" />
            Connect Web3 Wallet
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {isLoadingSummary ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-4" />
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card className="bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant/15 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
                <CardContent className="p-6 flex flex-col justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Total Inflow (To Receive)</p>
                  <div className="mt-4 flex items-end justify-between">
                    <p className="text-2xl font-bold text-foreground font-plus-jakarta tracking-tight flex items-center">
                      <IconCurrencyRupeeNepalese className="w-6 h-6 mr-1" />
                      {Number(summaryData?.toReceive || 0).toLocaleString('en-IN')}
                    </p>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 bg-emerald-500/10 text-emerald-400">
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant/15 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-500/10 transition-colors" />
                <CardContent className="p-6 flex flex-col justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Total Outflow (To Give)</p>
                  <div className="mt-4 flex items-end justify-between">
                    <p className="text-2xl font-bold text-foreground font-plus-jakarta tracking-tight flex items-center">
                      <IconCurrencyRupeeNepalese className="w-6 h-6 mr-1" />
                      {Number(summaryData?.toGive || 0).toLocaleString('en-IN')}
                    </p>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 bg-amber-500/10 text-amber-500">
                      <ArrowDownRight className="w-3 h-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant/15 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors" />
                <CardContent className="p-6 flex flex-col justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                  <div className="mt-4 flex items-end justify-between">
                    <p className="text-2xl font-bold text-foreground font-plus-jakarta tracking-tight">
                      {summaryData?.totalTransactions || 0}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Transactions Section */}
        <div className="space-y-4">
           <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pb-2 border-b border-border/40">
              <h2 className="text-xl font-bold">Transaction History</h2>
           </div>

           <Card className="bg-surface-container/30 backdrop-blur-xl border border-outline-variant/15 overflow-hidden">
             <CardContent className="p-0">
                 <DataTable
                   columns={columns}
                   data={paginatedTransactions}
                   isLoading={isLoadingTx}
                 />
             </CardContent>
           </Card>
        </div>
      </div>
    </BorrowerLayout>
  );
}
