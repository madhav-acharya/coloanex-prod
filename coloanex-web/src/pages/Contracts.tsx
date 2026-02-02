import { useState, useMemo } from "react";
import {
  Eye,
  Edit,
  Trash2,
  Plus,
  FileSignature,
  Send,
  FileText,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Pagination } from "@/components/ui/pagination";
import { DataTable } from "@/components/shared/DataTable";
import { Column } from "@/types/components";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { FormSheet } from "@/components/shared/FormSheet";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useGetContractsQuery,
  useCreateContractMutation,
  useUpdateContractMutation,
  useDeleteContractMutation,
  useSignContractMutation,
  useDisburseContractMutation,
  Contract,
  CreateContractDto,
  SignContractDto,
  DisburseContractDto,
} from "@/apis/contractsApi";
import { useGetLoansQuery } from "@/apis/loansApi";
import { useGetRulesQuery } from "@/apis/rulesApi";

export default function Contracts() {
  const { toast } = useToast();
  const [contractFormOpen, setContractFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [disburseDialogOpen, setDisburseDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(
    null,
  );
  const [contractToSign, setContractToSign] = useState<Contract | null>(null);
  const [contractToDisburse, setContractToDisburse] = useState<Contract | null>(
    null,
  );
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [signatureData, setSignatureData] = useState({
    signature: "",
    ipAddress: "",
  });
  const [disburseData, setDisburseData] = useState({
    method: "WALLET" as const,
    accountNumber: "",
    accountName: "",
    transactionId: "",
  });

  const { data: contracts = [], isLoading } = useGetContractsQuery();
  const { data: loans = [] } = useGetLoansQuery();
  const { data: rules = [] } = useGetRulesQuery();
  const [createContract, { isLoading: isCreating }] =
    useCreateContractMutation();
  const [updateContract, { isLoading: isUpdating }] =
    useUpdateContractMutation();
  const [deleteContract, { isLoading: isDeleting }] =
    useDeleteContractMutation();
  const [signContract, { isLoading: isSigning }] = useSignContractMutation();
  const [disburseContract, { isLoading: isDisbursing }] =
    useDisburseContractMutation();

  const filteredContracts = useMemo(() => {
    let filtered = contracts.filter((contract) => {
      const matchesSearch =
        searchValue === "" ||
        contract.contractNumber
          .toLowerCase()
          .includes(searchValue.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || contract.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortBy as keyof Contract];
      const bValue = b[sortBy as keyof Contract];

      if (aValue === bValue) return 0;
      const comparison = aValue > bValue ? 1 : -1;
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [contracts, searchValue, statusFilter, sortBy, sortOrder]);

  const paginatedContracts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredContracts.slice(startIndex, endIndex);
  }, [filteredContracts, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredContracts.length / pageSize);

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

  const columns: Column<Contract>[] = [
    { key: "contractNumber", label: "Contract #", sortable: true },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (contract) => {
        const statusColors = {
          DRAFT: "secondary",
          ACTIVE: "default",
          COMPLETED: "outline",
          DEFAULTED: "destructive",
          CANCELLED: "secondary",
        } as const;
        return (
          <Badge variant={statusColors[contract.status]}>
            {contract.status}
          </Badge>
        );
      },
    },
    {
      key: "loanAmount",
      label: "Amount",
      sortable: true,
      render: (contract) => `NPR ${contract.loanAmount.toLocaleString()}`,
    },
    {
      key: "interestRate",
      label: "Interest",
      sortable: true,
      render: (contract) => `${contract.interestRate}%`,
    },
    {
      key: "termMonths",
      label: "Term",
      sortable: true,
      render: (contract) => `${contract.termMonths} months`,
    },
    {
      key: "outstandingBalance",
      label: "Outstanding",
      sortable: true,
      render: (contract) =>
        `NPR ${contract.outstandingBalance.toLocaleString()}`,
    },
    {
      key: "createdAt",
      label: "Created At",
      sortable: true,
      render: (contract) => new Date(contract.createdAt).toLocaleDateString(),
    },
  ];

  const handleView = (contract: Contract) => {
    setEditingContract(contract);
    setIsReadOnly(true);
    setContractFormOpen(true);
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setIsReadOnly(false);
    setContractFormOpen(true);
  };

  const handleDelete = (contract: Contract) => {
    setContractToDelete(contract);
    setDeleteDialogOpen(true);
  };

  const handleSign = (contract: Contract) => {
    setContractToSign(contract);
    setSignDialogOpen(true);
  };

  const handleDisburse = (contract: Contract) => {
    setContractToDisburse(contract);
    setDisburseDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!contractToDelete) return;

    try {
      await deleteContract(contractToDelete.id).unwrap();
      toast({
        title: "Success",
        description: "Contract deleted successfully",
      });
      setDeleteDialogOpen(false);
      setContractToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to delete contract",
        variant: "destructive",
      });
    }
  };

  const confirmSign = async () => {
    if (!contractToSign) return;

    try {
      const signData: SignContractDto = {
        signature: signatureData.signature,
        ipAddress: signatureData.ipAddress,
      };
      await signContract({ id: contractToSign.id, data: signData }).unwrap();
      toast({
        title: "Success",
        description: "Contract signed successfully",
      });
      setSignDialogOpen(false);
      setContractToSign(null);
      setSignatureData({ signature: "", ipAddress: "" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to sign contract",
        variant: "destructive",
      });
    }
  };

  const confirmDisburse = async () => {
    if (!contractToDisburse) return;

    try {
      const data: DisburseContractDto = {
        method: disburseData.method,
        accountNumber: disburseData.accountNumber,
        accountName: disburseData.accountName,
        transactionId: disburseData.transactionId,
      };
      await disburseContract({ id: contractToDisburse.id, data }).unwrap();
      toast({
        title: "Success",
        description: "Contract disbursed successfully",
      });
      setDisburseDialogOpen(false);
      setContractToDisburse(null);
      setDisburseData({
        method: "WALLET",
        accountNumber: "",
        accountName: "",
        transactionId: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to disburse contract",
        variant: "destructive",
      });
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      const contractData: CreateContractDto = {
        loanId: data.loanId,
        ruleId: data.ruleId,
        startDate: data.startDate,
        termMonths: parseInt(data.termMonths),
        paymentFrequency: data.paymentFrequency,
        termsAndConditions: data.termsAndConditions,
        loanAmount: data.loanAmount ? parseFloat(data.loanAmount) : undefined,
        interestRate: data.interestRate
          ? parseFloat(data.interestRate)
          : undefined,
      };

      if (editingContract) {
        await updateContract({
          id: editingContract.id,
          data: { status: data.status },
        }).unwrap();
        toast({
          title: "Success",
          description: "Contract updated successfully",
        });
      } else {
        await createContract(contractData).unwrap();
        toast({
          title: "Success",
          description: "Contract created successfully",
        });
      }

      setContractFormOpen(false);
      setEditingContract(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.data?.message ||
          `Failed to ${editingContract ? "update" : "create"} contract`,
        variant: "destructive",
      });
    }
  };

  const loansList = Array.isArray(loans) ? loans : [];

  const contractFields = [
    {
      name: "loanId",
      label: "Loan",
      type: "select" as const,
      required: true,
      options: loansList.map((loan) => ({
        value: loan.id,
        label: `Loan #${loan.id.substring(0, 8)} - NPR ${loan.requestedAmount}`,
      })),
    },
    {
      name: "ruleId",
      label: "Rule",
      type: "select" as const,
      required: true,
      options: rules.map((rule) => ({
        value: rule.id,
        label: `${rule.name} (${rule.interestRate}%)`,
      })),
    },
    {
      name: "startDate",
      label: "Start Date",
      type: "date" as const,
      required: true,
    },
    {
      name: "termMonths",
      label: "Term (Months)",
      type: "number" as const,
      required: true,
      placeholder: "e.g., 12",
    },
    {
      name: "paymentFrequency",
      label: "Payment Frequency",
      type: "select" as const,
      required: true,
      options: [
        { value: "WEEKLY", label: "Weekly" },
        { value: "MONTHLY", label: "Monthly" },
        { value: "QUARTERLY", label: "Quarterly" },
      ],
    },
    {
      name: "loanAmount",
      label: "Loan Amount (Optional)",
      type: "number" as const,
      placeholder: "Leave empty to use approved amount",
    },
    {
      name: "interestRate",
      label: "Interest Rate (Optional)",
      type: "number" as const,
      placeholder: "Leave empty to use rule rate",
    },
    {
      name: "termsAndConditions",
      label: "Terms and Conditions",
      type: "textarea" as const,
      required: true,
      placeholder: "Enter contract terms and conditions",
    },
  ];

  const actions = [
    {
      label: "View",
      icon: <Eye className="w-4 h-4" />,
      onClick: handleView,
    },
    {
      label: "Sign",
      icon: <FileSignature className="w-4 h-4" />,
      onClick: handleSign,
      show: (contract: Contract) => contract.status === "DRAFT",
    },
    {
      label: "Disburse",
      icon: <Send className="w-4 h-4" />,
      onClick: handleDisburse,
      show: (contract: Contract) => contract.status === "ACTIVE",
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: handleDelete,
      variant: "destructive" as const,
    },
  ];

  return (
    <DashboardLayout
      title="Contracts"
      description="Manage loan contracts and disbursements"
      searchPlaceholder="Search by contract number..."
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      actions={[
        {
          label: "Create Contract",
          onClick: () => {
            setEditingContract(null);
            setIsReadOnly(false);
            setContractFormOpen(true);
          },
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
            { value: "DRAFT", label: "Draft" },
            { value: "ACTIVE", label: "Active" },
            { value: "COMPLETED", label: "Completed" },
            { value: "DEFAULTED", label: "Defaulted" },
            { value: "CANCELLED", label: "Cancelled" },
          ],
        },
      ]}
      filterValues={{ status: statusFilter }}
      onFilterChange={(name, value) => {
        if (name === "status") setStatusFilter(value);
      }}
    >
      <div className="space-y-6">
        <DataTable
          columns={columns}
          data={paginatedContracts}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="No contracts found"
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
            total={filteredContracts.length}
            limit={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>

        <FormSheet
          open={contractFormOpen}
          onOpenChange={(open) => {
            if (!open) {
              setContractFormOpen(false);
              setEditingContract(null);
              setIsReadOnly(false);
            }
          }}
          title={
            isReadOnly
              ? "View Contract"
              : editingContract
                ? "Edit Contract"
                : "Create New Contract"
          }
          description="Configure contract details"
          sections={[
            {
              fields: contractFields.map((field) => ({
                id: field.name,
                label: field.label,
                value: editingContract
                  ? String(editingContract[field.name as keyof Contract] || "")
                  : "",
                placeholder: field.placeholder,
                required: field.required,
                type: field.type,
                options: field.options,
                disabled: isReadOnly,
              })),
            },
          ]}
          onFieldChange={(fieldId, value) => {
            // Handle field changes
          }}
          onSubmit={async () => {
            const formData: any = {};
            contractFields.forEach((field) => {
              const element = document.getElementById(
                field.name,
              ) as HTMLInputElement;
              if (element) formData[field.name] = element.value;
            });
            await handleFormSubmit(formData);
          }}
          submitText={editingContract ? "Update Contract" : "Create Contract"}
          isSubmitting={isCreating || isUpdating}
          isReadOnly={isReadOnly}
        />

        <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sign Contract</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="signature">Digital Signature</Label>
                <Input
                  id="signature"
                  value={signatureData.signature}
                  onChange={(e) =>
                    setSignatureData({
                      ...signatureData,
                      signature: e.target.value,
                    })
                  }
                  placeholder="Enter your digital signature"
                />
              </div>
              <div>
                <Label htmlFor="ipAddress">IP Address (Optional)</Label>
                <Input
                  id="ipAddress"
                  value={signatureData.ipAddress}
                  onChange={(e) =>
                    setSignatureData({
                      ...signatureData,
                      ipAddress: e.target.value,
                    })
                  }
                  placeholder="Your IP address"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSignDialogOpen(false)}
                disabled={isSigning}
              >
                Cancel
              </Button>
              <Button onClick={confirmSign} disabled={isSigning}>
                {isSigning ? "Signing..." : "Sign Contract"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={disburseDialogOpen} onOpenChange={setDisburseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Disburse Contract</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="method">Disbursement Method</Label>
                <select
                  id="method"
                  className="w-full p-2 border rounded"
                  value={disburseData.method}
                  onChange={(e) =>
                    setDisburseData({
                      ...disburseData,
                      method: e.target.value as any,
                    })
                  }
                >
                  <option value="ESEWA">eSewa</option>
                  <option value="FONEPAY">FonePay</option>
                  <option value="KHALTI">Khalti</option>
                  <option value="WALLET">Wallet</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
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
                  placeholder="Enter account number"
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
                  placeholder="Enter account name"
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
                  placeholder="Enter transaction ID"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDisburseDialogOpen(false)}
                disabled={isDisbursing}
              >
                Cancel
              </Button>
              <Button onClick={confirmDisburse} disabled={isDisbursing}>
                {isDisbursing ? "Disbursing..." : "Disburse"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={confirmDelete}
          title="Delete Contract"
          description={`Are you sure you want to delete contract "${contractToDelete?.contractNumber}"? This action cannot be undone.`}
          isLoading={isDeleting}
        />
      </div>
    </DashboardLayout>
  );
}
