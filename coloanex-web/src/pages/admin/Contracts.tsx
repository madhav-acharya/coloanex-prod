import { useState, useMemo, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { toast as sonnerToast } from "sonner";
import {
  Eye,
  Trash2,
  FileSignature,
  Send,
  FileText,
  ExternalLink,
  FilePlus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Banknote,
} from "lucide-react";
import { IconCurrencyRupeeNepalese } from "@tabler/icons-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Pagination } from "@/components/ui/pagination";
import { DataTable } from "@/components/shared/DataTable";
import { Column } from "@/types/components";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetContractsQuery,
  useDeleteContractMutation,
  useDisburseContractMutation,
  useGenerateContractPdfMutation,
  useSignAndDisburseContractMutation,
  useUpdateContractMutation,
  Contract,
  DisburseContractDto,
  SignAndDisburseContractDto,
  UpdateContractDto,
} from "@/apis/contractsApi";
import {
  useInitiatePaymentMutation,
  useVerifyPaymentMutation,
} from "@/apis/paymentsApi";
import { useGetMyWalletsQuery } from "@/apis/walletsApi";
import { useListMySubscriptionsQuery } from "@/apis/subscriptionsApi";
import { getBlockchainAccessSnapshot } from "@/utils/blockchainAccess";

import { BlockchainProcessingModal } from "@/components/ui/blockchain-processing-modal";
import {
  signContractOnBlockchain,
  updateContractStatusOnBlockchain,
} from "@/utils/blockchain";

type ContractStatus =
  | "DRAFT"
  | "GENERATED"
  | "SIGNED"
  | "ACTIVE"
  | "COMPLETED"
  | "DEFAULTED"
  | "CANCELLED"
  | "REPORTED";

const STATUS_BADGE: Record<
  ContractStatus,
  {
    variant: "default" | "secondary" | "destructive" | "outline";
    label: string;
  }
> = {
  DRAFT: { variant: "secondary", label: "Draft" },
  GENERATED: { variant: "default", label: "Generated" },
  SIGNED: { variant: "default", label: "Signed" },
  ACTIVE: { variant: "default", label: "Active" },
  COMPLETED: { variant: "outline", label: "Completed" },
  DEFAULTED: { variant: "destructive", label: "Defaulted" },
  CANCELLED: { variant: "secondary", label: "Cancelled" },
  REPORTED: { variant: "destructive", label: "Reported" },
};

const STATUS_COLORS: Record<ContractStatus, string> = {
  DRAFT:
    "bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700",
  GENERATED:
    "bg-blue-100 dark:bg-blue-600 text-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  SIGNED:
    "bg-purple-100 dark:bg-purple-600 text-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  ACTIVE:
    "bg-green-100 dark:bg-primary text-green-900 dark:text-green-300 border-green-200 dark:border-green-800",
  COMPLETED:
    "bg-emerald-100 dark:bg-primary text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  DEFAULTED:
    "bg-red-100 dark:bg-destructive text-red-900 dark:text-red-300 border-red-200 dark:border-red-800",
  CANCELLED:
    "bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  REPORTED:
    "bg-orange-100 dark:bg-orange-600 text-orange-900 dark:text-orange-300 border-orange-200 dark:border-orange-800",
};

function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const cfg = STATUS_BADGE[status] ?? {
    variant: "secondary" as const,
    label: status,
  };
  return (
    <Badge variant={cfg.variant} className={STATUS_COLORS[status]}>
      {cfg.label}
    </Badge>
  );
}

function openPdfUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function Contracts() {
  const { toast } = useToast();

  const [viewContract, setViewContract] = useState<Contract | null>(null);
  const [sdDialogOpen, setSdDialogOpen] = useState(false);
  const [contractToSd, setContractToSd] = useState<Contract | null>(null);
  const [sdGateway, setSdGateway] = useState<"ESEWA" | "KHALTI">("ESEWA");
  const [sdMethod, setSdMethod] =
    useState<SignAndDisburseContractDto["method"]>("BANK_TRANSFER");
  const [sdTransactionId, setSdTransactionId] = useState("");
  const [sdAccountNumber, setSdAccountNumber] = useState("");
  const [sdAccountName, setSdAccountName] = useState("");

  const [disburseDialogOpen, setDisburseDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDisburse, setContractToDisburse] = useState<Contract | null>(
    null,
  );
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(
    null,
  );
  useState<any>(null);
  const [disburseData, setDisburseData] = useState<DisburseContractDto>({
    method: "WALLET",
    accountNumber: "",
    accountName: "",
    transactionId: "",
  });

  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const user = useSelector((state: RootState) => state.auth.user);

  const {
    data: contracts = [],
    isLoading,
    isFetching,
    refetch: refetchContracts,
  } = useGetContractsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [signAndDisburseContract, { isLoading: isSd }] =
    useSignAndDisburseContractMutation();
  const [disburseContract, { isLoading: isDisbursing }] =
    useDisburseContractMutation();
  const [deleteContract, { isLoading: isDeleting }] =
    useDeleteContractMutation();
  const [generateContractPdf, { isLoading: isGenerating }] =
    useGenerateContractPdfMutation();
  const [updateContract, { isLoading: isUpdatingContract }] =
    useUpdateContractMutation();
  const [initiatePayment, { isLoading: isInitiatingPayment }] =
    useInitiatePaymentMutation();
  const [verifyPayment] = useVerifyPaymentMutation();
  const { data: wallets = [] } = useGetMyWalletsQuery();
  const { data: mySubscriptions = [] } = useListMySubscriptionsQuery();

  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null,
  );
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<ContractStatus>("DRAFT");

  const [isProcessingBlockchain, setIsProcessingBlockchain] = useState(false);
  const [blockchainStep, setBlockchainStep] = useState<
    "blockchain" | "database" | "complete"
  >("blockchain");
  const [blockchainMessage, setBlockchainMessage] = useState("");
  const blockchainAccess = useMemo(
    () =>
      getBlockchainAccessSnapshot({
        gasPaymentMode: (user as any)?.gasPaymentMode,
        wallets,
        subscriptions: mySubscriptions,
      }),
    [user, wallets, mySubscriptions],
  );
  const shouldUseWalletSignature =
    blockchainAccess.canRunBlockchain &&
    blockchainAccess.mode === "USER_WALLET";
  const shouldShowBlockchainProcessing = blockchainAccess.canRunBlockchain;
  const shouldShowSdProcessing = true;

  const hasBorrowerSigned = (c: Contract) =>
    c.signatures?.some((s) => s.signedBy === "BORROWER") ?? false;

  const handleSort = useCallback(
    (key: string) => {
      if (sortBy === key) {
        setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(key);
        setSortOrder("asc");
      }
    },
    [sortBy],
  );

  const filteredContracts = useMemo(() => {
    const filtered = contracts.filter((c) => {
      const matchesSearch =
        searchValue === "" ||
        c.contractNumber.toLowerCase().includes(searchValue.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      const av = a[sortBy as keyof Contract];
      const bv = b[sortBy as keyof Contract];
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * (sortOrder === "asc" ? 1 : -1);
    });
  }, [contracts, searchValue, statusFilter, sortBy, sortOrder]);

  const paginatedContracts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredContracts.slice(start, start + pageSize);
  }, [filteredContracts, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredContracts.length / pageSize);

  const columns: Column<Contract>[] = [
    { key: "contractNumber", label: "Contract #", sortable: true },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (c) => (
        <ContractStatusBadge status={c.status as ContractStatus} />
      ),
    },
    {
      key: "blockchainTxHash",
      label: "Blockchain",
      sortable: false,
      render: (c) => {
        const hasBlockchainTx =
          !!(c as any)?.blockchainTxHash || !!(c as any)?.blockchain_tx_hash;
        return (
          <button
            onClick={() => {
              if (hasBlockchainTx) {
                window.open(
                  `https://sepolia.etherscan.io/tx/${(c as any).blockchainTxHash || (c as any).blockchain_tx_hash}`,
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
      key: "borrower",
      label: "Borrower",
      render: (c) => c.borrower?.user?.fullName ?? "—",
    },
    {
      key: "loanAmount",
      label: "Amount",
      sortable: true,
      render: (c) => (
        <span className="flex items-center gap-1">
          <IconCurrencyRupeeNepalese className="inline h-4 w-4" />
          {c.loanAmount.toLocaleString()}
        </span>
      ),
    },
    {
      key: "interestRate",
      label: "Interest",
      sortable: true,
      render: (c) => `${c.interestRate}%`,
    },
    {
      key: "termMonths",
      label: "Term",
      sortable: true,
      render: (c) => `${c.termMonths} mo`,
    },
    {
      key: "outstandingBalance",
      label: "Outstanding",
      sortable: true,
      render: (c) => (
        <span className="flex items-center gap-1">
          <IconCurrencyRupeeNepalese className="inline h-4 w-4" />
          {c.outstandingBalance.toLocaleString()}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (c) => new Date(c.createdAt).toLocaleDateString(),
    },
  ];

  const handleGenerateContract = async (contract: Contract) => {
    if (shouldShowBlockchainProcessing) {
      setIsProcessingBlockchain(true);
      setBlockchainStep("blockchain");
      setBlockchainMessage(
        shouldUseWalletSignature
          ? "Updating contract status on blockchain. Please approve the MetaMask transaction..."
          : "Processing contract on blockchain...",
      );
    }

    try {
      let blockchainTxHash: string | undefined;

      if (shouldUseWalletSignature) {
        try {
          blockchainTxHash = await updateContractStatusOnBlockchain(
            contract.id,
            "GENERATED",
          );
        } catch (blockchainError: any) {
          setIsProcessingBlockchain(false);
          if (blockchainError.code === "ACTION_REJECTED") {
            toast({
              title: "Transaction Rejected",
              description: "You rejected the blockchain transaction",
              variant: "destructive",
            });
            return;
          } else if (blockchainError.message?.includes("MetaMask")) {
            toast({
              title: "MetaMask Required",
              description: blockchainError.message,
              variant: "destructive",
            });
            return;
          } else {
            toast({
              title: "Blockchain Error",
              description:
                blockchainError.reason ||
                blockchainError.message ||
                "Failed to process blockchain transaction",
              variant: "destructive",
            });
            return;
          }
        }
      }

      if (shouldShowBlockchainProcessing) {
        setBlockchainStep("database");
        setBlockchainMessage(
          "Generating contract PDF and updating database...",
        );
      }

      await generateContractPdf(contract.id).unwrap();

      if (shouldShowBlockchainProcessing) {
        setTimeout(() => {
          setBlockchainStep("complete");
          setTimeout(() => {
            setIsProcessingBlockchain(false);
            setBlockchainStep("blockchain");
          }, 1000);
        }, 500);
      }

      toast({
        title: "Success",
        description:
          "Contract updated on blockchain and PDF generated successfully",
        variant: "success",
      });
    } catch (err: any) {
      setIsProcessingBlockchain(false);
      setBlockchainStep("blockchain");
      toast({
        title: "Error",
        description: err?.data?.message || "Failed to generate contract PDF",
        variant: "destructive",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!contractToDelete) return;

    const targetId = contractToDelete.id;
    const targetNumber = contractToDelete.contractNumber;
    setDeleteDialogOpen(false);
    setContractToDelete(null);

    let isCancelled = false;

    toast({
      title: "Contract Removed",
      description: `Contract ${targetNumber} has been removed.`,
      action: {
        label: "Undo",
        onClick: () => {
          isCancelled = true;
          toast({
            title: "Restored",
            description: `Contract ${targetNumber} has been restored.`,
          });
        },
      },
      duration: 5000,
    });

    setTimeout(async () => {
      if (isCancelled) return;
      try {
        await deleteContract(targetId).unwrap();
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.data?.message || "Failed to permanently delete contract",
          variant: "destructive",
        });
      }
    }, 5000);
  };

  const safeRefreshContracts = async () => {
    try {
      await refetchContracts();
    } catch {
      return;
    }
  };

  const completeBlockchainFlow = async () => {
    await safeRefreshContracts();
    if (shouldShowSdProcessing) {
      setBlockchainStep("complete");
      setTimeout(() => {
        setIsProcessingBlockchain(false);
        setBlockchainStep("blockchain");
      }, 900);
    }
  };

  useEffect(() => {
    const raw = window.location.search;

    const hasEsewaFlag =
      raw.includes("sd_esewa=1") && !raw.includes("sd_esewa_fail");
    if (!hasEsewaFlag) return;

    const pendingRaw = sessionStorage.getItem("coloanex_pending_sd");
    if (!pendingRaw) return;

    const pending = JSON.parse(pendingRaw) as {
      contractId: string;
      signature: string;
      walletId: string;
      amount: number;
      blockchainTxHash?: string;
    };
    sessionStorage.removeItem("coloanex_pending_sd");
    window.history.replaceState({}, "", window.location.pathname);

    let esewaData: Record<string, string> = {};
    try {
      const dataMatch = raw.match(/[?&]data=([^&?]+)/);
      if (dataMatch?.[1]) {
        esewaData = JSON.parse(atob(dataMatch[1]));
      }
    } catch {
      toast({
        title: "Payment Failed",
        description: "Could not parse eSewa response.",
        variant: "destructive",
      });
      return;
    }

    const transactionUuid = esewaData["transaction_uuid"];
    const status = esewaData["status"];

    if (!transactionUuid || status !== "COMPLETE") {
      toast({
        title: "Payment Failed",
        description: "eSewa payment was not completed.",
        variant: "destructive",
      });
      return;
    }

    const finalizeEsewa = async () => {
      try {
        if (shouldShowSdProcessing) {
          setIsProcessingBlockchain(true);
          setBlockchainStep("database");
          setBlockchainMessage(
            "Verifying payment and preparing contract finalization...",
          );
        }

        const result = await verifyPayment({
          transactionUuid,
          totalAmount: pending.amount,
          gateway: "ESEWA",
          type: "DISBURSEMENT",
          contractId: pending.contractId,
        }).unwrap();

        if (!result.success) {
          throw new Error("Payment verification failed");
        }

        let blockchainTxHash = pending.blockchainTxHash;
        if (shouldShowSdProcessing) {
          if (shouldUseWalletSignature) {
            setBlockchainStep("blockchain");
            setBlockchainMessage(
              "Payment verified. Please approve MetaMask to sign contract on blockchain...",
            );
            blockchainTxHash = await signContractOnBlockchain(
              pending.contractId,
            );
          }
          setBlockchainStep("database");
          setBlockchainMessage(
            "Payment and blockchain succeeded. Finalizing contract status, loan status, and schedules...",
          );
        }

        await signAndDisburseContract({
          id: pending.contractId,
          data: {
            signature: pending.signature,
            method: "ESEWA",
            transactionId: result.transactionId ?? undefined,
            blockchainTxHash,
          },
        }).unwrap();

        await completeBlockchainFlow();
        toast({
          title: "Success",
          description:
            "Contract signed and loan disbursed successfully via eSewa.",
          variant: "success",
        });
      } catch (err: any) {
        if (shouldShowSdProcessing) {
          setIsProcessingBlockchain(false);
          setBlockchainStep("blockchain");
        }
        toast({
          title: "Error",
          description:
            err?.data?.message ||
            err?.message ||
            "Failed to complete sign & disburse",
          variant: "destructive",
        });
      }
    };

    void finalizeEsewa();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pidx = params.get("pidx");
    const status = params.get("status");
    const isSdCallback = params.get("sd_khalti") === "1";

    if (!pidx || !isSdCallback) return;

    const pendingRaw = sessionStorage.getItem("coloanex_pending_sd_khalti");
    if (!pendingRaw) return;

    const pending = JSON.parse(pendingRaw) as {
      contractId: string;
      signature: string;
      walletId: string;
      amount: number;
      blockchainTxHash?: string;
    };
    sessionStorage.removeItem("coloanex_pending_sd_khalti");
    window.history.replaceState({}, "", window.location.pathname);

    if (status !== "Completed") {
      toast({
        title: "Payment Failed",
        description: "Khalti payment was not completed.",
        variant: "destructive",
      });
      return;
    }

    const finalizeKhalti = async () => {
      try {
        if (shouldShowSdProcessing) {
          setIsProcessingBlockchain(true);
          setBlockchainStep("database");
          setBlockchainMessage(
            "Verifying payment and preparing contract finalization...",
          );
        }

        const result = await verifyPayment({
          transactionUuid: pidx,
          totalAmount: pending.amount,
          gateway: "KHALTI",
          type: "DISBURSEMENT",
          contractId: pending.contractId,
        }).unwrap();

        if (!result.success) {
          throw new Error("Payment verification failed");
        }

        let blockchainTxHash = pending.blockchainTxHash;
        if (shouldShowSdProcessing) {
          if (shouldUseWalletSignature) {
            setBlockchainStep("blockchain");
            setBlockchainMessage(
              "Payment verified. Please approve MetaMask to sign contract on blockchain...",
            );
            blockchainTxHash = await signContractOnBlockchain(
              pending.contractId,
            );
          }
          setBlockchainStep("database");
          setBlockchainMessage(
            "Payment and blockchain succeeded. Finalizing contract status, loan status, and schedules...",
          );
        }

        await signAndDisburseContract({
          id: pending.contractId,
          data: {
            signature: pending.signature,
            method: "KHALTI",
            transactionId: result.transactionId ?? undefined,
            blockchainTxHash,
          },
        }).unwrap();

        await completeBlockchainFlow();
        toast({
          title: "Success",
          description:
            "Contract signed and loan disbursed successfully via Khalti.",
          variant: "success",
        });
      } catch (err: any) {
        if (shouldShowSdProcessing) {
          setIsProcessingBlockchain(false);
          setBlockchainStep("blockchain");
        }
        toast({
          title: "Error",
          description:
            err?.data?.message ||
            err?.message ||
            "Failed to complete sign & disburse",
          variant: "destructive",
        });
      }
    };

    void finalizeKhalti();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clean up old session storage entries
  useEffect(() => {
    const cleanupOldEntries = () => {
      const now = Date.now();
      const keys = Object.keys(sessionStorage);

      keys.forEach((key) => {
        if (
          key.startsWith("khalti_test_processed_") ||
          key.startsWith("last_khalti_attempt_")
        ) {
          try {
            const value = sessionStorage.getItem(key);
            if (value && !isNaN(Number(value))) {
              const timestamp = parseInt(value);
              if (now - timestamp > 3600000) {
                // 1 hour
                sessionStorage.removeItem(key);
              }
            } else if (key.startsWith("khalti_test_processed_")) {
              sessionStorage.removeItem(key);
            }
          } catch (error) {
            sessionStorage.removeItem(key);
          }
        }
      });
    };

    cleanupOldEntries();
  }, []);

  const openSdDialog = (c: Contract) => {
    setContractToSd(c);
    setSdGateway("ESEWA");
    setSdMethod("BANK_TRANSFER");
    setSdTransactionId("");
    setSdAccountNumber("");
    setSdAccountName("");
    setSdDialogOpen(true);
  };

  const confirmSignAndDisburse = async () => {
    if (!contractToSd) return;

    setSdDialogOpen(false);
    if (shouldShowSdProcessing) {
      setIsProcessingBlockchain(true);
      setBlockchainStep("blockchain");
      setBlockchainMessage(
        shouldUseWalletSignature
          ? "Recording contract signature on the blockchain. Please approve the MetaMask transaction..."
          : "Recording contract signature on blockchain...",
      );
    }

    try {
      let blockchainTxHash: string | undefined;

      if (shouldUseWalletSignature) {
        try {
          blockchainTxHash = await signContractOnBlockchain(contractToSd.id);
        } catch (blockchainError: any) {
          setIsProcessingBlockchain(false);
          setSdDialogOpen(true);
          if (blockchainError.code === "ACTION_REJECTED") {
            toast({
              title: "Transaction Rejected",
              description: "You rejected the blockchain transaction",
              variant: "destructive",
            });
            return;
          } else if (blockchainError.message?.includes("MetaMask")) {
            toast({
              title: "MetaMask Required",
              description: blockchainError.message,
              variant: "destructive",
            });
            return;
          } else {
            toast({
              title: "Blockchain Error",
              description:
                blockchainError.reason ||
                blockchainError.message ||
                "Failed to process blockchain transaction",
              variant: "destructive",
            });
            return;
          }
        }
      }

      if (shouldShowBlockchainProcessing) {
        setBlockchainStep("database");
        setBlockchainMessage(
          "Signing contract and disbursing loan in database...",
        );
      }

      await signAndDisburseContract({
        id: contractToSd.id,
        data: {
          signature: user?.fullName ?? "",
          method: sdMethod,
          transactionId: sdTransactionId || undefined,
          blockchainTxHash,
          accountNumber: sdAccountNumber || undefined,
          accountName: sdAccountName || undefined,
        },
      }).unwrap();

      await completeBlockchainFlow();

      toast({
        title: "Success",
        description: "Contract signed and loan disbursed successfully.",
        variant: "success",
      });
      setContractToSd(null);
    } catch (err: any) {
      setIsProcessingBlockchain(false);
      setBlockchainStep("blockchain");
      setSdDialogOpen(true);
      toast({
        title: "Error",
        description: err?.data?.message || "Failed to sign & disburse",
        variant: "destructive",
      });
    }
  };

  const handleEsewaPay = async () => {
    if (!contractToSd) {
      toast({
        title: "Error",
        description: "Contract not found.",
        variant: "destructive",
      });
      return;
    }

    setSdDialogOpen(false);
    if (shouldShowSdProcessing) {
      setIsProcessingBlockchain(true);
      setBlockchainStep("database");
      setBlockchainMessage("Redirecting to eSewa payment gateway...");
    }

    try {
      const successUrl = `${window.location.origin}${window.location.pathname}?sd_esewa=1`;
      const failureUrl = `${window.location.origin}${window.location.pathname}?sd_esewa_fail=1`;

      const result = await initiatePayment({
        contractId: contractToSd.id,
        amount: contractToSd.loanAmount,
        type: "DISBURSEMENT",
        gateway: "ESEWA",
        successUrl,
        failureUrl,
      }).unwrap();

      sessionStorage.setItem(
        "coloanex_pending_sd",
        JSON.stringify({
          contractId: contractToSd.id,
          signature: user?.fullName ?? "",
          amount: contractToSd.loanAmount,
        }),
      );

      const form = document.createElement("form");
      form.method = "POST";
      form.action = result.paymentUrl;
      Object.entries(result.formData).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (err: any) {
      if (shouldShowSdProcessing) {
        setIsProcessingBlockchain(false);
      }
      setSdDialogOpen(true);
      toast({
        title: "Error",
        description: err?.data?.message || "Failed to initiate eSewa payment",
        variant: "destructive",
      });
    }
  };

  const handleKhaltiPay = async () => {
    if (!contractToSd) {
      toast({
        title: "Error",
        description: "Contract not found.",
        variant: "destructive",
      });
      return;
    }

    const lastAttemptKey = `last_khalti_attempt_${contractToSd.id}`;
    const lastAttempt = sessionStorage.getItem(lastAttemptKey);
    const now = Date.now();

    if (lastAttempt && now - parseInt(lastAttempt) < 5000) {
      toast({
        title: "Please Wait",
        description: "Please wait a moment before trying again",
        variant: "warning",
      });
      return;
    }

    sessionStorage.setItem(lastAttemptKey, now.toString());

    setSdDialogOpen(false);
    if (shouldShowSdProcessing) {
      setIsProcessingBlockchain(true);
      setBlockchainStep("database");
      setBlockchainMessage("Redirecting to Khalti payment gateway...");
    }

    try {
      const successUrl = `${window.location.origin}${window.location.pathname}?sd_khalti=1`;
      const failureUrl = `${window.location.origin}${window.location.pathname}?sd_khalti_fail=1`;

      const result = await initiatePayment({
        contractId: contractToSd.id,
        amount: contractToSd.loanAmount,
        type: "DISBURSEMENT",
        gateway: "KHALTI",
        successUrl,
        failureUrl,
      }).unwrap();

      sessionStorage.setItem(
        "coloanex_pending_sd_khalti",
        JSON.stringify({
          contractId: contractToSd.id,
          signature: user?.fullName ?? "",
          amount: contractToSd.loanAmount,
        }),
      );

      window.location.href = result.paymentUrl;
    } catch (err: any) {
      if (shouldShowSdProcessing) {
        setIsProcessingBlockchain(false);
      }
      setSdDialogOpen(true);
      toast({
        title: "Error",
        description: err?.data?.message || "Failed to initiate Khalti payment",
        variant: "destructive",
      });
    }
  };

  const confirmDisburse = async () => {
    if (!contractToDisburse) return;

    try {
      await disburseContract({
        id: contractToDisburse.id,
        data: disburseData,
      }).unwrap();
      toast({
        title: "Success",
        description: "Loan disbursed successfully",
        variant: "success",
      });
      setDisburseDialogOpen(false);
      setContractToDisburse(null);
      setDisburseData({
        method: "WALLET",
        accountNumber: "",
        accountName: "",
        transactionId: "",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.data?.message || "Failed to disburse",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedContract) return;

    try {
      const updateData: UpdateContractDto = {
        status: newStatus,
      };

      await updateContract({
        id: selectedContract.id,
        data: updateData,
      }).unwrap();

      toast({
        title: "Success",
        description: `Contract status updated to ${newStatus.toLowerCase()}`,
        variant: "success",
      });

      setStatusUpdateDialogOpen(false);
      setSelectedContract(null);
    } catch (error: any) {
      console.error("Status update error:", error);
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to update contract status",
        variant: "destructive",
      });
    }
  };

  const actions = [
    {
      label: "Generate Contract",
      icon: <FilePlus className="w-4 h-4" />,
      onClick: (c: Contract) => handleGenerateContract(c),
      show: (c: Contract) => c.status === "DRAFT" && !c.contractPdfUrl,
      isLoading: isGenerating,
    },
    {
      label: "View Contract",
      icon: <Eye className="w-4 h-4" />,
      onClick: (c: Contract) => setViewContract(c),
      show: (c: Contract) => !!c.contractPdfUrl,
    },
    {
      label: "Sign & Disburse",
      icon: <FileSignature className="w-4 h-4" />,
      onClick: (c: Contract) => openSdDialog(c),
      show: (c: Contract) => c.status === "GENERATED",
    },
    {
      label: "Disburse",
      icon: <Send className="w-4 h-4" />,
      onClick: (c: Contract) => {
        setContractToDisburse(c);
        setDisburseDialogOpen(true);
      },
      show: (c: Contract) => c.status === "SIGNED",
    },
    {
      label: "Change Status",
      icon: <CheckCircle2 className="w-4 h-4" />,
      onClick: (c: Contract) => {
        setSelectedContract(c);
        setNewStatus(c.status);
        setStatusUpdateDialogOpen(true);
      },
      show: (c: Contract) => true,
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (c: Contract) => {
        setContractToDelete(c);
        setDeleteDialogOpen(true);
      },
      variant: "destructive" as const,
      show: (c: Contract) => c.status === "DRAFT",
    },
  ];

  return (
    <DashboardLayout
      title="Contract Management"
      description="Monitor and manage loan contracts"
      searchPlaceholder="Search contract number..."
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      onRefresh={async () => {
        setIsRefreshing(true);
        try {
          await refetchContracts();
        } finally {
          setTimeout(() => setIsRefreshing(false), 1000);
        }
      }}
      isLoading={isLoading || isRefreshing || isFetching}
      isRefreshing={isRefreshing || isFetching}
      filters={[
        {
          name: "status",
          type: "select",
          label: "Status",
          placeholder: "All Status",
          options: [
            { value: "DRAFT", label: "Draft" },
            { value: "GENERATED", label: "Generated" },
            { value: "SIGNED", label: "Signed" },
            { value: "ACTIVE", label: "Active" },
            { value: "COMPLETED", label: "Completed" },
            { value: "DEFAULTED", label: "Defaulted" },
            { value: "CANCELLED", label: "Cancelled" },
            { value: "REPORTED", label: "Reported" },
          ],
        },
      ]}
      filterValues={{ status: statusFilter }}
      onFilterChange={(name, value) => {
        if (name === "status") {
          setStatusFilter(value);
          setCurrentPage(1);
        }
      }}
    >
      <div className="space-y-6">
        <DataTable
          columns={columns}
          data={paginatedContracts}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="No contracts found"
          emptyIcon={<FileText className="w-12 h-12 text-muted-foreground" />}
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
            total={filteredContracts.length}
            limit={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <Dialog
        open={!!viewContract}
        onOpenChange={(open) => {
          if (!open) setViewContract(null);
        }}
      >
        <DialogContent
          className="h-[90vh] flex flex-col"
          style={{ width: "90vw", maxWidth: "1400px" }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <FileText className="w-5 h-5" />
              Contract {viewContract?.contractNumber}
              {viewContract && (
                <ContractStatusBadge
                  status={viewContract.status as ContractStatus}
                />
              )}
            </DialogTitle>
            <DialogDescription>
              View and manage contract details, terms, and borrower information
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden rounded border bg-white">
            {viewContract?.contractPdfUrl ? (
              <iframe
                src={viewContract.contractPdfUrl}
                title="Contract Preview"
                className="w-full h-full border-0"
              />
            ) : (
              <div className="p-6 h-full overflow-auto">
                {viewContract && (
                  <ContractDetailFallback contract={viewContract} />
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="cursor-pointer gap-2"
              onClick={() =>
                viewContract?.contractPdfUrl &&
                openPdfUrl(viewContract.contractPdfUrl)
              }
              disabled={!viewContract?.contractPdfUrl}
            >
              <ExternalLink className="w-4 h-4" />
              Open PDF
            </Button>
            {viewContract?.status === "GENERATED" && (
              <Button
                className="cursor-pointer gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => {
                  const c = viewContract;
                  setViewContract(null);
                  openSdDialog(c);
                }}
              >
                <FileSignature className="w-4 h-4" />
                Sign &amp; Disburse
              </Button>
            )}
            {viewContract?.status === "SIGNED" && (
              <Button
                className="cursor-pointer gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                onClick={() => {
                  setContractToDisburse(viewContract);
                  setViewContract(null);
                  setDisburseDialogOpen(true);
                }}
              >
                <Send className="w-4 h-4" />
                Disburse
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sdDialogOpen} onOpenChange={setSdDialogOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
          <DialogDescription className="sr-only">
            Sign contract and disburse loan to borrower via payment gateway
          </DialogDescription>
          <div className="flex items-center gap-3 px-5 py-4 border-b">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-green-100 text-green-700 shrink-0">
              <FileSignature className="w-[18px] h-[18px]" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-foreground leading-tight">
                Sign &amp; Disburse Loan
              </DialogTitle>
              {contractToSd && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {contractToSd.contractNumber}
                </p>
              )}
            </div>
          </div>

          <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Contract Summary Grid */}
            {contractToSd && (
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-3 flex items-center justify-between rounded-lg bg-muted/50 border px-3.5 py-2.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Borrower
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {contractToSd.borrower?.user?.fullName ?? "—"}
                  </span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-muted/50 border px-3 py-2.5">
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Amount
                  </span>
                  <span className="text-xs font-bold text-foreground mt-1 flex items-center gap-1">
                    <IconCurrencyRupeeNepalese className="inline h-3.5 w-3.5" />
                    {contractToSd.loanAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-muted/50 border px-3 py-2.5">
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Rate
                  </span>
                  <span className="text-xs font-semibold text-foreground mt-1">
                    {contractToSd.interestRate}% / mo
                  </span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-muted/50 border px-3 py-2.5">
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Term
                  </span>
                  <span className="text-xs font-semibold text-foreground mt-1">
                    {contractToSd.termMonths} mo
                  </span>
                </div>
              </div>
            )}

            {/* Borrower signature status */}
            {contractToSd && hasBorrowerSigned(contractToSd) ? (
              <div className="flex items-center gap-2.5 rounded-lg border border-green-200 dark:border-green-800 !bg-green-100 dark:bg-green-900/20 px-3.5 py-2.5">
                <CheckCircle2 className="w-4 h-4 !text-green-900 dark:text-green-400 shrink-0" />
                <span className="text-xs !text-green-900 dark:text-green-300">
                  Borrower has signed — complete payment below to activate
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3.5 py-2.5">
                <AlertCircle className="w-4 h-4 !text-amber-900 dark:text-amber-400 shrink-0" />
                <span className="text-xs !text-amber-900 dark:text-amber-300">
                  Borrower must sign before the lender can activate this
                  contract.
                </span>
              </div>
            )}

            {/* Payment + signature — only if borrower signed */}
            {contractToSd && hasBorrowerSigned(contractToSd) && (
              <>
                {/* Gateway selection */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSdGateway("ESEWA")}
                    className={`relative flex items-center justify-center rounded-xl border-2 p-3 h-16 transition-all cursor-pointer bg-card dark:bg-card ${
                      sdGateway === "ESEWA"
                        ? "border-[#60B246] ring-2 ring-[#60B246]/30"
                        : "border-border hover:border-[#60B246]/60"
                    }`}
                  >
                    <img
                      src="/images/esewa.png"
                      alt="eSewa"
                      className="h-9 w-auto object-contain"
                    />
                    {sdGateway === "ESEWA" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#60B246] absolute top-1.5 right-1.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSdGateway("KHALTI")}
                    className={`relative flex items-center justify-center rounded-xl border-2 p-3 h-16 transition-all cursor-pointer bg-card dark:bg-card ${
                      sdGateway === "KHALTI"
                        ? "border-[#5C2D91] ring-2 ring-[#5C2D91]/30"
                        : "border-border hover:border-[#5C2D91]/60"
                    }`}
                  >
                    <img
                      src="/images/khalti.png"
                      alt="Khalti"
                      className="h-9 w-auto object-contain"
                    />
                    {sdGateway === "KHALTI" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#5C2D91] absolute top-1.5 right-1.5" />
                    )}
                  </button>
                </div>

                {/* Redirect notice */}
                <div
                  className={`flex gap-2.5 rounded-lg border px-3.5 py-3 text-xs leading-relaxed ${
                    sdGateway === "ESEWA"
                      ? "!bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300"
                      : "!bg-purple-100 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300"
                  }`}
                >
                  <Banknote
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      sdGateway === "ESEWA"
                        ? "!text-green-900 dark:text-green-400"
                        : "!text-purple-900 dark:text-purple-400"
                    }`}
                  />
                  <p
                    className={`${
                      sdGateway === "ESEWA"
                        ? "!text-green-900 dark:text-green-400"
                        : "!text-purple-900 dark:text-purple-400"
                    }`}
                  >
                    You will be redirected to{" "}
                    <span className="font-semibold">
                      {sdGateway === "ESEWA" ? "eSewa" : "Khalti"}
                    </span>{" "}
                    to complete the payment. Contract is signed &amp; loan
                    activated automatically on success.
                  </p>
                </div>

                {/* Lender signature */}
                <div className="rounded-xl border-2 border-green-200 dark:border-green-800 !bg-green-100 dark:bg-green-900/20 px-4 pt-3 pb-2.5">
                  <p className="text-[10px] font-semibold text-green-900 dark:text-green-400 uppercase tracking-wider mb-1.5">
                    Lender Electronic Signature
                  </p>
                  <p className="text-sm text-green-900 dark:text-green-400 font-semibold">
                    {user?.fullName ?? "—"}
                  </p>
                  <div className="mt-2 pt-1.5 border-t border-green-200 dark:border-green-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 !text-green-900 dark:text-green-400" />
                    <p className="text-[10px] !text-green-900 dark:text-green-400">
                      Signed digitally &middot;{" "}
                      {new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t bg-muted/20">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSdDialogOpen(false)}
              disabled={isSd || isInitiatingPayment}
              className="cursor-pointer h-8 text-xs"
            >
              Cancel
            </Button>
            {contractToSd && hasBorrowerSigned(contractToSd) && (
              <Button
                size="sm"
                onClick={
                  sdGateway === "ESEWA" ? handleEsewaPay : handleKhaltiPay
                }
                disabled={isInitiatingPayment}
                className={`cursor-pointer h-8 text-xs text-white gap-2 ${
                  sdGateway === "ESEWA"
                    ? "bg-[#60B246] hover:bg-[#4e9a38]"
                    : "bg-[#5C2D91] hover:bg-[#4a2278]"
                }`}
              >
                <img
                  src={
                    sdGateway === "ESEWA"
                      ? "/images/esewa.png"
                      : "/images/khalti.png"
                  }
                  alt={sdGateway === "ESEWA" ? "eSewa" : "Khalti"}
                  className="h-4 w-auto object-contain"
                />
                {isInitiatingPayment
                  ? "Redirecting…"
                  : `Pay with ${sdGateway === "ESEWA" ? "eSewa" : "Khalti"}`}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={disburseDialogOpen} onOpenChange={setDisburseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disburse Loan</DialogTitle>
            <DialogDescription>
              Select disbursement method and enter borrower account details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="method">Disbursement Method</Label>
              <select
                id="method"
                className="w-full p-2 border rounded-md text-sm"
                value={disburseData.method}
                onChange={(e) =>
                  setDisburseData({
                    ...disburseData,
                    method: e.target.value as DisburseContractDto["method"],
                  })
                }
              >
                <option value="WALLET">Wallet</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="ESEWA">eSewa</option>
                <option value="FONEPAY">FonePay</option>
                <option value="KHALTI">Khalti</option>
              </select>
            </div>
            <div>
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={disburseData.accountNumber}
                onChange={(e) =>
                  setDisburseData({
                    ...disburseData,
                    accountNumber: e.target.value,
                  })
                }
                placeholder="Account number"
              />
            </div>
            <div>
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                value={disburseData.accountName}
                onChange={(e) =>
                  setDisburseData({
                    ...disburseData,
                    accountName: e.target.value,
                  })
                }
                placeholder="Account holder name"
              />
            </div>
            <div>
              <Label htmlFor="transactionId">Transaction ID</Label>
              <Input
                id="transactionId"
                value={disburseData.transactionId}
                onChange={(e) =>
                  setDisburseData({
                    ...disburseData,
                    transactionId: e.target.value,
                  })
                }
                placeholder="Transaction reference"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDisburseDialogOpen(false)}
              disabled={isDisbursing}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDisburse}
              disabled={isDisbursing}
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground cursor-pointer"
            >
              {isDisbursing ? "Disbursing…" : "Disburse"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Contract"
        description={`Are you sure you want to delete contract "${contractToDelete?.contractNumber}"? This cannot be undone.`}
        isLoading={isDeleting}
      />

      {/* Status Update Dialog */}
      <Dialog
        open={statusUpdateDialogOpen}
        onOpenChange={setStatusUpdateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Contract Status</DialogTitle>
            <DialogDescription>
              Change the current status of this contract
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">New Status</Label>
              <Select
                value={newStatus}
                onValueChange={(value) => setNewStatus(value as ContractStatus)}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="GENERATED">Generated</SelectItem>
                  <SelectItem value="SIGNED">Signed</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="DEFAULTED">Defaulted</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="REPORTED">Reported</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusUpdateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} disabled={isUpdatingContract}>
              {isUpdatingContract ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BlockchainProcessingModal
        open={isProcessingBlockchain}
        currentStep={blockchainStep}
        message={
          blockchainMessage ||
          "Recording on the blockchain and updating the database. Please wait..."
        }
      />
    </DashboardLayout>
  );
}

function ContractDetailFallback({ contract }: { contract: Contract }) {
  const rows = [
    { label: "Contract #", value: contract.contractNumber },
    { label: "Status", value: contract.status },
    { label: "Borrower", value: contract.borrower?.user?.fullName ?? "—" },
    {
      label: "Loan Amount",
      value: (
        <span className="flex items-center gap-1">
          <IconCurrencyRupeeNepalese className="inline h-4 w-4" />
          {contract.loanAmount.toLocaleString()}
        </span>
      ),
    },
    { label: "Interest Rate", value: `${contract.interestRate}%` },
    { label: "Term", value: `${contract.termMonths} months` },
    { label: "Payment Frequency", value: contract.paymentFrequency },
    {
      label: "Total Amount Due",
      value: (
        <span className="flex items-center gap-1">
          <IconCurrencyRupeeNepalese className="inline h-4 w-4" />
          {contract.totalAmountDue.toLocaleString()}
        </span>
      ),
    },
    {
      label: "Installment Amount",
      value: (
        <span className="flex items-center gap-1">
          <IconCurrencyRupeeNepalese className="inline h-4 w-4" />
          {contract.installmentAmount.toLocaleString()}
        </span>
      ),
    },
    { label: "Total Installments", value: String(contract.totalInstallments) },
    {
      label: "Start Date",
      value: new Date(contract.startDate).toLocaleDateString(),
    },
    {
      label: "End Date",
      value: new Date(contract.endDate).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6 text-sm">
      <div className="grid grid-cols-2 gap-3">
        {rows.map((r) => (
          <div
            key={r.label}
            className="p-3 bg-slate-100 dark:bg-muted/40 rounded-md border border-slate-200 dark:border-border"
          >
            <p className="text-xs text-muted-foreground">{r.label}</p>
            <p className="font-semibold text-foreground">{r.value}</p>
          </div>
        ))}
      </div>

      {contract.signatures && contract.signatures.length > 0 && (
        <div className="space-y-2">
          <p className="font-semibold">Signatures</p>
          {contract.signatures.map((sig, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 bg-slate-100 dark:bg-muted/40 rounded-md border border-slate-200 dark:border-border"
            >
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase">
                  {sig.signedBy}
                </p>
                <p className="font-medium">{sig.signature}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(sig.signedAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {contract.termsAndConditions && (
        <div className="space-y-2">
          <p className="font-semibold">Terms &amp; Conditions</p>
          <pre className="whitespace-pre-wrap text-xs text-muted-foreground bg-slate-100 dark:bg-muted/40 border border-slate-200 dark:border-border p-4 rounded-md leading-relaxed">
            {contract.termsAndConditions}
          </pre>
        </div>
      )}
    </div>
  );
}
