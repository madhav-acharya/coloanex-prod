import { useState, useMemo, useCallback } from "react";
import {
  Eye,
  Trash2,
  FileSignature,
  Send,
  FileText,
  Printer,
  Download,
} from "lucide-react";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useGetContractsQuery,
  useDeleteContractMutation,
  useSignContractMutation,
  useDisburseContractMutation,
  Contract,
  SignContractDto,
  DisburseContractDto,
} from "@/apis/contractsApi";

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
  DRAFT: "bg-gray-100 text-gray-700",
  GENERATED: "bg-blue-100 text-blue-700",
  SIGNED: "bg-purple-100 text-purple-700",
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  DEFAULTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  REPORTED: "bg-orange-100 text-orange-700",
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

function printContractHtml(html: string) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.addEventListener("load", () => setTimeout(() => win.print(), 400));
}

function exportContractHtml(html: string, contractNumber: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${contractNumber}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Contracts() {
  const { toast } = useToast();

  const [viewContract, setViewContract] = useState<Contract | null>(null);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [disburseDialogOpen, setDisburseDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToSign, setContractToSign] = useState<Contract | null>(null);
  const [contractToDisburse, setContractToDisburse] = useState<Contract | null>(
    null,
  );
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(
    null,
  );
  const [signatureData, setSignatureData] = useState({
    signature: "",
    ipAddress: "",
  });
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

  const { data: contracts = [], isLoading } = useGetContractsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [signContract, { isLoading: isSigning }] = useSignContractMutation();
  const [disburseContract, { isLoading: isDisbursing }] =
    useDisburseContractMutation();
  const [deleteContract, { isLoading: isDeleting }] =
    useDeleteContractMutation();

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
      key: "borrower",
      label: "Borrower",
      render: (c) => c.borrower?.user?.fullName ?? "—",
    },
    {
      key: "loanAmount",
      label: "Amount",
      sortable: true,
      render: (c) => `NPR ${c.loanAmount.toLocaleString()}`,
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
      render: (c) => `NPR ${c.outstandingBalance.toLocaleString()}`,
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (c) => new Date(c.createdAt).toLocaleDateString(),
    },
  ];

  const confirmDelete = async () => {
    if (!contractToDelete) return;
    try {
      await deleteContract(contractToDelete.id).unwrap();
      toast({ title: "Success", description: "Contract deleted successfully" });
      setDeleteDialogOpen(false);
      setContractToDelete(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.data?.message || "Failed to delete contract",
        variant: "destructive",
      });
    }
  };

  const confirmSign = async () => {
    if (!contractToSign) return;
    try {
      const data: SignContractDto = {
        signature: signatureData.signature,
        ipAddress: signatureData.ipAddress || undefined,
      };
      await signContract({ id: contractToSign.id, data }).unwrap();
      toast({ title: "Success", description: "Contract signed successfully" });
      setSignDialogOpen(false);
      setContractToSign(null);
      setSignatureData({ signature: "", ipAddress: "" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.data?.message || "Failed to sign contract",
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
      toast({ title: "Success", description: "Loan disbursed successfully" });
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

  const actions = [
    {
      label: "View Contract",
      icon: <Eye className="w-4 h-4" />,
      onClick: (c: Contract) => setViewContract(c),
    },
    {
      label: "Sign",
      icon: <FileSignature className="w-4 h-4" />,
      onClick: (c: Contract) => {
        setContractToSign(c);
        setSignDialogOpen(true);
      },
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
      title="Contracts"
      description="Manage loan contracts and disbursements"
      searchPlaceholder="Search by contract number..."
      searchValue={searchValue}
      onSearchChange={(v) => {
        setSearchValue(v);
        setCurrentPage(1);
      }}
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
          </DialogHeader>

          <div className="flex-1 overflow-hidden rounded border bg-white">
            {viewContract?.contractPdfUrl ? (
              <iframe
                srcDoc={viewContract.contractPdfUrl}
                title="Contract Preview"
                className="w-full h-full border-0"
                sandbox="allow-same-origin allow-popups"
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
                exportContractHtml(
                  viewContract.contractPdfUrl,
                  viewContract.contractNumber,
                )
              }
              disabled={!viewContract?.contractPdfUrl}
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              variant="outline"
              className="cursor-pointer gap-2"
              onClick={() =>
                viewContract?.contractPdfUrl &&
                printContractHtml(viewContract.contractPdfUrl)
              }
              disabled={!viewContract?.contractPdfUrl}
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
            {viewContract?.status === "GENERATED" && (
              <Button
                className="cursor-pointer gap-2 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  setContractToSign(viewContract);
                  setViewContract(null);
                  setSignDialogOpen(true);
                }}
              >
                <FileSignature className="w-4 h-4" />
                Sign Contract
              </Button>
            )}
            {viewContract?.status === "SIGNED" && (
              <Button
                className="cursor-pointer gap-2 bg-blue-600 hover:bg-blue-700 text-white"
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

      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <FileSignature className="w-5 h-5" />
              Sign Loan Agreement
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {contractToSign && (
              <div className="rounded border border-gray-200 bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-700 font-serif">
                <p className="mb-1">
                  <span className="font-semibold">Contract No.:</span>{" "}
                  {contractToSign.contractNumber}
                </p>
                <p className="mb-1">
                  <span className="font-semibold">Borrower:</span>{" "}
                  {contractToSign.borrower?.user?.fullName ?? "—"}
                </p>
                <p className="mb-1">
                  <span className="font-semibold">Loan Amount:</span> NPR{" "}
                  {contractToSign.loanAmount.toLocaleString()}
                </p>
                <p className="mb-1">
                  <span className="font-semibold">Interest Rate:</span>{" "}
                  {contractToSign.interestRate}% per month
                </p>
                <p className="mb-1">
                  <span className="font-semibold">Term:</span>{" "}
                  {contractToSign.termMonths} months &bull;{" "}
                  {contractToSign.totalInstallments} installments
                </p>
                <p>
                  <span className="font-semibold">Total Amount Due:</span> NPR{" "}
                  {contractToSign.totalAmountDue.toLocaleString()}
                </p>
              </div>
            )}
            <p className="text-xs leading-relaxed text-gray-600 font-serif border-l-2 border-gray-300 pl-3">
              By entering your full legal name below, you acknowledge that you
              have read, understood, and voluntarily agree to be bound by all
              terms and conditions of this Loan Agreement. Your typed name will
              serve as your electronic signature.
            </p>
            <div className="space-y-1">
              <Label htmlFor="signature" className="text-sm font-semibold">
                Full Legal Name (Electronic Signature)
              </Label>
              <Input
                id="signature"
                value={signatureData.signature}
                onChange={(e) =>
                  setSignatureData({
                    ...signatureData,
                    signature: e.target.value,
                  })
                }
                placeholder="Type your full legal name exactly"
                className="font-serif text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ipAddress" className="text-sm text-gray-500">
                IP Address (optional)
              </Label>
              <Input
                id="ipAddress"
                value={signatureData.ipAddress}
                onChange={(e) =>
                  setSignatureData({
                    ...signatureData,
                    ipAddress: e.target.value,
                  })
                }
                placeholder="e.g. 192.168.1.1"
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSignDialogOpen(false)}
              disabled={isSigning}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmSign}
              disabled={isSigning || !signatureData.signature.trim()}
              className="bg-black hover:bg-gray-900 text-white cursor-pointer font-serif"
            >
              {isSigning ? "Signing…" : "I Agree & Sign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={disburseDialogOpen} onOpenChange={setDisburseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disburse Loan</DialogTitle>
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
              className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            >
              {isDisbursing ? "Disbursing…" : "Disburse"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Contract"
        description={`Are you sure you want to delete contract "${contractToDelete?.contractNumber}"? This cannot be undone.`}
        isLoading={isDeleting}
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
      value: `NPR ${contract.loanAmount.toLocaleString()}`,
    },
    { label: "Interest Rate", value: `${contract.interestRate}%` },
    { label: "Term", value: `${contract.termMonths} months` },
    { label: "Payment Frequency", value: contract.paymentFrequency },
    {
      label: "Total Amount Due",
      value: `NPR ${contract.totalAmountDue.toLocaleString()}`,
    },
    {
      label: "Installment Amount",
      value: `NPR ${contract.installmentAmount.toLocaleString()}`,
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
          <div key={r.label} className="p-3 bg-muted/40 rounded-md">
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
              className="flex items-start gap-3 p-3 bg-muted/40 rounded-md"
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
          <pre className="whitespace-pre-wrap text-xs text-muted-foreground bg-muted/40 p-4 rounded-md leading-relaxed">
            {contract.termsAndConditions}
          </pre>
        </div>
      )}
    </div>
  );
}
