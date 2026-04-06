import { useState, useMemo } from "react";
import { Plus, FileText } from "lucide-react";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Pagination } from "@/components/ui/pagination";
import { DataTable } from "@/components/shared/DataTable";
import { Column } from "@/types/components";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FormSheet } from "@/components/shared/FormSheet";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import {
  useGetMyWalletQuery,
  useCreateWalletMutation,
} from "@/apis/walletsApi";
import {
  useGetTransactionsByWalletQuery,
  useCreateTransactionMutation,
  Transaction,
  CreateTransactionDto,
} from "@/apis/transactionsApi";

export default function Wallets() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [transactionData, setTransactionData] = useState({
    type: "DEPOSIT" as const,
    amount: "",
    description: "",
  });
  useState<any>(null);

  const { data: wallet, isLoading, refetch } = useGetMyWalletQuery();
  const { data: transactions = [] } = useGetTransactionsByWalletQuery(
    wallet?.id || "",
    {
      skip: !wallet,
    },
  );
  const [createWallet, { isLoading: isCreating }] = useCreateWalletMutation();
  const [createTransaction, { isLoading: isCreatingTransaction }] =
    useCreateTransactionMutation();

  const WalletCard = ({
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
              <ResponsiveContainer width="100%" height="100%">
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
              <ResponsiveContainer width="100%" height="100%">
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

  // Generate trend data for wallet cards
  const generateWalletTrend = (
    baseValue: number,
    isPositive: boolean = true,
  ) => {
    const trend = [];
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
    let filtered = transactions.filter((transaction) => {
      const matchesSearch =
        searchValue === "" ||
        transaction.type?.toLowerCase().includes(searchValue.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || transaction.status === statusFilter;
      const matchesType =
        typeFilter === "all" || transaction.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortBy as keyof Transaction];
      const bValue = b[sortBy as keyof Transaction];

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

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
          variant={transaction.type === "DEPOSIT" ? "default" : "secondary"}
        >
          {transaction?.type?.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (transaction) => (
        <span
          className={
            transaction.type === "DEPOSIT" ? "text-green-600" : "text-red-600"
          }
        >
          {transaction.type === "DEPOSIT" ? "+" : "-"}
          <IconCurrencyRupeeNepalese
            className="inline h-4 w-4 mx-0.5"
            style={{
              color: transaction.type === "DEPOSIT" ? "#16A34A" : "#DC2626",
            }}
          />
          {Number(transaction.amount || 0).toLocaleString()}
        </span>
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
        const hasBlockchainTx = !!(transaction as any)?.blockchainTxHash;
        return (
          <button
            onClick={() => {
              if (hasBlockchainTx) {
                window.open(
                  `https://sepolia.etherscan.io/tx/${(transaction as any).blockchainTxHash}`,
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
      render: (transaction) => transaction.paymentDetails?.remarks || "-",
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (transaction) => new Date(transaction.createdAt).toLocaleString(),
    },
  ];

  const handleCreateWallet = async () => {
    try {
      await createWallet({}).unwrap();
      toast({
        title: "Success",
        description: "Wallet created successfully",
      });
      setCreateDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to create wallet",
        variant: "destructive",
      });
    }
  };

  const handleCreateTransaction = async () => {
    if (!wallet) return;

    try {
      const data: CreateTransactionDto = {
        walletId: wallet.id,
        type: transactionData.type,
        amount: parseFloat(transactionData.amount),
      };

      await createTransaction(data).unwrap();
      toast({
        title: "Success",
        description: "Transaction created successfully",
      });
      setTransactionDialogOpen(false);
      setTransactionData({
        type: "DEPOSIT",
        amount: "",
        description: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to create transaction",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout
        title="Wallet"
        description="Manage your wallet and transactions"
      >
        <div className="flex items-center justify-center h-64">
          <p>Loading wallet...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!wallet) {
    return (
      <DashboardLayout
        title="Wallet"
        description="Manage your wallet and transactions"
      >
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-lg text-muted-foreground">
            You don't have a wallet yet
          </p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Wallet
          </Button>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Wallet</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Create a new wallet to manage your transactions.
              </p>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={isCreating}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateWallet}
                  disabled={isCreating}
                  className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                >
                  {isCreating ? "Creating..." : "Create Wallet"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="My Wallet"
      description="Manage your wallet and transactions"
      searchPlaceholder="Search transactions..."
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      actions={[
        {
          label: "Load Wallet",
          onClick: () => setTransactionDialogOpen(true),
          variant: "default",
        },
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
          <WalletCard
            title="Balance"
            value={wallet.balance}
            color="#16A34A"
            isCurrency={true}
            trend={generateWalletTrend(wallet.balance, true)}
          />
          <WalletCard
            title="Pending Balance"
            value={wallet.pendingBalance || 0}
            color="#F59E0B"
            isCurrency={true}
            trend={generateWalletTrend(wallet.pendingBalance || 0, false)}
          />
          <WalletCard
            title="Total Transactions"
            value={transactions.length}
            color="#059669"
            trend={generateWalletTrend(transactions.length, true)}
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
              totalPages={totalPages}
              hasNextPage={currentPage < totalPages}
              hasPreviousPage={currentPage > 1}
              total={filteredTransactions.length}
              limit={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        </div>

        <FormSheet
          open={transactionDialogOpen}
          onOpenChange={setTransactionDialogOpen}
          title="Load Wallet"
          description="Add funds to your wallet"
          sections={[
            {
              fields: [
                {
                  id: "type",
                  label: "Transaction Type",
                  value: transactionData.type,
                  type: "select",
                  options: [
                    { value: "DEPOSIT", label: "Deposit" },
                    { value: "WITHDRAW", label: "Withdraw" },
                  ],
                  required: true,
                },
                {
                  id: "amount",
                  label: "Amount",
                  value: transactionData.amount,
                  type: "number",
                  placeholder: "Enter amount",
                  required: true,
                },
                {
                  id: "description",
                  label: "Description (Optional)",
                  value: transactionData.description,
                  type: "text",
                  placeholder: "Enter description",
                  required: false,
                },
              ],
            },
          ]}
          onFieldChange={(fieldId, value) => {
            setTransactionData({
              ...transactionData,
              [fieldId]: value,
            });
          }}
          onSubmit={handleCreateTransaction}
          submitText="Load Wallet"
          cancelText="Cancel"
          isSubmitting={isCreatingTransaction}
        />
      </div>
    </DashboardLayout>
  );
}
