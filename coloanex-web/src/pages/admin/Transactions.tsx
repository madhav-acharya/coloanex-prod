import { useState, useMemo, useEffect } from "react";
import { ethers } from "ethers";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Check,
  FileText,
  X,
} from "lucide-react";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { format, subMonths } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Pagination } from "@/components/ui/pagination";
import { DataTable } from "@/components/shared/DataTable";
import { Column } from "@/types/components";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import {
  useGetAllTransactionsQuery,
  useGetTransactionsByEntityQuery,
  useGetWalletSummaryQuery,
  Transaction,
} from "@/apis/transactionsApi";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Button } from "@/components/ui/button";
import {
  useCreateWalletMutation,
  useDeleteWalletMutation,
  useGetMyWalletsQuery,
  useSetPrimaryWalletMutation,
} from "@/apis/walletsApi";

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
  const [startDate, setStartDate] = useState<Date>(subMonths(new Date(), 6));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const { data: wallets = [], refetch: refetchWallets } =
    useGetMyWalletsQuery();
  const [createWallet, { isLoading: isCreatingWallet }] =
    useCreateWalletMutation();
  const [setPrimaryWallet] = useSetPrimaryWalletMutation();
  const [deleteWallet] = useDeleteWalletMutation();
  const [walletCoinBalances, setWalletCoinBalances] = useState<
    Record<string, { symbol: string; value: string }>
  >({});
  const [loadingWalletCoinBalances, setLoadingWalletCoinBalances] =
    useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [onChainMetaMaskMatches, setOnChainMetaMaskMatches] = useState<
    Record<string, boolean>
  >({});
  const walletBalanceRefreshKey = useMemo(
    () =>
      wallets
        .map((wallet) =>
          [
            wallet.id,
            wallet.address,
            wallet.provider,
            wallet.isPrimary ? "1" : "0",
            wallet.isActive ? "1" : "0",
          ].join(":"),
        )
        .sort()
        .join("|"),
    [wallets],
  );

  const getNativeCoinSymbol = (chainId: string) => {
    const normalized = String(chainId || "").toLowerCase();
    if (normalized === "0x1" || normalized === "0xaa36a7") return "ETH";
    if (normalized === "0x89") return "MATIC";
    if (normalized === "0x38") return "BNB";
    return "ETH";
  };

  const metamaskWallets = useMemo(
    () => wallets.filter((wallet) => wallet.provider === "METAMASK"),
    [wallets],
  );
  const primaryWallet = useMemo(
    () =>
      metamaskWallets.find((wallet) => wallet.isPrimary) || metamaskWallets[0],
    [metamaskWallets],
  );

  const refreshWalletCoinBalances = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum || metamaskWallets.length === 0) {
      setWalletCoinBalances({});
      return;
    }

    try {
      setLoadingWalletCoinBalances(true);
      const chainId = (await ethereum.request({
        method: "eth_chainId",
      })) as string;
      const symbol = getNativeCoinSymbol(chainId);

      const balances = await Promise.all(
        metamaskWallets.map(async (wallet) => {
          const raw = (await ethereum.request({
            method: "eth_getBalance",
            params: [wallet.address, "latest"],
          })) as string;
          const formatted = Number(ethers.formatEther(raw)).toFixed(6);
          return [wallet.id, { symbol, value: formatted }] as const;
        }),
      );

      setWalletCoinBalances(Object.fromEntries(balances));
    } catch {
      setWalletCoinBalances({});
    } finally {
      setLoadingWalletCoinBalances(false);
    }
  };

  useEffect(() => {
    void refreshWalletCoinBalances();
  }, [walletBalanceRefreshKey]);

  const walletCoinCards = useMemo(
    () =>
      metamaskWallets.map((wallet) => {
        const balance = walletCoinBalances[wallet.id];
        return {
          id: wallet.id,
          title: wallet.label || `Wallet ${wallet.address.slice(0, 6)}`,
          value: loadingWalletCoinBalances ? (
            <Skeleton className="h-6 w-24" />
          ) : balance ? (
            `${balance.value} ${balance.symbol}`
          ) : (
            "Balance unavailable"
          ),
          subtitle: wallet.address,
        };
      }),
    [metamaskWallets, walletCoinBalances, loadingWalletCoinBalances],
  );

  const isSuperAdmin = user?.roles?.some(
    (ur: any) => ur.role?.name === "Super Admin",
  );

  const { data: walletSummary } = useGetWalletSummaryQuery({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  const userEntityId = user?.id || "";
  const tenantEntityId = user?.tenantId || "";
  const entityIds = [userEntityId, tenantEntityId].filter(Boolean);

  const {
    data: allTransactions = [],
    isLoading: isLoadingAll,
    isFetching: isFetchingAll,
    refetch: refetchAll,
  } = useGetAllTransactionsQuery(undefined, {
    skip: !isSuperAdmin,
  });

  const {
    data: userTransactions,
    isLoading: isLoadingUserTransactions,
    isFetching: isFetchingUser,
    refetch: refetchUserTransactions,
  } = useGetTransactionsByEntityQuery(userEntityId, {
    skip: isSuperAdmin || !userEntityId,
  });

  const {
    data: tenantTransactions,
    isLoading: isLoadingTenantTransactions,
    isFetching: isFetchingTenant,
    refetch: refetchTenantTransactions,
  } = useGetTransactionsByEntityQuery(tenantEntityId, {
    skip: isSuperAdmin || !tenantEntityId,
  });

  const mergedEntityTransactions = useMemo(() => {
    const byId = new Map<string, Transaction>();
    [...(userTransactions || []), ...(tenantTransactions || [])].forEach(
      (tx) => {
        byId.set(tx.id, tx);
      },
    );
    return Array.from(byId.values());
  }, [userTransactions, tenantTransactions]);

  const transactions = isSuperAdmin
    ? allTransactions || []
    : mergedEntityTransactions;
  const isLoading = isSuperAdmin
    ? isLoadingAll
    : isLoadingUserTransactions || isLoadingTenantTransactions;

  const dataIsMissing = !isLoading && transactions.length === 0;
  const isFetchingPage = isSuperAdmin
    ? isFetchingAll
    : isFetchingUser || isFetchingTenant;

  const refetch = isSuperAdmin
    ? refetchAll
    : () => {
        if (userEntityId) refetchUserTransactions();
        if (tenantEntityId) refetchTenantTransactions();
      };

  const metamaskAddresses = useMemo(
    () =>
      new Set(metamaskWallets.map((wallet) => wallet.address.toLowerCase())),
    [metamaskWallets],
  );
  const hasEthereumProvider =
    typeof window !== "undefined" && Boolean((window as any).ethereum);
  const canMatchOnChain = metamaskAddresses.size > 0 && hasEthereumProvider;

  const metamaskHistoryTxHashes = useMemo(
    () =>
      transactions
        .map(
          (transaction) =>
            ((transaction as any).blockchainTxHash ||
              (transaction as any).blockchain_tx_hash ||
              "") as string,
        )
        .filter((hash) => Boolean(hash)),
    [transactions],
  );

  useEffect(() => {
    if (!canMatchOnChain || metamaskHistoryTxHashes.length === 0) {
      setOnChainMetaMaskMatches({});
      return;
    }

    const ethereum = (window as any).ethereum;

    let cancelled = false;

    const hydrate = async () => {
      const results: Record<string, boolean> = {};
      await Promise.all(
        metamaskHistoryTxHashes.map(async (hash) => {
          try {
            const tx = (await ethereum.request({
              method: "eth_getTransactionByHash",
              params: [hash],
            })) as any;
            if (!tx) {
              results[hash] = false;
              return;
            }
            const from = String(tx.from || "").toLowerCase();
            const to = String(tx.to || "").toLowerCase();
            results[hash] =
              metamaskAddresses.has(from) || metamaskAddresses.has(to);
          } catch {
            results[hash] = false;
          }
        }),
      );

      if (!cancelled) {
        setOnChainMetaMaskMatches(results);
      }
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [
    canMatchOnChain,
    metamaskHistoryTxHashes.join("|"),
    Array.from(metamaskAddresses).join("|"),
  ]);

  const metamaskTableTransactions = useMemo(() => {
    // Super admins should see all transactions, other users only see their wallet matches
    if (isSuperAdmin || !canMatchOnChain) return transactions;

    return transactions.filter((transaction) => {
      const hash = ((transaction as any).blockchainTxHash ||
        (transaction as any).blockchain_tx_hash ||
        "") as string;
      if (!hash) return false;
      return onChainMetaMaskMatches[hash] === true;
    });
  }, [transactions, onChainMetaMaskMatches, isSuperAdmin, canMatchOnChain]);

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

      const iSent = entityIds.includes(tx.sentBy);
      const iReceived = entityIds.includes(tx.receivedBy);

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
  }, [transactions, isSuperAdmin, entityIds]);

  const buildMonthlyWalletSeries = (
    source: Transaction[],
    metric: "give" | "receive" | "count",
    monthCount: number = 6,
  ) => {
    const now = new Date();
    const series: Array<{ value: number }> = [];

    for (let i = monthCount - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = monthDate.getMonth();
      const year = monthDate.getFullYear();

      const monthTransactions = source.filter((tx) => {
        const txDate = new Date(tx.createdAt);
        return txDate.getMonth() === month && txDate.getFullYear() === year;
      });

      if (metric === "count") {
        series.push({ value: monthTransactions.length });
        continue;
      }

      if (isSuperAdmin) {
        const volume = monthTransactions.reduce(
          (acc, tx) =>
            acc + (tx.status === "COMPLETED" ? Number(tx.amount) || 0 : 0),
          0,
        );
        series.push({ value: volume });
        continue;
      }

      let monthValue = 0;
      monthTransactions.forEach((tx) => {
        if (tx.status !== "COMPLETED") return;
        const amount = Number(tx.amount) || 0;
        const iSent = entityIds.includes(tx.sentBy);
        const iReceived = entityIds.includes(tx.receivedBy);

        if (metric === "give") {
          if (iReceived && tx.type === "DISBURSEMENT") monthValue += amount;
          if (
            iSent &&
            (tx.type === "INSTALLMENT_PAYMENT" || tx.type === "PENALTY_PAYMENT")
          ) {
            monthValue -= amount;
          }
        }

        if (metric === "receive") {
          if (iSent && tx.type === "DISBURSEMENT") monthValue += amount;
          if (
            iReceived &&
            (tx.type === "INSTALLMENT_PAYMENT" || tx.type === "PENALTY_PAYMENT")
          ) {
            monthValue -= amount;
          }
        }
      });

      series.push({ value: Math.max(0, monthValue) });
    }

    return series;
  };

  const getSeriesPercentage = (series: Array<{ value: number }>) => {
    if (!series.length) return 0;
    const start = Number(series[0]?.value || 0);
    const end = Number(series[series.length - 1]?.value || 0);
    if (start === 0) return end > 0 ? 100 : 0;
    return Number((((end - start) / start) * 100).toFixed(2));
  };

  const toGiveSeries = useMemo(
    () => buildMonthlyWalletSeries(transactions, "give"),
    [transactions, isSuperAdmin, entityIds.join("|")],
  );
  const toReceiveSeries = useMemo(
    () => buildMonthlyWalletSeries(transactions, "receive"),
    [transactions, isSuperAdmin, entityIds.join("|")],
  );
  const totalTransactionsSeries = useMemo(
    () => buildMonthlyWalletSeries(transactions, "count"),
    [transactions],
  );

  const resolvedToGiveSeries =
    walletSummary?.toGiveSeries && walletSummary.toGiveSeries.length > 0
      ? walletSummary.toGiveSeries
      : toGiveSeries;
  const resolvedToReceiveSeries =
    walletSummary?.toReceiveSeries && walletSummary.toReceiveSeries.length > 0
      ? walletSummary.toReceiveSeries
      : toReceiveSeries;
  const resolvedTotalTransactionsSeries =
    walletSummary?.totalTransactionsSeries &&
    walletSummary.totalTransactionsSeries.length > 0
      ? walletSummary.totalTransactionsSeries
      : totalTransactionsSeries;

  const MetricCard = ({
    title,
    value,
    color,
    isCurrency = false,
    trendData,
    trendPercentage,
    isLoading = false,
  }: any) => {
    if (isLoading) {
      return (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
              <div className="w-24 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
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
            <div className="w-24">
              <div
                className={`mb-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  trendPercentage >= 0
                    ? "bg-primary/20 text-primary"
                    : "bg-rose-500/20 text-rose-400"
                }`}
              >
                {trendPercentage >= 0 ? (
                  <ArrowUpRight className="mr-1 h-3 w-3" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3" />
                )}
                {`${trendPercentage >= 0 ? "+" : "-"}${Math.abs(
                  trendPercentage,
                ).toFixed(2)}%`}
              </div>
              <div className="h-10 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <Line
                      isAnimationActive={true}
                      animationDuration={1500}
                      animationEasing="ease-in-out"
                      type="monotone"
                      dataKey="value"
                      stroke={color}
                      strokeWidth={1.8}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const filteredTransactions = useMemo(() => {
    let filtered = metamaskTableTransactions.filter(
      (transaction: Transaction) => {
        const matchesSearch =
          searchValue === "" ||
          transaction.type?.toLowerCase().includes(searchValue.toLowerCase());
        const matchesStatus =
          statusFilter === "all" || transaction.status === statusFilter;
        const matchesType =
          typeFilter === "all" || transaction.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
      },
    );

    filtered.sort((a: Transaction, b: Transaction) => {
      const aValue = a[sortBy as keyof Transaction] ?? "";
      const bValue = b[sortBy as keyof Transaction] ?? "";

      if (aValue === bValue) return 0;
      const comparison = aValue > bValue ? 1 : -1;
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [
    metamaskTableTransactions,
    searchValue,
    statusFilter,
    typeFilter,
    sortBy,
    sortOrder,
  ]);

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

  const connectMetamask = async () => {
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        toast({
          title: "MetaMask not found",
          description: "Install MetaMask extension to connect wallet.",
          variant: "destructive",
        });
        return;
      }

      await ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const address = accounts?.[0];
      if (!address) {
        toast({
          title: "No account selected",
          description: "Select an account in MetaMask to continue.",
          variant: "destructive",
        });
        return;
      }

      await createWallet({
        provider: "METAMASK",
        platform: "WEB",
        address,
        label: "MetaMask",
      }).unwrap();
      await refetchWallets();
      toast({ title: "Wallet linked", description: `Connected ${address}` });
    } catch (error: any) {
      if (error?.code === 4001) {
        toast({
          title: "MetaMask request cancelled",
          description: "Please approve the MetaMask popup to connect.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Wallet connect failed",
        description:
          error?.data?.message ||
          error?.message ||
          "Unable to connect MetaMask",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchWallets(),
        refetch(),
        refreshWalletCoinBalances(),
      ]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const handleUseWallet = async (id: string) => {
    try {
      await setPrimaryWallet({ id }).unwrap();
      await handleRefresh();
      toast({
        title: "Wallet switched",
        description: "Primary wallet updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Switch failed",
        description: error?.data?.message || "Unable to switch wallet",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWallet = async (id: string) => {
    try {
      await deleteWallet({ id }).unwrap();
      await handleRefresh();
      toast({ title: "Wallet removed" });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error?.data?.message || "Unable to remove wallet",
        variant: "destructive",
      });
    }
  };

  const disconnectMetamask = async () => {
    const metamaskWallets = wallets.filter(
      (wallet) => wallet.provider === "METAMASK",
    );
    if (metamaskWallets.length === 0) {
      toast({ title: "No MetaMask wallet connected" });
      return;
    }

    try {
      await Promise.all(
        metamaskWallets.map((wallet) =>
          deleteWallet({ id: wallet.id }).unwrap(),
        ),
      );
      await refetchWallets();

      const ethereum = (window as any).ethereum;
      if (ethereum?.request) {
        try {
          await ethereum.request({
            method: "wallet_revokePermissions",
            params: [{ eth_accounts: {} }],
          });
        } catch {
          // Not all providers support this method.
        }
      }

      toast({ title: "MetaMask disconnected" });
    } catch (error: any) {
      toast({
        title: "Disconnect failed",
        description: error?.data?.message || "Unable to disconnect MetaMask",
        variant: "destructive",
      });
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
        const isReceived = entityIds.includes(transaction.receivedBy);
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
          <span className={isReceived ? "text-primary" : "text-destructive"}>
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
            "bg-green-100 dark:bg-primary text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800",
          FAILED:
            "bg-red-100 dark:bg-destructive text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800",
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
            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border transition-all ${
              hasBlockchainTx
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer"
                : "bg-destructive/10 text-destructive border-destructive/20 cursor-default"
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
        description="Manage your transaction history and wallets"
      >
        <div className="space-y-6">
          <div className="h-[90px] rounded-xl border border-border/50 bg-card p-4 animate-pulse flex items-center justify-between">
            <div className="h-6 w-32 bg-surface-bright rounded-md" />
            <div className="h-10 w-[450px] bg-surface-bright rounded-md" />
          </div>

          <div className="h-[120px] rounded-xl border border-border/50 bg-card p-4 animate-pulse flex items-center justify-between gap-4">
            <div className="h-full flex-1 bg-surface-bright rounded-md" />
            <div className="h-full w-[250px] bg-surface-bright rounded-md" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-32 rounded-xl border border-border/50 bg-card p-4 animate-pulse">
              <div className="h-5 w-24 bg-surface-bright rounded-md mb-4" />
              <div className="h-8 w-32 bg-surface-bright rounded-md" />
            </div>
            <div className="h-32 rounded-xl border border-border/50 bg-card p-4 animate-pulse">
              <div className="h-5 w-24 bg-surface-bright rounded-md mb-4" />
              <div className="h-8 w-32 bg-surface-bright rounded-md" />
            </div>
            <div className="h-32 rounded-xl border border-border/50 bg-card p-4 animate-pulse">
              <div className="h-5 w-24 bg-surface-bright rounded-md mb-4" />
              <div className="h-8 w-32 bg-surface-bright rounded-md" />
            </div>
          </div>

          <div>
            <div className="h-8 w-48 bg-surface-bright rounded-md mb-4 animate-pulse" />
            <div className="h-[400px] rounded-xl border border-border/50 bg-card p-4 animate-pulse">
              <div className="h-12 w-full bg-surface-bright/50 rounded-md mb-4" />
              <div className="space-y-3">
                <div className="h-10 w-full bg-surface-bright rounded-md" />
                <div className="h-10 w-full bg-surface-bright rounded-md" />
                <div className="h-10 w-full bg-surface-bright rounded-md" />
                <div className="h-10 w-full bg-surface-bright rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Transactions"
      description="Manage your transaction history and wallets"
      searchPlaceholder="Search transactions..."
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      onRefresh={handleRefresh}
      isLoading={isRefreshing || isFetchingPage || loadingWalletCoinBalances}
      isRefreshing={isRefreshing || isFetchingPage || loadingWalletCoinBalances}
      actions={[
        {
          label: metamaskWallets.length > 0 ? "Add More Wallet" : "Add Wallet",
          onClick: () => connectMetamask(),
          variant: "default",
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
            { value: "DISBURSEMENT", label: "Disbursement" },
            { value: "INSTALLMENT_PAYMENT", label: "Installment" },
            { value: "PENALTY_PAYMENT", label: "Penalty" },
            { value: "FEE", label: "Fee" },
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
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <label className="text-sm font-medium text-foreground">
                Date Range:
              </label>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[200px] justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {format(startDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground">to</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[200px] justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {format(endDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="text-lg font-semibold">Wallet Connections</h3>
            {metamaskWallets.length > 0 ? (
              <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center border border-white/20 shadow-sm">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                      MetaMask Connected
                    </p>
                    <p className="text-sm text-muted-foreground/80 font-medium break-all">
                      {primaryWallet?.address}
                    </p>
                    {primaryWallet && (
                      <div className="mt-1">
                        {loadingWalletCoinBalances ? (
                          <Skeleton className="h-4 w-28 bg-emerald-500/20" />
                        ) : walletCoinBalances[primaryWallet.id] ? (
                          <p className="text-xs text-emerald-700/80 dark:text-emerald-300 font-bold">
                            {`${walletCoinBalances[primaryWallet.id].value} ${walletCoinBalances[primaryWallet.id].symbol}`}
                          </p>
                        ) : (
                          <p className="text-xs text-emerald-700/80 dark:text-emerald-300 font-bold">
                            Balance unavailable
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  onClick={disconnectMetamask}
                  disabled={isCreatingWallet}
                  size="sm"
                  variant="outline"
                  className="border-red-200 text-destructive hover:bg-red-50 hover:text-red-700 font-bold h-11 px-6 transition-all"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-destructive flex items-center justify-center border border-white/20 shadow-sm">
                    <X className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-destructive text-lg">
                      MetaMask Not Connected
                    </p>
                    <p className="text-sm text-muted-foreground/80 font-medium">
                      You are currently disconnected. Link your wallet to
                      perform on-chain operations.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={connectMetamask}
                  disabled={isCreatingWallet}
                  className="bg-destructive hover:bg-destructive/90 text-white font-bold h-11 px-6 border border-white/10"
                >
                  {isCreatingWallet ? "Connecting..." : "Connect Wallet"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title={isSuperAdmin ? "Total Volume" : "To Give"}
            value={
              walletSummary
                ? walletSummary.toGive
                : isSuperAdmin
                  ? transactions.reduce(
                      (acc, tx) =>
                        acc +
                        (tx.status === "COMPLETED" ? Number(tx.amount) : 0),
                      0,
                    )
                  : toGive
            }
            color="#DC2626"
            isCurrency={true}
            trendData={resolvedToGiveSeries}
            trendPercentage={
              walletSummary?.toGivePercentage ??
              getSeriesPercentage(resolvedToGiveSeries)
            }
            isLoading={isLoading}
          />
          <MetricCard
            title="To Receive"
            value={walletSummary?.toReceive ?? toReceive}
            color="#16A34A"
            isCurrency={true}
            trendData={resolvedToReceiveSeries}
            trendPercentage={
              walletSummary?.toReceivePercentage ??
              getSeriesPercentage(resolvedToReceiveSeries)
            }
            isLoading={isLoading}
          />
          <MetricCard
            title="Total Transactions"
            value={walletSummary?.totalTransactions ?? transactions.length}
            color="#059669"
            trendData={resolvedTotalTransactionsSeries}
            trendPercentage={
              walletSummary?.totalTransactionsPercentage ??
              getSeriesPercentage(resolvedTotalTransactionsSeries)
            }
            isLoading={isLoading}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
          <DataTable
            columns={transactionColumns}
            data={paginatedTransactions}
            isLoading={isLoading}
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
