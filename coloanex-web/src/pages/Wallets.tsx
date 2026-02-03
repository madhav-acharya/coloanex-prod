import { useState, useMemo } from "react";
import { Eye, Plus, RefreshCw, FileText } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Pagination } from "@/components/ui/pagination";
import { DataTable } from "@/components/shared/DataTable";
import { Column } from "@/types/components";
import { Badge } from "@/components/ui/badge";
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
import {
  useGetMyWalletQuery,
  useCreateWalletMutation,
  useUpdateWalletBalanceMutation,
  Wallet,
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

  const { data: wallet, isLoading, refetch } = useGetMyWalletQuery();
  const { data: transactions = [] } = useGetTransactionsByWalletQuery(
    wallet?.id || "",
    {
      skip: !wallet,
    },
  );
  const [createWallet, { isLoading: isCreating }] = useCreateWalletMutation();
  const [updateBalance, { isLoading: isUpdating }] =
    useUpdateWalletBalanceMutation();
  const [createTransaction, { isLoading: isCreatingTransaction }] =
    useCreateTransactionMutation();

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
      render: (value, transaction) => (
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
      render: (value, transaction) => (
        <span
          className={
            transaction.type === "DEPOSIT" ? "text-green-600" : "text-red-600"
          }
        >
          {transaction.type === "DEPOSIT" ? "+" : "-"}NPR{" "}
          {Number(value || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value, transaction) => {
        const statusColors = {
          PENDING: "secondary",
          COMPLETED: "default",
          FAILED: "destructive",
          CANCELLED: "outline",
        } as const;
        return (
          <Badge variant={statusColors[transaction.status]}>
            {transaction.status}
          </Badge>
        );
      },
    },
    {
      key: "description",
      label: "Description",
      render: (value) => value || "-",
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (value) => new Date(value).toLocaleString(),
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
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateWallet} disabled={isCreating}>
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
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border p-6">
            <p className="text-sm text-muted-foreground mb-2">Balance</p>
            <p className="text-3xl font-bold">
              NPR {wallet.balance.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border p-6">
            <p className="text-sm text-muted-foreground mb-2">
              Pending Balance
            </p>
            <p className="text-3xl font-bold">
              NPR {(wallet.pendingBalance || 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border p-6">
            <p className="text-sm text-muted-foreground mb-2">
              Total Transactions
            </p>
            <p className="text-3xl font-bold">{transactions.length}</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
          <DataTable
            columns={transactionColumns}
            data={paginatedTransactions}
            isLoading={false}
            emptyMessage="No transactions found"
            emptyIcon={<FileText className="w-12 h-12 text-gray-400" />}
            onSort={handleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
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
