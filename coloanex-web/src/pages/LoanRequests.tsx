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
    [user],
  );

  const isBorrower = useMemo(
    () => user?.roles?.some((ur) => ur.role.name === "Borrower") || false,
    [user],
  );

  const isAdmin = useMemo(
    () => user?.roles?.some((ur) => ur.role.name === "Admin") || false,
    [user],
  );

  const isLender = useMemo(
    () => user?.roles?.some((ur) => ur.role.name === "Lender") || false,
    [user],
  );

  const { data: tenantsData } = useGetTenantsQuery(
    { page: 1, limit: 100 },
    { skip: !isSuperAdmin && !isLender },
  );

  const { data: usersData } = useGetUsersQuery(
    { page: 1, limit: 1000 },
    { skip: isBorrower },
  );

  const tenantOptions = useMemo(
    () =>
      tenantsData?.data.map((tenant) => ({
        value: tenant.id,
        label: tenant.name,
      })) || [],
    [tenantsData],
  );

  const userOptions = useMemo(
    () =>
      usersData?.data.map((u) => ({
        value: u.id,
        label: `${u.fullName} (${u.email || u.phone})`,
      })) || [],
    [usersData],
  );

  // Form state - different from the actual DTO structure
  const [formData, setFormData] = useState<any>({
    requestedAmount: 0,
    purpose: "",
    collateralType: "",
    collateralDescription: "",
    collateralValue: 0,
    collateralImageUrl: "",
    requestedTermMonths: 0,
    tenantId: "",
    userId: "",
  });

  const [collateralImages, setCollateralImages] = useState<UploadedFile[]>([]);

  // Determine if user should be filtered by tenant
  const shouldFilterByTenant = useMemo(() => {
    return isLender || user?.roles?.some((ur) => ur.role.name === "Admin");
  }, [isLender, user]);

  const [filters, setFilters] = useState<LoanQuery>({
    page: 1,
    limit: 10,
    search: "",
    status: undefined,
    sortBy: "createdAt",
    sortOrder: "desc",
    tenantId:
      shouldFilterByTenant && user?.tenantId ? user.tenantId : undefined,
  });

  // Update filters when user changes
  useEffect(() => {
    if (shouldFilterByTenant && user?.tenantId) {
      setFilters((prev) => ({
        ...prev,
        tenantId: user.tenantId,
      }));
    }
  }, [shouldFilterByTenant, user?.tenantId]);

  const {
    data: loansData,
    isLoading,
    error: loansError,
  } = useGetLoansQuery(filters, { skip: !isAuthenticated });

  const loans = useMemo(
    () => (loansData?.data || []).filter((loan) => loan != null),
    [loansData],
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
    const collateral = (loan.collateralDetails as any) || {};
    setFormData({
      requestedAmount: loan.requestedAmount,
      purpose: loan.purpose,
      collateralType: collateral.type || "",
      collateralDescription: collateral.description || "",
      collateralValue: collateral.value || 0,
      collateralImageUrl: collateral.imageUrl || "",
      requestedTermMonths: loan.requestedTermMonths,
      tenantId: loan.tenantId,
      userId: loan.borrower?.userId,
    });
    // Set collateral images from existing loan
    const collateralImageUrl = collateral.imageUrl;
    if (collateralImageUrl) {
      setCollateralImages([
        {
          url: collateralImageUrl,
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
    const collateral = (loan.collateralDetails as any) || {};
    setFormData({
      requestedAmount: loan.requestedAmount,
      purpose: loan.purpose,
      collateralType: collateral.type || "",
      collateralDescription: collateral.description || "",
      collateralValue: collateral.value || 0,
      collateralImageUrl: collateral.imageUrl || "",
      requestedTermMonths: loan.requestedTermMonths,
      tenantId: loan.tenantId,
      userId: loan.borrower?.userId,
    });
    // Set collateral images from existing loan
    const collateralImageUrl = collateral.imageUrl;
    if (collateralImageUrl) {
      setCollateralImages([
        {
          url: collateralImageUrl,
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
    rejectionReason?: string,
    approvedAmount?: number,
    ruleId?: string,
    approvedTermMonths?: number,
  ) => {
    if (!selectedLoan) return;

    await reviewLoan({
      id: selectedLoan.id,
      data: {
        status,
        rejectionReason: rejectionReason?.trim() || undefined,
        approvedAmount: approvedAmount || undefined,
        ruleId: ruleId || undefined,
        approvedTermMonths: approvedTermMonths || undefined,
      },
    }).unwrap();

    toast({
      title: "Success",
      description: `Loan request ${status === LoanStatus.APPROVED ? "approved. Generate contract now" : status.toLowerCase()} successfully`,
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

    if (!formData.requestedAmount || formData.requestedAmount <= 0) {
      toast({
        title: "Validation Error",
        description: "Loan amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (!formData.requestedTermMonths || formData.requestedTermMonths <= 0) {
      toast({
        title: "Validation Error",
        description: "Term months must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    const loanData: CreateLoanDto = {
      requestedAmount: formData.requestedAmount || 0,
      purpose: formData.purpose || "",
      collateralDetails: {
        type: formData.collateralType || "",
        description: formData.collateralDescription || "",
        value: formData.collateralValue || 0,
        imageUrl: formData.collateralImageUrl || "",
      },
      requestedTermMonths: formData.requestedTermMonths || 0,
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
    // Auto-assign tenant for Admin/Lender users
    const shouldAutoSetTenant = (isAdmin || isLender) && user?.tenantId;

    setFormData({
      requestedAmount: 0,
      purpose: "",
      collateralType: "",
      collateralDescription: "",
      collateralValue: 0,
      collateralImageUrl: "",
      requestedTermMonths: 0,
      tenantId: shouldAutoSetTenant ? user.tenantId : "",
      userId: "",
    });
    setCollateralImages([]);
    setEditingLoan(null);
    setIsReadOnly(false);
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    if (
      fieldId === "requestedAmount" ||
      fieldId === "requestedTermMonths" ||
      fieldId === "collateralValue"
    ) {
      setFormData((prev) => ({ ...prev, [fieldId]: Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [fieldId]: value }));
    }
  };

  useEffect(() => {
    if (editingLoan && loanFormOpen) {
      const collateral = (editingLoan.collateralDetails as any) || {};
      setFormData({
        requestedAmount: editingLoan.requestedAmount,
        purpose: editingLoan.purpose,
        collateralType: collateral.type || "",
        collateralDescription: collateral.description || "",
        collateralValue: collateral.value || 0,
        collateralImageUrl: collateral.imageUrl || "",
        requestedTermMonths: editingLoan.requestedTermMonths,
        tenantId: editingLoan.tenantId || "",
        userId: editingLoan.borrower?.userId || "",
      });
      // Set collateral images from existing loan
      const collateralImageUrl = collateral.imageUrl;
      if (collateralImageUrl) {
        setCollateralImages([
          {
            url: collateralImageUrl,
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
      [LoanStatus.SUBMITTED]: {
        variant: "secondary",
        label: "Submitted",
      },
      [LoanStatus.UNDER_REVIEW]: {
        variant: "secondary",
        label: "Under Review",
      },
      [LoanStatus.APPROVED]: { variant: "default", label: "Approved" },
      [LoanStatus.REJECTED]: { variant: "destructive", label: "Rejected" },
      [LoanStatus.CONTRACT_GENERATED]: {
        variant: "default",
        label: "Contract Generated",
      },
      [LoanStatus.CONTRACT_SIGNED]: {
        variant: "default",
        label: "Contract Signed",
      },
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const columns: Column<Loan>[] = [
    {
      key: "borrower.user.fullName",
      label: "Borrower",
      sortable: false,
      render: (loan) => loan?.borrower?.user?.fullName || "N/A",
    },
    {
      key: "purpose",
      label: "Purpose",
      sortable: false,
      render: (loan) =>
        loan?.purpose
          ? loan.purpose.substring(0, 30) +
            (loan.purpose.length > 30 ? "..." : "")
          : "N/A",
    },
    {
      key: "requestedAmount",
      label: "Requested Amount",
      sortable: true,
      render: (loan) =>
        loan?.requestedAmount
          ? `NPR ${loan.requestedAmount.toLocaleString()}`
          : "N/A",
    },
    {
      key: "approvedAmount",
      label: "Approved Amount",
      sortable: true,
      render: (loan) =>
        loan?.approvedAmount
          ? `NPR ${loan.approvedAmount.toLocaleString()}`
          : "Pending",
    },
    {
      key: "collateralDetails.type",
      label: "Collateral Type",
      sortable: false,
      render: (loan) => (loan?.collateralDetails as any)?.type || "N/A",
    },
    {
      key: "collateralDetails.value",
      label: "Collateral Value",
      sortable: false,
      render: (loan) => {
        const value = (loan?.collateralDetails as any)?.value;
        return value ? `NPR ${Number(value).toLocaleString()}` : "N/A";
      },
    },
    {
      key: "requestedTermMonths",
      label: "Term",
      sortable: true,
      render: (loan) =>
        loan?.requestedTermMonths
          ? `${loan.requestedTermMonths} months`
          : "N/A",
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (loan) => (loan?.status ? getStatusBadge(loan.status) : "N/A"),
    },
    {
      key: "createdAt",
      label: "Created At",
      sortable: true,
      render: (loan) =>
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
    { value: LoanStatus.SUBMITTED, label: "Submitted" },
    { value: LoanStatus.UNDER_REVIEW, label: "Under Review" },
    { value: LoanStatus.APPROVED, label: "Approved" },
    { value: LoanStatus.REJECTED, label: "Rejected" },
    { value: LoanStatus.CONTRACT_GENERATED, label: "Contract Generated" },
    { value: LoanStatus.CONTRACT_SIGNED, label: "Contract Signed" },
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
      ...(isSuperAdmin
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
            id: "requestedAmount",
            label: "Requested Loan Amount (NPR)",
            value: String(formData.requestedAmount || ""),
            type: "number" as const,
            required: true,
            placeholder: "Enter requested loan amount",
            min: 1,
          },
          ...(isReadOnly && editingLoan?.approvedAmount
            ? [
                {
                  id: "approvedAmount",
                  label: "Approved Loan Amount (NPR)",
                  value: String(editingLoan.approvedAmount || ""),
                  type: "number" as const,
                  required: false,
                  placeholder: "Approved amount",
                  min: 0,
                },
              ]
            : []),
        ],
      },
      {
        title: "Loan Purpose",
        fields: [
          {
            id: "purpose",
            label: "Purpose of Loan",
            value: formData.purpose || "",
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
            id: "requestedTermMonths",
            label: "Term (Months)",
            value: String(formData.requestedTermMonths || ""),
            type: "number" as const,
            required: true,
            placeholder: "Enter term in months",
            min: 1,
          },
        ],
      },
      ...(isReadOnly &&
      editingLoan?.status === LoanStatus.REJECTED &&
      editingLoan?.rejectionReason
        ? [
            {
              title: "Rejection Information",
              fields: [
                {
                  id: "rejectionReason",
                  label: "Rejection Reason",
                  value: editingLoan.rejectionReason || "",
                  type: "textarea" as const,
                  required: false,
                  placeholder: "Reason for rejection",
                },
              ],
            },
          ]
        : []),
      ...(isReadOnly && editingLoan
        ? [
            {
              title: "Loan Information",
              fields: [
                {
                  id: "loanId",
                  label: "Loan ID",
                  value: editingLoan.id || "",
                  type: "text" as const,
                  required: false,
                  placeholder: "",
                },
                {
                  id: "createdAt",
                  label: "Created At",
                  value: editingLoan.createdAt
                    ? new Date(editingLoan.createdAt).toLocaleString()
                    : "",
                  type: "text" as const,
                  required: false,
                  placeholder: "",
                },
                {
                  id: "updatedAt",
                  label: "Last Updated",
                  value: editingLoan.updatedAt
                    ? new Date(editingLoan.updatedAt).toLocaleString()
                    : "",
                  type: "text" as const,
                  required: false,
                  placeholder: "",
                },
              ],
            },
          ]
        : []),
    ],
    [
      formData,
      isSuperAdmin,
      isLender,
      isBorrower,
      tenantOptions,
      userOptions,
      collateralImages,
      isReadOnly,
      editingLoan,
    ],
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
          emptyIcon={<FileText className="w-12 h-12 text-muted-foreground" />}
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
                (loan.status === LoanStatus.UNDER_REVIEW ||
                  loan.status === LoanStatus.SUBMITTED ||
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
                (loan.status === LoanStatus.UNDER_REVIEW ||
                  loan.status === LoanStatus.SUBMITTED),
            },
          ]}
        />

        {loansData && (
          <div className="mt-6">
            <Pagination
              currentPage={filters.page || 1}
              totalPages={Math.ceil(
                (loansData.total || 0) / (filters.limit || 10),
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
