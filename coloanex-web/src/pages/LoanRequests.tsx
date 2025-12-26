import { useState, useEffect, useMemo } from "react";
import { Eye, Edit, Trash2, FileText } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Pagination } from "@/components/ui/pagination";
import { DataTable } from "@/components/shared/DataTable";
import { Column } from "@/types/components";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { FormSheet } from "@/components/shared/FormSheet";
import type { UploadedFile } from "@/types/upload";
import {
  useGetLoansQuery,
  useCreateLoanMutation,
  useUpdateLoanMutation,
  useDeleteLoanMutation,
  useReviewLoanMutation,
} from "@/apis/loansApi";
import { useGetTenantsQuery } from "@/apis/tenantsApi";
import { useGetUsersQuery } from "@/apis/usersApi";
import type { Loan, LoanQuery, CreateLoanDto } from "@/types/loan";
import { LoanStatus } from "@/types/loan";
import { useAuth } from "@/hooks/useAuth";
import { LoanReviewModal } from "@/components/modals/LoanReviewModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function LoanRequests() {
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const [loanFormOpen, setLoanFormOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);
  const [isDeletingLoan, setIsDeletingLoan] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  const [createLoan, { isLoading: isCreating }] = useCreateLoanMutation();
  const [updateLoan, { isLoading: isUpdating }] = useUpdateLoanMutation();
  const [deleteLoan] = useDeleteLoanMutation();
  const [reviewLoan, { isLoading: isReviewing }] = useReviewLoanMutation();

  const isSuperAdmin = useMemo(
    () => user?.roles?.some((ur) => ur.role.name === "Super Admin") || false,
    [user]
  );

  const isBorrower = useMemo(
    () => user?.roles?.some((ur) => ur.role.name === "Borrower") || false,
    [user]
  );

  const isLender = useMemo(
    () => user?.roles?.some((ur) => ur.role.name === "Lender") || false,
    [user]
  );

  const { data: tenantsData } = useGetTenantsQuery(
    { page: 1, limit: 100 },
    { skip: !isSuperAdmin && !isLender }
  );

  const { data: usersData } = useGetUsersQuery(
    { page: 1, limit: 1000 },
    { skip: isBorrower }
  );

  const tenantOptions = useMemo(
    () =>
      tenantsData?.data.map((tenant) => ({
        value: tenant.id,
        label: tenant.name,
      })) || [],
    [tenantsData]
  );

  const userOptions = useMemo(
    () =>
      usersData?.data.map((u) => ({
        value: u.id,
        label: `${u.fullName} (${u.email || u.phone})`,
      })) || [],
    [usersData]
  );

  const [formData, setFormData] = useState<Partial<CreateLoanDto>>({
    providedLoanAmount: 0,
    expectedLoanAmount: 0,
    loanPurpose: "",
    collateralType: "",
    collateralDescription: "",
    collateralValue: 0,
    collateralImageUrl: "",
    amount: 0,
    interestRate: 0,
    termMonths: 0,
    tenantId: "",
    userId: "",
  });

  const [collateralImages, setCollateralImages] = useState<UploadedFile[]>([]);

  const [filters, setFilters] = useState<LoanQuery>({
    page: 1,
    limit: 10,
    search: "",
    status: undefined,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const {
    data: loansData,
    isLoading,
    error: loansError,
  } = useGetLoansQuery(filters, { skip: !isAuthenticated });

  const loans = useMemo(
    () => (loansData?.data || []).filter((loan) => loan != null),
    [loansData]
  );

  useEffect(() => {
    if (loansError) {
      const error = loansError as {
        status?: number;
        data?: { message?: string };
      };
      const errorMessage =
        error.status === 403
          ? "You don't have permission to view loan requests. Please contact your administrator."
          : error.data?.message || "Failed to load loan requests";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [loansError, toast]);

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleFilterChange = (name: string, value: string) => {
    if (name === "status") {
      setFilters((prev) => ({
        ...prev,
        status: value === "all" ? undefined : (value as LoanStatus),
        page: 1,
      }));
    }
  };

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
      sortOrder:
        prev.sortBy === key && prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelectionChange = (selected: Set<string>) => {
    setSelectedRows(selected);
  };

  const handleViewLoan = (loan: Loan) => {
    setEditingLoan(loan);
    setIsReadOnly(true);
    setFormData({
      providedLoanAmount: loan.providedLoanAmount,
      expectedLoanAmount: loan.expectedLoanAmount,
      loanPurpose: loan.loanPurpose,
      collateralType: loan.collateralType,
      collateralDescription: loan.collateralDescription,
      collateralValue: loan.collateralValue,
      collateralImageUrl: loan.collateralImageUrl,
      amount: loan.amount,
      interestRate: loan.interestRate,
      termMonths: loan.termMonths,
      tenantId: loan.tenantId,
      userId: loan.borrower?.userId,
    });
    // Set collateral images from existing loan
    if (loan.collateralImageUrl) {
      setCollateralImages([
        {
          url: loan.collateralImageUrl,
          publicId: "",
          fileName: "Collateral Image",
          mimeType: "image/jpeg",
          sizeInBytes: 0,
        },
      ]);
    } else {
      setCollateralImages([]);
    }
    setLoanFormOpen(true);
  };

  const handleEditLoan = (loan: Loan) => {
    setEditingLoan(loan);
    setIsReadOnly(false);
    setFormData({
      providedLoanAmount: loan.providedLoanAmount,
      expectedLoanAmount: loan.expectedLoanAmount,
      loanPurpose: loan.loanPurpose,
      collateralType: loan.collateralType,
      collateralDescription: loan.collateralDescription,
      collateralValue: loan.collateralValue,
      collateralImageUrl: loan.collateralImageUrl,
      amount: loan.amount,
      interestRate: loan.interestRate,
      termMonths: loan.termMonths,
      tenantId: loan.tenantId,
      userId: loan.borrower?.userId,
    });
    // Set collateral images from existing loan
    if (loan.collateralImageUrl) {
      setCollateralImages([
        {
          url: loan.collateralImageUrl,
          publicId: "",
          fileName: "Collateral Image",
          mimeType: "image/jpeg",
          sizeInBytes: 0,
        },
      ]);
    } else {
      setCollateralImages([]);
    }
    setLoanFormOpen(true);
  };

  const handleDeleteClick = (loan: Loan) => {
    setLoanToDelete(loan);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!loanToDelete) return;

    setIsDeletingLoan(true);
    try {
      await deleteLoan(loanToDelete.id).unwrap();
      toast({
        title: "Success",
        description: "Loan request deleted successfully",
      });
      setDeleteDialogOpen(false);
      setLoanToDelete(null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to create loan request",
        variant: "destructive",
      });
    } finally {
      setIsDeletingLoan(false);
    }
  };

  const handleReviewClick = (loan: Loan) => {
    setSelectedLoan(loan);
    setReviewModalOpen(true);
  };

  const handleVerifySelected = () => {
    if (selectedRows.size === 0) return;
    const firstSelectedLoan = loans.find((loan) => selectedRows.has(loan.id));
    if (firstSelectedLoan) {
      setSelectedLoan(firstSelectedLoan);
      setReviewModalOpen(true);
    }
  };

  const handleReviewSubmit = async (
    status: LoanStatus,
    rejectionReason?: string
  ) => {
    if (!selectedLoan) return;

    await reviewLoan({
      id: selectedLoan.id,
      data: {
        status,
        rejectionReason: rejectionReason?.trim() || undefined,
      },
    }).unwrap();

    toast({
      title: "Success",
      description: `Loan request ${status.toLowerCase()} successfully`,
    });

    const selectedArray = Array.from(selectedRows);
    const currentIndex = selectedArray.indexOf(selectedLoan.id);

    if (currentIndex < selectedArray.length - 1) {
      const nextLoanId = selectedArray[currentIndex + 1];
      const nextLoan = loans.find((loan) => loan.id === nextLoanId);
      if (nextLoan) {
        setSelectedLoan(nextLoan);
        return;
      }
    }

    setReviewModalOpen(false);
    setSelectedLoan(null);
    setSelectedRows(new Set());
  };

  const handleLoanSubmit = async () => {
    // Validate tenant selection for Super Admin
    if (
      isSuperAdmin &&
      (!formData.tenantId || formData.tenantId.trim() === "")
    ) {
      toast({
        title: "Validation Error",
        description: "Tenant selection is required for Super Admin",
        variant: "destructive",
      });
      return;
    }

    // Validate all required fields
    if (!formData.providedLoanAmount || formData.providedLoanAmount <= 0) {
      toast({
        title: "Validation Error",
        description: "Provided loan amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (!formData.expectedLoanAmount || formData.expectedLoanAmount <= 0) {
      toast({
        title: "Validation Error",
        description: "Expected loan amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (!formData.loanPurpose || formData.loanPurpose.trim() === "") {
      toast({
        title: "Validation Error",
        description: "Loan purpose is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.collateralType || formData.collateralType.trim() === "") {
      toast({
        title: "Validation Error",
        description: "Collateral type is required",
        variant: "destructive",
      });
      return;
    }

    if (
      !formData.collateralDescription ||
      formData.collateralDescription.trim() === ""
    ) {
      toast({
        title: "Validation Error",
        description: "Collateral description is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.collateralValue || formData.collateralValue < 0) {
      toast({
        title: "Validation Error",
        description: "Collateral value must be 0 or greater",
        variant: "destructive",
      });
      return;
    }

    if (
      !formData.collateralImageUrl ||
      formData.collateralImageUrl.trim() === ""
    ) {
      toast({
        title: "Validation Error",
        description: "Collateral image URL is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      toast({
        title: "Validation Error",
        description: "Final loan amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (!formData.interestRate || formData.interestRate < 0) {
      toast({
        title: "Validation Error",
        description: "Interest rate must be 0 or greater",
        variant: "destructive",
      });
      return;
    }

    if (!formData.termMonths || formData.termMonths <= 0) {
      toast({
        title: "Validation Error",
        description: "Term months must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    const loanData: CreateLoanDto = {
      providedLoanAmount: formData.providedLoanAmount,
      expectedLoanAmount: formData.expectedLoanAmount,
      loanPurpose: formData.loanPurpose,
      collateralType: formData.collateralType,
      collateralDescription: formData.collateralDescription,
      collateralValue: formData.collateralValue,
      collateralImageUrl: formData.collateralImageUrl,
      amount: formData.amount,
      interestRate: formData.interestRate,
      termMonths: formData.termMonths,
      tenantId:
        formData.tenantId && formData.tenantId.trim() !== ""
          ? formData.tenantId
          : undefined,
      userId:
        formData.userId && formData.userId.trim() !== ""
          ? formData.userId
          : undefined,
    };

    try {
      if (editingLoan) {
        await updateLoan({ id: editingLoan.id, data: loanData }).unwrap();
        toast({
          title: "Success",
          description: "Loan request updated successfully",
        });
      } else {
        await createLoan(loanData).unwrap();
        toast({
          title: "Success",
          description: "Loan request created successfully",
        });
      }

      setLoanFormOpen(false);
      setEditingLoan(null);
      resetLoanForm();
    } catch (error) {
      const err = error as { data?: { message?: string } };
      toast({
        title: "Error",
        description: err.data?.message || "Failed to submit loan",
        variant: "destructive",
      });
    }
  };

  const resetLoanForm = () => {
    setFormData({
      providedLoanAmount: 0,
      expectedLoanAmount: 0,
      loanPurpose: "",
      collateralType: "",
      collateralDescription: "",
      collateralValue: 0,
      collateralImageUrl: "",
      amount: 0,
      interestRate: 0,
      termMonths: 0,
      tenantId: "",
      userId: "",
    });
    setCollateralImages([]);
    setEditingLoan(null);
    setIsReadOnly(false);
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    if (
      fieldId === "providedLoanAmount" ||
      fieldId === "expectedLoanAmount" ||
      fieldId === "amount" ||
      fieldId === "interestRate" ||
      fieldId === "termMonths" ||
      fieldId === "collateralValue"
    ) {
      setFormData((prev) => ({ ...prev, [fieldId]: Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [fieldId]: value }));
    }
  };

  useEffect(() => {
    if (editingLoan && loanFormOpen) {
      setFormData({
        providedLoanAmount: editingLoan.providedLoanAmount,
        expectedLoanAmount: editingLoan.expectedLoanAmount,
        loanPurpose: editingLoan.loanPurpose,
        collateralType: editingLoan.collateralType,
        collateralDescription: editingLoan.collateralDescription,
        collateralValue: editingLoan.collateralValue,
        collateralImageUrl: editingLoan.collateralImageUrl,
        amount: editingLoan.amount,
        interestRate: editingLoan.interestRate,
        termMonths: editingLoan.termMonths,
        tenantId: editingLoan.tenantId || "",
        userId: editingLoan.borrower?.userId || "",
      });
      // Set collateral images from existing loan
      if (editingLoan.collateralImageUrl) {
        setCollateralImages([
          {
            url: editingLoan.collateralImageUrl,
            publicId: "",
            fileName: "Collateral Image",
            mimeType: "image/jpeg",
            sizeInBytes: 0,
          },
        ]);
      } else {
        setCollateralImages([]);
      }
    }
  }, [editingLoan, loanFormOpen]);

  const getStatusBadge = (status: LoanStatus) => {
    const statusConfig: Record<
      LoanStatus,
      {
        variant: "default" | "destructive" | "outline" | "secondary";
        label: string;
      }
    > = {
      [LoanStatus.DRAFT]: { variant: "outline", label: "Draft" },
      [LoanStatus.PENDING_REVIEW]: {
        variant: "secondary",
        label: "Pending Review",
      },
      [LoanStatus.APPROVED]: { variant: "default", label: "Approved" },
      [LoanStatus.REJECTED]: { variant: "destructive", label: "Rejected" },
      [LoanStatus.DISBURSED]: { variant: "default", label: "Disbursed" },
      [LoanStatus.ACTIVE]: { variant: "default", label: "Active" },
      [LoanStatus.CLOSED]: { variant: "outline", label: "Closed" },
      [LoanStatus.DEFAULTED]: { variant: "destructive", label: "Defaulted" },
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const columns: Column<Loan>[] = [
    {
      key: "borrower.user.fullName",
      label: "Borrower",
      sortable: false,
      render: (_value, loan) => loan?.borrower?.user?.fullName || "N/A",
    },
    {
      key: "loanPurpose",
      label: "Purpose",
      sortable: false,
      render: (_value, loan) =>
        loan?.loanPurpose
          ? loan.loanPurpose.substring(0, 30) +
            (loan.loanPurpose.length > 30 ? "..." : "")
          : "N/A",
    },
    {
      key: "providedLoanAmount",
      label: "Provided Amount",
      sortable: true,
      render: (_value, loan) =>
        loan?.providedLoanAmount
          ? `NPR ${loan.providedLoanAmount.toLocaleString()}`
          : "N/A",
    },
    {
      key: "amount",
      label: "Final Amount",
      sortable: true,
      render: (_value, loan) =>
        loan?.amount ? `NPR ${loan.amount.toLocaleString()}` : "N/A",
    },
    {
      key: "collateralType",
      label: "Collateral",
      sortable: false,
      render: (_value, loan) => loan?.collateralType || "N/A",
    },
    {
      key: "interestRate",
      label: "Interest Rate",
      sortable: true,
      render: (_value, loan) =>
        loan?.interestRate !== undefined ? `${loan.interestRate}%` : "N/A",
    },
    {
      key: "termMonths",
      label: "Term",
      sortable: true,
      render: (_value, loan) =>
        loan?.termMonths ? `${loan.termMonths} months` : "N/A",
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (_value, loan) =>
        loan?.status ? getStatusBadge(loan.status) : "N/A",
    },
    {
      key: "createdAt",
      label: "Created At",
      sortable: true,
      render: (_value, loan) =>
        loan?.createdAt ? new Date(loan.createdAt).toLocaleDateString() : "N/A",
    },
  ];

  const loanFormFields = [
    ...(isSuperAdmin || isLender
      ? [
          {
            name: "tenantId",
            label: "Tenant",
            type: "select" as const,
            options: tenantOptions,
            required: isSuperAdmin,
            disabled: isReadOnly,
          },
        ]
      : []),
    ...(!isBorrower
      ? [
          {
            name: "userId",
            label: "Borrower User",
            type: "select" as const,
            options: userOptions,
            required: true,
            disabled: isReadOnly,
          },
        ]
      : []),
    {
      name: "amount",
      label: "Loan Amount (NPR)",
      type: "number" as const,
      required: true,
      disabled: isReadOnly,
      min: 1,
    },
    {
      name: "interestRate",
      label: "Interest Rate (%)",
      type: "number" as const,
      required: true,
      disabled: isReadOnly,
      min: 0,
      max: 100,
      step: 0.01,
    },
    {
      name: "termMonths",
      label: "Term (Months)",
      type: "number" as const,
      required: true,
      disabled: isReadOnly,
      min: 1,
    },
  ];

  const filterOptions = [
    { name: "status", label: "Status", value: filters.status || "all" },
  ];

  const statusFilterValues = [
    { value: "all", label: "All Statuses" },
    { value: LoanStatus.DRAFT, label: "Draft" },
    { value: LoanStatus.PENDING_REVIEW, label: "Pending Review" },
    { value: LoanStatus.APPROVED, label: "Approved" },
    { value: LoanStatus.REJECTED, label: "Rejected" },
    { value: LoanStatus.DISBURSED, label: "Disbursed" },
    { value: LoanStatus.ACTIVE, label: "Active" },
    { value: LoanStatus.CLOSED, label: "Closed" },
    { value: LoanStatus.DEFAULTED, label: "Defaulted" },
  ];

  const handleCollateralImageChange = (files: UploadedFile[]) => {
    setCollateralImages(files);
    if (files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        collateralImageUrl: files[0].url,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        collateralImageUrl: "",
      }));
    }
  };

  const formSections = useMemo(
    () => [
      ...(isSuperAdmin || isLender
        ? [
            {
              title: "Tenant Selection",
              fields: [
                {
                  id: "tenantId",
                  label: "Select Tenant",
                  value: formData.tenantId || "",
                  type: "select" as const,
                  options: tenantOptions,
                  required: isSuperAdmin,
                  placeholder: "Select a tenant",
                },
              ],
            },
          ]
        : []),
      ...(!isBorrower
        ? [
            {
              title: "Borrower Selection",
              fields: [
                {
                  id: "userId",
                  label: "Select Borrower",
                  value: formData.userId || "",
                  type: "select" as const,
                  options: userOptions,
                  required: true,
                  placeholder: "Select a borrower",
                },
              ],
            },
          ]
        : []),
      {
        title: "Loan Amount Details",
        fields: [
          {
            id: "providedLoanAmount",
            label: "Provided Loan Amount (NPR)",
            value: String(formData.providedLoanAmount || ""),
            type: "number" as const,
            required: true,
            placeholder: "Enter provided loan amount",
            min: 1,
          },
          {
            id: "expectedLoanAmount",
            label: "Expected Loan Amount (NPR)",
            value: String(formData.expectedLoanAmount || ""),
            type: "number" as const,
            required: true,
            placeholder: "Enter expected loan amount",
            min: 1,
          },
          {
            id: "amount",
            label: "Final Loan Amount (NPR)",
            value: String(formData.amount || ""),
            type: "number" as const,
            required: true,
            placeholder: "Enter final loan amount",
            min: 1,
          },
        ],
      },
      {
        title: "Loan Purpose",
        fields: [
          {
            id: "loanPurpose",
            label: "Purpose of Loan",
            value: formData.loanPurpose || "",
            type: "textarea" as const,
            required: true,
            placeholder: "Describe the purpose of this loan",
          },
        ],
      },
      {
        title: "Collateral Information",
        fields: [
          {
            id: "collateralType",
            label: "Collateral Type",
            value: formData.collateralType || "",
            type: "text" as const,
            required: true,
            placeholder: "e.g., Property, Vehicle, Jewelry",
          },
          {
            id: "collateralValue",
            label: "Collateral Value (NPR)",
            value: String(formData.collateralValue || ""),
            type: "number" as const,
            required: true,
            placeholder: "Enter collateral value",
            min: 0,
          },
          {
            id: "collateralDescription",
            label: "Collateral Description",
            value: formData.collateralDescription || "",
            type: "textarea" as const,
            required: true,
            placeholder: "Provide detailed description of the collateral",
          },
        ],
        fileFields: [
          {
            label: "Collateral Image",
            accept: "image" as const,
            multiple: false,
            maxFiles: 1,
            folder: "collateral",
            value: collateralImages,
            onChange: handleCollateralImageChange,
            required: true,
          },
        ],
      },
      {
        title: "Loan Terms",
        fields: [
          {
            id: "interestRate",
            label: "Interest Rate (%)",
            value: String(formData.interestRate || ""),
            type: "number" as const,
            required: true,
            placeholder: "Enter interest rate",
            min: 0,
            max: 100,
            step: 0.01,
          },
          {
            id: "termMonths",
            label: "Term (Months)",
            value: String(formData.termMonths || ""),
            type: "number" as const,
            required: true,
            placeholder: "Enter term in months",
            min: 1,
          },
        ],
      },
    ],
    [
      formData,
      isSuperAdmin,
      isLender,
      isBorrower,
      tenantOptions,
      userOptions,
      collateralImages,
    ]
  );

  const handleCreateLoan = () => {
    resetLoanForm();
    setLoanFormOpen(true);
  };

  return (
    <DashboardLayout
      title="Loan Request Management"
      description="Manage loan applications and requests"
      searchPlaceholder="Search by borrower name or email..."
      searchValue={filters.search}
      onSearchChange={handleSearchChange}
      actions={[
        {
          label:
            selectedRows.size > 0
              ? `Verify Selected (${selectedRows.size})`
              : "Verify Selected",
          onClick: handleVerifySelected,
          variant: "outline",
          disabled: selectedRows.size === 0,
        },
        {
          label: "New Loan Request",
          onClick: handleCreateLoan,
          variant: "default",
        },
      ]}
      filters={[
        {
          name: "status",
          type: "select",
          label: "Status",
          placeholder: "Filter by status",
          options: statusFilterValues.slice(1),
        },
      ]}
      filterValues={{
        status: filters.status || "all",
      }}
      onFilterChange={handleFilterChange}
    >
      <div className="space-y-6">
        <DataTable
          data={loans}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No loan requests found"
          emptyIcon={<FileText className="w-12 h-12 text-gray-400" />}
          onSort={handleSort}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          selectable={true}
          selectedRows={selectedRows}
          onSelectionChange={handleSelectionChange}
          getRowId={(row) => row.id}
          actions={[
            {
              label: "View",
              icon: <Eye className="w-4 h-4" />,
              onClick: handleViewLoan,
            },
            {
              label: "View & Verify",
              icon: <Eye className="w-4 h-4" />,
              onClick: handleReviewClick,
              show: (loan) =>
                (isSuperAdmin || isLender) &&
                (loan.status === LoanStatus.PENDING_REVIEW ||
                  loan.status === LoanStatus.DRAFT),
            },
            {
              label: "Edit",
              icon: <Edit className="w-4 h-4" />,
              onClick: handleEditLoan,
              show: (loan) =>
                isSuperAdmin ||
                isLender ||
                (isBorrower && loan.status === LoanStatus.DRAFT),
            },
            {
              label: "Delete",
              icon: <Trash2 className="w-4 h-4" />,
              variant: "destructive",
              onClick: handleDeleteClick,
              show: (loan) =>
                isSuperAdmin ||
                isLender ||
                (isBorrower && loan.status === LoanStatus.DRAFT),
            },
            {
              label: "Review",
              icon: <Eye className="w-4 h-4" />,
              onClick: handleReviewClick,
              show: (loan) =>
                (isSuperAdmin || isLender) &&
                loan.status === LoanStatus.PENDING_REVIEW,
            },
          ]}
        />

        {loansData && (
          <div className="mt-6">
            <Pagination
              currentPage={filters.page || 1}
              totalPages={Math.ceil(
                (loansData.total || 0) / (filters.limit || 10)
              )}
              hasNextPage={
                (filters.page || 1) <
                Math.ceil((loansData.total || 0) / (filters.limit || 10))
              }
              hasPreviousPage={(filters.page || 1) > 1}
              total={loansData.total || 0}
              limit={filters.limit || 10}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
      </div>

      <FormSheet
        open={loanFormOpen}
        onOpenChange={setLoanFormOpen}
        title={
          isReadOnly
            ? "View Loan Request"
            : editingLoan
            ? "Edit Loan Request"
            : "Create Loan Request"
        }
        description="Fill in all required information to submit a loan application"
        sections={formSections}
        onFieldChange={handleFieldChange}
        onSubmit={handleLoanSubmit}
        submitText={editingLoan ? "Update Loan Request" : "Submit Loan Request"}
        isSubmitting={isCreating || isUpdating}
        isReadOnly={isReadOnly}
      />

      <LoanReviewModal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        loan={selectedLoan}
        onSubmit={handleReviewSubmit}
        hasNext={
          selectedRows.size > 1 && selectedLoan
            ? Array.from(selectedRows).indexOf(selectedLoan.id) <
              selectedRows.size - 1
            : false
        }
      />

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Loan Request"
        description={`Are you sure you want to delete this loan request? This action cannot be undone.`}
        isLoading={isDeletingLoan}
      />
    </DashboardLayout>
  );
}
