import { useState, useMemo } from "react";
import { FileText } from "lucide-react";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Pagination } from "@/components/ui/pagination";
import { DataTable } from "@/components/shared/DataTable";
import { Column } from "@/types/components";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import {
  useGetAllTransactionsQuery,
  useGetTransactionsByEntityQuery,
  Transaction,
} from "@/apis/transactionsApi";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

export default function Transactions() {
  const { toast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);

  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const isSuperAdmin = user?.roles?.some(
    (ur: any) => ur.role?.name === "Super Admin",
  );

  const entityId = user?.tenantId || user?.id || "";

  const {
    data: allTransactions,
    isLoading: isLoadingAll,
    refetch: refetchAll,
  } = useGetAllTransactionsQuery(undefined, {
    skip: !isSuperAdmin,
  });

  const {
    data: entityTransactions,
    isLoading: isLoadingEntity,
    refetch: refetchEntity,
  } = useGetTransactionsByEntityQuery(entityId, {
    skip: isSuperAdmin || !entityId,
  });

  const transactions = isSuperAdmin
    ? allTransactions || []
    : entityTransactions || [];
  const isLoading = isSuperAdmin ? isLoadingAll : isLoadingEntity;
  const refetch = isSuperAdmin ? refetchAll : refetchEntity;

  // Calculate To Give and To Receive based on transaction flow
  const { toGive, toReceive } = useMemo(() => {
    let give = 0;
    let receive = 0;

    if (isSuperAdmin) {
      // Super admin sees total system aggregates, maybe Total Volume instead of Give/Receive
      // But if we must compute To Give / To Receive, let's keep it 0 or neutral for super admin
      // since super admin doesn't "give" or "receive" loans unless they are part of a tenant.
      return { toGive: 0, toReceive: 0 };
    }

    transactions.forEach((tx) => {
      if (tx.status !== "COMPLETED") return;
      const amount = Number(tx.amount) || 0;

      const iSent = tx.sentBy === entityId;
      const iReceived = tx.receivedBy === entityId;

      if (iReceived && tx.type === "DISBURSEMENT") {
        give += amount;
      }
      if (
        iSent &&
        (tx.type === "INSTALLMENT_PAYMENT" || tx.type === "PENALTY_PAYMENT")
      ) {
        give -= amount;
      }

      if (iSent && tx.type === "DISBURSEMENT") {
        receive += amount;
      }
      if (
        iReceived &&
        (tx.type === "INSTALLMENT_PAYMENT" || tx.type === "PENALTY_PAYMENT")
      ) {
        receive -= amount;
      }
    });

    return {
      toGive: Math.max(0, give),
      toReceive: Math.max(0, receive),
    };
  }, [transactions, isSuperAdmin, entityId]);

  const MetricCard = ({
    title,
    value,
    color,
    isCurrency = false,
    trend,
  }: any) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-muted-foreground mb-2">
              {title}
            </p>
            <div className="flex items-center gap-1">
              {isCurrency && (
                <IconCurrencyRupeeNepalese
                  className="h-5 w-5"
                  style={{ color }}
                />
              )}
              <h3 className="text-xl font-bold" style={{ color }}>
                {typeof value === "number" ? value.toLocaleString() : value}
              </h3>
            </div>
          </div>
          <div className="w-20 h-10">
            {trend && trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={40}>
                <LineChart data={trend}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={40}>
                <LineChart
                  data={[
                    { value: 0 },
                    { value: 0 },
                    { value: 0 },
                    { value: 0 },
                    { value: 0 },
                    { value: 0 },
                  ]}
                >
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#E5E7EB"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const generateTrend = (baseValue: number, isPositive: boolean = true) => {
    const trend = [];
    if (baseValue <= 0) return trend;
    for (let i = 0; i < 6; i++) {
      const variation = isPositive
        ? Math.floor(baseValue * (0.7 + i * 0.05)) +
          Math.random() * baseValue * 0.1
        : Math.max(
            0,
            Math.floor(baseValue * (1 - i * 0.05)) -
              Math.random() * baseValue * 0.1,
          );
      trend.push({ value: Math.floor(variation) });
    }
    return trend;
  };

  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter((transaction: Transaction) => {
      const matchesSearch =
        searchValue === "" ||
        transaction.type?.toLowerCase().includes(searchValue.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || transaction.status === statusFilter;
      const matchesType =
        typeFilter === "all" || transaction.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });

    filtered.sort((a: Transaction, b: Transaction) => {
      const aValue = a[sortBy as keyof Transaction] ?? "";
      const bValue = b[sortBy as keyof Transaction] ?? "";

      if (aValue === bValue) return 0;
      const comparison = aValue > bValue ? 1 : -1;
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, searchValue, statusFilter, typeFilter, sortBy, sortOrder]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  const transactionColumns: Column<Transaction>[] = [
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (transaction) => (
        <Badge
          variant={
            transaction.type === "DEPOSIT" ||
            transaction.type === "INSTALLMENT_PAYMENT"
              ? "default"
              : "secondary"
          }
        >
          {transaction?.type?.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (transaction) => {
        const isReceived = transaction.receivedBy === entityId;
        const color = isReceived ? "#16A34A" : "#DC2626";
        const sign = isReceived ? "+" : "-";

        if (isSuperAdmin) {
          return (
            <span>
              <IconCurrencyRupeeNepalese className="inline h-4 w-4 mx-0.5" />
              {Number(transaction.amount || 0).toLocaleString()}
            </span>
          );
        }

        return (
          <span className={isReceived ? "text-green-600" : "text-red-600"}>
            {sign}
            <IconCurrencyRupeeNepalese
              className="inline h-4 w-4 mx-0.5"
              style={{ color }}
            />
            {Number(transaction.amount || 0).toLocaleString()}
          </span>
        );
      },
    },
    {
      key: "sentBy",
      label: "Sent By",
      render: (tx) => (
        <div className="text-xs">
          {tx.sentByUser ? (
            <div className="space-y-0.5">
              <div className="font-medium">{tx.sentByUser.fullName}</div>
              <div className="text-muted-foreground">{tx.sentByUser.email}</div>
            </div>
          ) : (
            <span className="break-all truncate max-w-[100px] text-muted-foreground">
              {tx.sentBy}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "receivedBy",
      label: "Received By",
      render: (tx) => (
        <div className="text-xs">
          {tx.receivedByUser ? (
            <div className="space-y-0.5">
              <div className="font-medium">{tx.receivedByUser.fullName}</div>
              <div className="text-muted-foreground">
                {tx.receivedByUser.email}
              </div>
            </div>
          ) : (
            <span className="break-all truncate max-w-[100px] text-muted-foreground">
              {tx.receivedBy}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (transaction) => {
        const statusClasses: Record<string, string> = {
          PENDING:
            "bg-amber-100 dark:bg-amber-600 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
          COMPLETED:
            "bg-green-100 dark:bg-green-600 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800",
          FAILED:
            "bg-red-100 dark:bg-red-600 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800",
          CANCELLED:
            "bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
        };
        return (
          <Badge
            className={
              statusClasses[transaction.status] ||
              "bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
            }
          >
            {transaction.status}
          </Badge>
        );
      },
    },
    {
      key: "blockchainTxHash",
      label: "Blockchain",
      sortable: false,
      render: (transaction) => {
        const hasBlockchainTx =
          !!(transaction as any)?.blockchainTxHash ||
          !!(transaction as any)?.blockchain_tx_hash;
        return (
          <button
            onClick={() => {
              if (hasBlockchainTx) {
                window.open(
                  `https://sepolia.etherscan.io/tx/${(transaction as any).blockchainTxHash || (transaction as any).blockchain_tx_hash}`,
                  "_blank",
                );
              } else {
                toast({
                  title: "Info",
                  description: "This record is stored off-chain only.",
                });
              }
            }}
            className={`px-2 py-1 text-xs rounded-full font-medium transition-colors ${
              hasBlockchainTx
                ? "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer"
                : "bg-gray-100 text-gray-600 cursor-default"
            }`}
          >
            {hasBlockchainTx ? "On-Chain" : "Off-Chain"}
          </button>
        );
      },
    },
    {
      key: "paymentDetails",
      label: "Description",
      render: (transaction) => {
        if (transaction.contract?.contractNumber) {
          return `Contract: ${transaction.contract.contractNumber}`;
        }
        return (
          transaction.paymentDetails?.remarks ||
          (transaction as any).description ||
          "-"
        );
      },
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (transaction) => new Date(transaction.createdAt).toLocaleString(),
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout
        title="Transactions"
        description="View your system transactions"
      >
        <div className="flex items-center justify-center h-64">
          <p>Loading transactions...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Transactions"
      description="View and manage your transactions"
      searchPlaceholder="Search transactions..."
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      actions={[
        {
          label: "Refresh",
          onClick: () => refetch(),
          variant: "outline",
        },
      ]}
      filters={[
        {
          name: "status",
          type: "select",
          label: "Status",
          placeholder: "All Status",
          options: [
            { value: "PENDING", label: "Pending" },
            { value: "COMPLETED", label: "Completed" },
            { value: "FAILED", label: "Failed" },
            { value: "CANCELLED", label: "Cancelled" },
          ],
        },
        {
          name: "type",
          type: "select",
          label: "Type",
          placeholder: "All Types",
          options: [
            { value: "DEPOSIT", label: "Deposit" },
            { value: "WITHDRAW", label: "Withdraw" },
            { value: "TRANSFER", label: "Transfer" },
            { value: "REFUND", label: "Refund" },
            { value: "DISBURSEMENT", label: "Disbursement" },
            { value: "INSTALLMENT_PAYMENT", label: "Installment" },
          ],
        },
      ]}
      filterValues={{ status: statusFilter, type: typeFilter }}
      onFilterChange={(name, value) => {
        if (name === "status") setStatusFilter(value);
        if (name === "type") setTypeFilter(value);
      }}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title={isSuperAdmin ? "Total Volume" : "To Give"}
            value={
              isSuperAdmin
                ? transactions.reduce(
                    (acc, tx) =>
                      acc + (tx.status === "COMPLETED" ? Number(tx.amount) : 0),
                    0,
                  )
                : toGive
            }
            color="#DC2626"
            isCurrency={true}
            trend={generateTrend(isSuperAdmin ? 100 : toGive, false)}
          />
          <MetricCard
            title="To Receive"
            value={toReceive}
            color="#16A34A"
            isCurrency={true}
            trend={generateTrend(toReceive, true)}
          />
          <MetricCard
            title="Total Transactions"
            value={transactions.length}
            color="#059669"
            trend={generateTrend(transactions.length, true)}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
          <DataTable
            columns={transactionColumns}
            data={paginatedTransactions}
            isLoading={false}
            emptyMessage="No transactions found"
            emptyIcon={<FileText className="w-12 h-12 text-muted-foreground" />}
            onSort={handleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
            actions={[]}
          />

          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages || 1}
              hasNextPage={currentPage < totalPages}
              hasPreviousPage={currentPage > 1}
              total={filteredTransactions.length}
              limit={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
