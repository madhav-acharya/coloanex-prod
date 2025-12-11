import { useState, useEffect, useMemo } from "react";
import { Eye, FileText, Edit, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Pagination } from "@/components/ui/pagination";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FormLabel } from "@/components/ui/form-label";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import {
  useGetKycsQuery,
  useVerifyKycMutation,
  useCreateKycMutation,
  useDeleteKycMutation,
} from "@/apis/kycApi";
import { useGetTenantsQuery } from "@/apis/tenantsApi";
import { useGetUsersQuery } from "@/apis/usersApi";
import type {
  Kyc,
  KycDocumentsQuery,
  CreateKycDto,
  KycFile,
} from "@/types/kyc";
import { KycStatus, KycDocumentType, KycFileType } from "@/types/kyc";
import { useAuth } from "@/hooks/useAuth";
import { KycVerificationModal } from "@/components/modals/KycVerificationModal";
import { FormSheet } from "@/components/shared/FormSheet";
import { type UploadedFile } from "@/components/shared/FileUploader";

const documentTypeOptions = [
  { value: KycDocumentType.CITIZENSHIP, label: "Citizenship" },
  { value: KycDocumentType.PASSPORT, label: "Passport" },
  { value: KycDocumentType.DRIVING_LICENSE, label: "Driving License" },
  { value: KycDocumentType.PAN, label: "PAN Card" },
  { value: KycDocumentType.OTHER, label: "Other" },
];

const genderOptions = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

const maritalStatusOptions = [
  { value: "SINGLE", label: "Single" },
  { value: "MARRIED", label: "Married" },
  { value: "DIVORCED", label: "Divorced" },
  { value: "WIDOWED", label: "Widowed" },
];

export default function KycRequests() {
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const [kycFormOpen, setKycFormOpen] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Kyc | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [kycToDelete, setKycToDelete] = useState<Kyc | null>(null);
  const [isDeletingKyc, setIsDeletingKyc] = useState(false);
  const [editingKyc, setEditingKyc] = useState<Kyc | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const [createKyc, { isLoading: isCreating }] = useCreateKycMutation();
  const [deleteKyc] = useDeleteKycMutation();

  // Check if user is super admin
  const isSuperAdmin = useMemo(
    () => user?.roles.some((r) => r.role.name === "Super Admin") || false,
    [user]
  );

  const isBorrower = useMemo(
    () => user?.roles.some((r) => r.role.name === "Borrower") || false,
    [user]
  );

  const isLender = useMemo(
    () => user?.roles.some((r) => r.role.name === "Lender") || false,
    [user]
  );

  // Fetch tenants for super admin
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

  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // KYC Form State
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>([]);
  const [formData, setFormData] = useState<Partial<CreateKycDto>>({
    documentTypes: [],
    firstName: "",
    lastName: "",
    dateOfBirth: "",
  });

  const [files, setFiles] = useState<{
    citizenshipFront: UploadedFile[];
    citizenshipBack: UploadedFile[];
    passport: UploadedFile[];
    pan: UploadedFile[];
    licenseFront: UploadedFile[];
    licenseBack: UploadedFile[];
    selfie: UploadedFile[];
    collateral: UploadedFile[];
    supporting: UploadedFile[];
  }>({
    citizenshipFront: [],
    citizenshipBack: [],
    passport: [],
    pan: [],
    licenseFront: [],
    licenseBack: [],
    selfie: [],
    collateral: [],
    supporting: [],
  });

  const [filters, setFilters] = useState<KycDocumentsQuery>({
    page: 1,
    limit: 10,
    search: "",
    status: KycStatus.PENDING,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const {
    data: kycDocumentsData,
    isLoading,
    error: kycDocumentsError,
  } = useGetKycsQuery(filters, { skip: !isAuthenticated });

  const [verifyKycDocument] = useVerifyKycMutation();

  const kycDocuments = useMemo(
    () => kycDocumentsData?.data || [],
    [kycDocumentsData]
  );

  useEffect(() => {
    if (kycDocumentsError) {
      const error = kycDocumentsError as {
        status?: number;
        data?: { message?: string };
      };
      const errorMessage =
        error.status === 403
          ? "You don't have permission to view KYC documents. Please contact your administrator."
          : error.data?.message || "Failed to load KYC documents";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [kycDocumentsError, toast]);

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleFilterChange = (name: string, value: string) => {
    if (name === "status") {
      setFilters((prev) => ({
        ...prev,
        status: value === "all" ? undefined : (value as KycStatus),
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

  const handleSelectRow = (docId: string) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  const handleViewVerifyKyc = (document: Kyc) => {
    setSelectedDocument(document);
    setVerificationModalOpen(true);
  };

  const handleViewKyc = (document: Kyc) => {
    setEditingKyc(document);
    setSelectedDocument(document);
    setIsReadOnly(true);
    setKycFormOpen(true);
  };

  const handleEditKyc = (document: Kyc) => {
    setEditingKyc(document);
    setSelectedDocument(document);
    setIsReadOnly(false);
    setKycFormOpen(true);
  };

  const handleDeleteClick = (document: Kyc) => {
    setKycToDelete(document);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!kycToDelete) return;

    setIsDeletingKyc(true);
    try {
      await deleteKyc(kycToDelete.id).unwrap();
      toast({
        title: "Success",
        description: "KYC document deleted successfully",
      });
      setDeleteDialogOpen(false);
      setKycToDelete(null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete KYC document",
        variant: "destructive",
      });
    } finally {
      setIsDeletingKyc(false);
    }
  };

  const handleVerifySelected = () => {
    if (selectedRows.size === 0) return;
    const firstSelectedDoc = kycDocuments.find((doc) =>
      selectedRows.has(doc.id)
    );
    if (firstSelectedDoc) {
      setSelectedDocument(firstSelectedDoc);
      setVerificationModalOpen(true);
    }
  };

  const handleVerificationSubmit = async (
    status: KycStatus,
    notes?: string
  ) => {
    if (!selectedDocument) return;

    try {
      await verifyKycDocument({
        id: selectedDocument.id,
        data: { status, notes },
      }).unwrap();

      toast({
        title: "Success",
        description: `KYC document ${status.toLowerCase()} successfully`,
      });

      const selectedArray = Array.from(selectedRows);
      const currentIndex = selectedArray.indexOf(selectedDocument.id);

      setSelectedRows((prev) => {
        const newSet = new Set(prev);
        newSet.delete(selectedDocument.id);
        return newSet;
      });

      if (currentIndex < selectedArray.length - 1) {
        const nextId = selectedArray[currentIndex + 1];
        const nextDoc = kycDocuments.find((doc) => doc.id === nextId);
        if (nextDoc) {
          setSelectedDocument(nextDoc);
          return;
        }
      }

      setVerificationModalOpen(false);
      setSelectedDocument(null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to verify KYC document",
        variant: "destructive",
      });
    }
  };

  const handleKycSubmit = async () => {
    if (selectedDocTypes.includes(KycDocumentType.CITIZENSHIP)) {
      if (!formData.citizenshipNumber) {
        toast({
          title: "Validation Error",
          description:
            "Citizenship number is required when CITIZENSHIP document type is selected",
          variant: "destructive",
        });
        return;
      }
      if (!formData.citizenshipIssueDate) {
        toast({
          title: "Validation Error",
          description:
            "Citizenship issue date is required when CITIZENSHIP document type is selected",
          variant: "destructive",
        });
        return;
      }
      if (!formData.citizenshipDistrict) {
        toast({
          title: "Validation Error",
          description:
            "Citizenship district is required when CITIZENSHIP document type is selected",
          variant: "destructive",
        });
        return;
      }
      if (files.citizenshipFront.length === 0) {
        toast({
          title: "Validation Error",
          description: "Citizenship front image is required",
          variant: "destructive",
        });
        return;
      }
      if (files.citizenshipBack.length === 0) {
        toast({
          title: "Validation Error",
          description: "Citizenship back image is required",
          variant: "destructive",
        });
        return;
      }
    }

    if (selectedDocTypes.includes(KycDocumentType.PASSPORT)) {
      if (!formData.passportNumber) {
        toast({
          title: "Validation Error",
          description:
            "Passport number is required when PASSPORT document type is selected",
          variant: "destructive",
        });
        return;
      }
      if (!formData.passportIssueDate) {
        toast({
          title: "Validation Error",
          description:
            "Passport issue date is required when PASSPORT document type is selected",
          variant: "destructive",
        });
        return;
      }
      if (!formData.passportExpiryDate) {
        toast({
          title: "Validation Error",
          description:
            "Passport expiry date is required when PASSPORT document type is selected",
          variant: "destructive",
        });
        return;
      }
      if (files.passport.length === 0) {
        toast({
          title: "Validation Error",
          description: "Passport document is required",
          variant: "destructive",
        });
        return;
      }
    }

    if (selectedDocTypes.includes(KycDocumentType.PAN)) {
      if (!formData.panNumber) {
        toast({
          title: "Validation Error",
          description:
            "PAN number is required when PAN document type is selected",
          variant: "destructive",
        });
        return;
      }
      if (files.pan.length === 0) {
        toast({
          title: "Validation Error",
          description: "PAN card image is required",
          variant: "destructive",
        });
        return;
      }
    }

    if (selectedDocTypes.includes(KycDocumentType.DRIVING_LICENSE)) {
      if (!formData.licenseNumber) {
        toast({
          title: "Validation Error",
          description:
            "License number is required when DRIVING_LICENSE document type is selected",
          variant: "destructive",
        });
        return;
      }
      if (!formData.licenseIssueDate) {
        toast({
          title: "Validation Error",
          description:
            "License issue date is required when DRIVING_LICENSE document type is selected",
          variant: "destructive",
        });
        return;
      }
      if (!formData.licenseExpiryDate) {
        toast({
          title: "Validation Error",
          description:
            "License expiry date is required when DRIVING_LICENSE document type is selected",
          variant: "destructive",
        });
        return;
      }
      if (files.licenseFront.length === 0) {
        toast({
          title: "Validation Error",
          description: "License front image is required",
          variant: "destructive",
        });
        return;
      }
      if (files.licenseBack.length === 0) {
        toast({
          title: "Validation Error",
          description: "License back image is required",
          variant: "destructive",
        });
        return;
      }
    }

    const allFiles: KycFile[] = [];

    if (selectedDocTypes.includes(KycDocumentType.CITIZENSHIP)) {
      files.citizenshipFront.forEach((f) =>
        allFiles.push({
          fileType: KycFileType.CITIZENSHIP_FRONT,
          documentType: KycDocumentType.CITIZENSHIP,
          fileUrl: f.url,
          fileName: f.fileName,
          mimeType: f.mimeType,
          sizeInBytes: f.sizeInBytes,
        })
      );
      files.citizenshipBack.forEach((f) =>
        allFiles.push({
          fileType: KycFileType.CITIZENSHIP_BACK,
          documentType: KycDocumentType.CITIZENSHIP,
          fileUrl: f.url,
          fileName: f.fileName,
          mimeType: f.mimeType,
          sizeInBytes: f.sizeInBytes,
        })
      );
    }

    if (selectedDocTypes.includes(KycDocumentType.PASSPORT)) {
      files.passport.forEach((f) =>
        allFiles.push({
          fileType: KycFileType.PASSPORT,
          documentType: KycDocumentType.PASSPORT,
          fileUrl: f.url,
          fileName: f.fileName,
          mimeType: f.mimeType,
          sizeInBytes: f.sizeInBytes,
        })
      );
    }

    if (selectedDocTypes.includes(KycDocumentType.PAN)) {
      files.pan.forEach((f) =>
        allFiles.push({
          fileType: KycFileType.PAN,
          documentType: KycDocumentType.PAN,
          fileUrl: f.url,
          fileName: f.fileName,
          mimeType: f.mimeType,
          sizeInBytes: f.sizeInBytes,
        })
      );
    }

    if (selectedDocTypes.includes(KycDocumentType.DRIVING_LICENSE)) {
      files.licenseFront.forEach((f) =>
        allFiles.push({
          fileType: KycFileType.LICENSE_FRONT,
          documentType: KycDocumentType.DRIVING_LICENSE,
          fileUrl: f.url,
          fileName: f.fileName,
          mimeType: f.mimeType,
          sizeInBytes: f.sizeInBytes,
        })
      );
      files.licenseBack.forEach((f) =>
        allFiles.push({
          fileType: KycFileType.LICENSE_BACK,
          documentType: KycDocumentType.DRIVING_LICENSE,
          fileUrl: f.url,
          fileName: f.fileName,
          mimeType: f.mimeType,
          sizeInBytes: f.sizeInBytes,
        })
      );
    }

    files.selfie.forEach((f) =>
      allFiles.push({
        fileType: KycFileType.SELFIE,
        fileUrl: f.url,
        fileName: f.fileName,
        mimeType: f.mimeType,
        sizeInBytes: f.sizeInBytes,
      })
    );

    files.collateral.forEach((f) =>
      allFiles.push({
        fileType: KycFileType.COLLATERAL_PHOTO,
        fileUrl: f.url,
        fileName: f.fileName,
        mimeType: f.mimeType,
        sizeInBytes: f.sizeInBytes,
      })
    );

    files.supporting.forEach((f) =>
      allFiles.push({
        fileType: KycFileType.SUPPORTING_DOCUMENT,
        fileUrl: f.url,
        fileName: f.fileName,
        mimeType: f.mimeType,
        sizeInBytes: f.sizeInBytes,
      })
    );

    const kycData: CreateKycDto = {
      ...formData,
      documentTypes: selectedDocTypes,
      files: allFiles,
    } as CreateKycDto;

    try {
      await createKyc(kycData).unwrap();

      toast({
        title: "Success",
        description: "KYC request submitted successfully",
      });

      setKycFormOpen(false);
      setEditingKyc(null);
      resetKycForm();
    } catch (error) {
      const err = error as { data?: { message?: string } };
      toast({
        title: "Error",
        description: err.data?.message || "Failed to submit KYC request",
        variant: "destructive",
      });
      throw error;
    }
  };

  const resetKycForm = () => {
    setSelectedDocTypes([]);
    setSelectedUserId("");
    setEditingKyc(null);
    setIsReadOnly(false);
    setFormData({
      documentTypes: [],
      firstName: "",
      lastName: "",
      dateOfBirth: "",
    });
    setFiles({
      citizenshipFront: [],
      citizenshipBack: [],
      passport: [],
      pan: [],
      licenseFront: [],
      licenseBack: [],
      selfie: [],
      collateral: [],
      supporting: [],
    });
  };

  const handleDocTypeToggle = (docType: string) => {
    setSelectedDocTypes((prev) => {
      const newTypes = prev.includes(docType)
        ? prev.filter((t) => t !== docType)
        : [...prev, docType];
      setFormData((fd) => ({ ...fd, documentTypes: newTypes }));
      return newTypes;
    });
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    if (fieldId === "userId") {
      setSelectedUserId(value);
    } else {
      setFormData((prev) => ({ ...prev, [fieldId]: value }));
    }
  };

  useEffect(() => {
    if (editingKyc && kycFormOpen) {
      setFormData({
        firstName: editingKyc.firstName || "",
        middleName: editingKyc.middleName || "",
        lastName: editingKyc.lastName || "",
        dateOfBirth: editingKyc.dateOfBirth || "",
        gender: editingKyc.gender || "",
        maritalStatus: editingKyc.maritalStatus || "",
        spouseName: editingKyc.spouseName || "",
        fatherName: editingKyc.fatherName || "",
        motherName: editingKyc.motherName || "",
        grandfatherName: editingKyc.grandfatherName || "",
        citizenshipNumber: editingKyc.citizenshipNumber || "",
        citizenshipIssueDate: editingKyc.citizenshipIssueDate || "",
        citizenshipDistrict: editingKyc.citizenshipDistrict || "",
        passportNumber: editingKyc.passportNumber || "",
        passportIssueDate: editingKyc.passportIssueDate || "",
        passportExpiryDate: editingKyc.passportExpiryDate || "",
        panNumber: editingKyc.panNumber || "",
        licenseNumber: editingKyc.licenseNumber || "",
        licenseIssueDate: editingKyc.licenseIssueDate || "",
        licenseExpiryDate: editingKyc.licenseExpiryDate || "",
        permanentProvince: editingKyc.permanentProvince || "",
        permanentDistrict: editingKyc.permanentDistrict || "",
        permanentMunicipality: editingKyc.permanentMunicipality || "",
        permanentWard: editingKyc.permanentWard || "",
        permanentTole: editingKyc.permanentTole || "",
        temporaryProvince: editingKyc.temporaryProvince || "",
        temporaryDistrict: editingKyc.temporaryDistrict || "",
        temporaryMunicipality: editingKyc.temporaryMunicipality || "",
        temporaryWard: editingKyc.temporaryWard || "",
        temporaryTole: editingKyc.temporaryTole || "",
        phoneNumber: editingKyc.phoneNumber || "",
        alternatePhone: editingKyc.alternatePhone || "",
        email: editingKyc.email || "",
        occupation: editingKyc.occupation || "",
        employerName: editingKyc.employerName || "",
        monthlyIncome: editingKyc.monthlyIncome,
        bankName: editingKyc.bankName || "",
        bankAccountNumber: editingKyc.bankAccountNumber || "",
        bankBranch: editingKyc.bankBranch || "",
        loanAmount: editingKyc.loanAmount,
        loanPurpose: editingKyc.loanPurpose || "",
        loanDuration: editingKyc.loanDuration,
        collateralType: editingKyc.collateralType || "",
        collateralDescription: editingKyc.collateralDescription || "",
        collateralValue: editingKyc.collateralValue,
        documentTypes: editingKyc.documentTypes || [],
        tenantId: editingKyc.borrower?.tenantId || "",
      } as CreateKycDto);
      setSelectedDocTypes(editingKyc.documentTypes || []);
      if (editingKyc.borrower?.userId) {
        setSelectedUserId(editingKyc.borrower.userId);
      }

      if (editingKyc.files && editingKyc.files.length > 0) {
        const newFiles = {
          citizenshipFront: [],
          citizenshipBack: [],
          passport: [],
          pan: [],
          licenseFront: [],
          licenseBack: [],
          selfie: [],
          collateral: [],
          supporting: [],
        };

        editingKyc.files.forEach((file) => {
          const uploadedFile: UploadedFile = {
            url: file.fileUrl,
            fileName: file.fileName || "",
            mimeType: file.mimeType || "",
            sizeInBytes: file.sizeInBytes || 0,
          };

          switch (file.fileType) {
            case "CITIZENSHIP_FRONT":
              newFiles.citizenshipFront.push(uploadedFile);
              break;
            case "CITIZENSHIP_BACK":
              newFiles.citizenshipBack.push(uploadedFile);
              break;
            case "PASSPORT":
              newFiles.passport.push(uploadedFile);
              break;
            case "PAN":
              newFiles.pan.push(uploadedFile);
              break;
            case "LICENSE_FRONT":
              newFiles.licenseFront.push(uploadedFile);
              break;
            case "LICENSE_BACK":
              newFiles.licenseBack.push(uploadedFile);
              break;
            case "SELFIE":
              newFiles.selfie.push(uploadedFile);
              break;
            case "COLLATERAL_PHOTO":
              newFiles.collateral.push(uploadedFile);
              break;
            case "SUPPORTING_DOCUMENT":
              newFiles.supporting.push(uploadedFile);
              break;
          }
        });

        setFiles(newFiles);
      }
    }
  }, [editingKyc, kycFormOpen]);

  useEffect(() => {
    if (!kycFormOpen) {
      const timer = setTimeout(() => resetKycForm(), 150);
      return () => clearTimeout(timer);
    }
  }, [kycFormOpen]);

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
                  required: true,
                  placeholder: "Select a tenant",
                },
              ],
            },
          ]
        : []),
      ...(!isBorrower
        ? [
            {
              title: "User Selection",
              fields: [
                {
                  id: "userId",
                  label: "Select User",
                  value: selectedUserId,
                  type: "select" as const,
                  options: userOptions,
                  required: true,
                  placeholder: "Select a user",
                },
              ],
            },
          ]
        : []),
      // Document Type Selection
      {
        title: "Document Type Selection",
        customContent: (
          <div className="space-y-2">
            <FormLabel required>Document Types</FormLabel>
            <p className="text-sm text-gray-500 mb-3">
              Select one or more document types you want to submit
            </p>
            <div className="grid grid-cols-2 gap-3">
              {documentTypeOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.value}
                    checked={selectedDocTypes.includes(option.value)}
                    onCheckedChange={() => handleDocTypeToggle(option.value)}
                    disabled={isReadOnly}
                  />
                  <label
                    htmlFor={option.value}
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        title: "Basic Information",
        fields: [
          {
            id: "firstName",
            label: "First Name",
            value: formData.firstName || "",
            required: true,
            placeholder: "Enter first name",
          },
          {
            id: "middleName",
            label: "Middle Name",
            value: formData.middleName || "",
            placeholder: "Enter middle name",
          },
          {
            id: "lastName",
            label: "Last Name",
            value: formData.lastName || "",
            required: true,
            placeholder: "Enter last name",
          },
          {
            id: "dateOfBirth",
            label: "Date of Birth",
            value: formData.dateOfBirth || "",
            type: "date",
            required: true,
          },
          {
            id: "gender",
            label: "Gender",
            value: formData.gender || "",
            type: "select",
            options: genderOptions,
          },
          {
            id: "maritalStatus",
            label: "Marital Status",
            value: formData.maritalStatus || "",
            type: "select",
            options: maritalStatusOptions,
          },
        ],
      },
      {
        title: "Family Information",
        fields: [
          {
            id: "spouseName",
            label: "Spouse Name",
            value: formData.spouseName || "",
            placeholder: "Enter spouse name",
          },
          {
            id: "fatherName",
            label: "Father's Name",
            value: formData.fatherName || "",
            placeholder: "Enter father's name",
          },
          {
            id: "motherName",
            label: "Mother's Name",
            value: formData.motherName || "",
            placeholder: "Enter mother's name",
          },
          {
            id: "grandfatherName",
            label: "Grandfather's Name",
            value: formData.grandfatherName || "",
            placeholder: "Enter grandfather's name",
          },
        ],
      },
      {
        title: "Citizenship Details",
        condition: selectedDocTypes.includes(KycDocumentType.CITIZENSHIP),
        fields: [
          {
            id: "citizenshipNumber",
            label: "Citizenship Number",
            value: formData.citizenshipNumber || "",
            required: true,
            placeholder: "Enter citizenship number",
          },
          {
            id: "citizenshipIssueDate",
            label: "Issue Date",
            value: formData.citizenshipIssueDate || "",
            type: "date",
            required: true,
          },
          {
            id: "citizenshipDistrict",
            label: "Issue District",
            value: formData.citizenshipDistrict || "",
            required: true,
            placeholder: "Enter issue district",
            colSpan: 2,
          },
        ],
        fileFields: [
          {
            label: "Citizenship Front",
            accept: "image" as const,
            maxFiles: 1,
            folder: "kyc/citizenship",
            value: files.citizenshipFront,
            onChange: (newFiles: UploadedFile[]) =>
              setFiles((prev) => ({ ...prev, citizenshipFront: newFiles })),
            required: true,
          },
          {
            label: "Citizenship Back",
            accept: "image" as const,
            maxFiles: 1,
            folder: "kyc/citizenship",
            value: files.citizenshipBack,
            onChange: (newFiles: UploadedFile[]) =>
              setFiles((prev) => ({ ...prev, citizenshipBack: newFiles })),
            required: true,
          },
        ],
      },
      {
        title: "Passport Details",
        condition: selectedDocTypes.includes(KycDocumentType.PASSPORT),
        fields: [
          {
            id: "passportNumber",
            label: "Passport Number",
            value: formData.passportNumber || "",
            required: true,
            placeholder: "Enter passport number",
          },
          {
            id: "passportIssueDate",
            label: "Issue Date",
            value: formData.passportIssueDate || "",
            type: "date",
            required: true,
          },
          {
            id: "passportExpiryDate",
            label: "Expiry Date",
            value: formData.passportExpiryDate || "",
            type: "date",
            required: true,
          },
        ],
        fileFields: [
          {
            label: "Passport (PDF only)",
            accept: "pdf" as const,
            maxFiles: 1,
            folder: "kyc/passport",
            value: files.passport,
            onChange: (newFiles: UploadedFile[]) =>
              setFiles((prev) => ({ ...prev, passport: newFiles })),
            required: true,
          },
        ],
      },
      {
        title: "PAN Details",
        condition: selectedDocTypes.includes(KycDocumentType.PAN),
        fields: [
          {
            id: "panNumber",
            label: "PAN Number",
            value: formData.panNumber || "",
            required: true,
            placeholder: "Enter PAN number",
          },
        ],
        fileFields: [
          {
            label: "PAN Card",
            accept: "image" as const,
            maxFiles: 1,
            folder: "kyc/pan",
            value: files.pan,
            onChange: (newFiles: UploadedFile[]) =>
              setFiles((prev) => ({ ...prev, pan: newFiles })),
            required: true,
          },
        ],
      },
      {
        title: "Driving License Details",
        condition: selectedDocTypes.includes(KycDocumentType.DRIVING_LICENSE),
        fields: [
          {
            id: "licenseNumber",
            label: "License Number",
            value: formData.licenseNumber || "",
            required: true,
            placeholder: "Enter license number",
          },
          {
            id: "licenseIssueDate",
            label: "Issue Date",
            value: formData.licenseIssueDate || "",
            type: "date",
            required: true,
          },
          {
            id: "licenseExpiryDate",
            label: "Expiry Date",
            value: formData.licenseExpiryDate || "",
            type: "date",
            required: true,
          },
        ],
        fileFields: [
          {
            label: "License Front",
            accept: "image" as const,
            maxFiles: 1,
            folder: "kyc/license",
            value: files.licenseFront,
            onChange: (newFiles: UploadedFile[]) =>
              setFiles((prev) => ({ ...prev, licenseFront: newFiles })),
            required: true,
          },
          {
            label: "License Back",
            accept: "image" as const,
            maxFiles: 1,
            folder: "kyc/license",
            value: files.licenseBack,
            onChange: (newFiles: UploadedFile[]) =>
              setFiles((prev) => ({ ...prev, licenseBack: newFiles })),
            required: true,
          },
        ],
      },
      {
        title: "Permanent Address",
        fields: [
          {
            id: "permanentProvince",
            label: "Province",
            value: formData.permanentProvince || "",
            placeholder: "Enter province",
          },
          {
            id: "permanentDistrict",
            label: "District",
            value: formData.permanentDistrict || "",
            placeholder: "Enter district",
          },
          {
            id: "permanentMunicipality",
            label: "Municipality",
            value: formData.permanentMunicipality || "",
            placeholder: "Enter municipality",
          },
          {
            id: "permanentWard",
            label: "Ward No.",
            value: formData.permanentWard || "",
            placeholder: "Enter ward number",
          },
          {
            id: "permanentTole",
            label: "Tole/Street",
            value: formData.permanentTole || "",
            placeholder: "Enter tole/street",
            colSpan: 2,
          },
        ],
      },
      {
        title: "Temporary Address",
        fields: [
          {
            id: "temporaryProvince",
            label: "Province",
            value: formData.temporaryProvince || "",
            placeholder: "Enter province",
          },
          {
            id: "temporaryDistrict",
            label: "District",
            value: formData.temporaryDistrict || "",
            placeholder: "Enter district",
          },
          {
            id: "temporaryMunicipality",
            label: "Municipality",
            value: formData.temporaryMunicipality || "",
            placeholder: "Enter municipality",
          },
          {
            id: "temporaryWard",
            label: "Ward No.",
            value: formData.temporaryWard || "",
            placeholder: "Enter ward number",
          },
          {
            id: "temporaryTole",
            label: "Tole/Street",
            value: formData.temporaryTole || "",
            placeholder: "Enter tole/street",
            colSpan: 2,
          },
        ],
      },
      {
        title: "Contact Information",
        fields: [
          {
            id: "phoneNumber",
            label: "Phone Number",
            value: formData.phoneNumber || "",
            type: "tel",
            placeholder: "Enter phone number",
          },
          {
            id: "alternatePhone",
            label: "Alternate Phone",
            value: formData.alternatePhone || "",
            type: "tel",
            placeholder: "Enter alternate phone",
          },
          {
            id: "email",
            label: "Email",
            value: formData.email || "",
            type: "email",
            placeholder: "Enter email address",
            colSpan: 2,
          },
        ],
      },
      {
        title: "Employment Information",
        fields: [
          {
            id: "occupation",
            label: "Occupation",
            value: formData.occupation || "",
            placeholder: "Enter occupation",
          },
          {
            id: "employerName",
            label: "Employer Name",
            value: formData.employerName || "",
            placeholder: "Enter employer name",
          },
          {
            id: "monthlyIncome",
            label: "Monthly Income",
            value: formData.monthlyIncome?.toString() || "",
            type: "number",
            placeholder: "Enter monthly income",
          },
        ],
      },
      {
        title: "Bank Information",
        fields: [
          {
            id: "bankName",
            label: "Bank Name",
            value: formData.bankName || "",
            placeholder: "Enter bank name",
          },
          {
            id: "bankAccountNumber",
            label: "Account Number",
            value: formData.bankAccountNumber || "",
            placeholder: "Enter account number",
          },
          {
            id: "bankBranch",
            label: "Branch",
            value: formData.bankBranch || "",
            placeholder: "Enter branch name",
          },
        ],
      },
      {
        title: "Loan Requirements",
        fields: [
          {
            id: "loanAmount",
            label: "Loan Amount",
            value: formData.loanAmount?.toString() || "",
            type: "number",
            placeholder: "Enter loan amount",
          },
          {
            id: "loanDuration",
            label: "Duration (months)",
            value: formData.loanDuration?.toString() || "",
            type: "number",
            placeholder: "Enter duration",
          },
          {
            id: "loanPurpose",
            label: "Loan Purpose",
            value: formData.loanPurpose || "",
            type: "textarea",
            placeholder: "Describe the purpose of loan",
            colSpan: 2,
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
            placeholder: "e.g., Property, Vehicle, Gold",
            required: true,
          },
          {
            id: "collateralValue",
            label: "Estimated Value",
            value: formData.collateralValue?.toString() || "",
            type: "number",
            placeholder: "Enter estimated value",
            required: true,
          },
          {
            id: "collateralDescription",
            label: "Description",
            value: formData.collateralDescription || "",
            type: "textarea",
            placeholder: "Describe the collateral",
            required: true,
          },
        ],
        fileFields: [
          {
            label: "Collateral Photos",
            accept: "image" as const,
            multiple: true,
            maxFiles: 5,
            folder: "kyc/collateral",
            value: files.collateral,
            onChange: (newFiles: UploadedFile[]) =>
              setFiles((prev) => ({ ...prev, collateral: newFiles })),
          },
        ],
      },
      {
        title: "Additional Documents",
        fileFields: [
          {
            label: "Selfie/Photo",
            accept: "image" as const,
            maxFiles: 1,
            folder: "kyc/selfie",
            value: files.selfie,
            onChange: (newFiles: UploadedFile[]) =>
              setFiles((prev) => ({ ...prev, selfie: newFiles })),
          },
          {
            label: "Supporting Documents",
            accept: "image,pdf" as const,
            multiple: true,
            maxFiles: 10,
            folder: "kyc/supporting",
            value: files.supporting,
            onChange: (newFiles: UploadedFile[]) =>
              setFiles((prev) => ({ ...prev, supporting: newFiles })),
          },
        ],
      },
    ],
    [
      formData,
      selectedDocTypes,
      files,
      isSuperAdmin,
      isLender,
      isBorrower,
      tenantOptions,
      userOptions,
      selectedUserId,
      isReadOnly,
    ]
  );

  const getStatusBadge = (status: KycStatus) => {
    switch (status) {
      case KycStatus.VERIFIED:
        return <Badge className="bg-green-500">Verified</Badge>;
      case KycStatus.REJECTED:
        return <Badge className="bg-red-500">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>;
    }
  };

  const columns: Column<Kyc>[] = [
    {
      key: "select",
      label: "",
      sortable: false,
      render: (_value, doc: Kyc) => (
        <Checkbox
          checked={selectedRows.has(doc.id)}
          onCheckedChange={() => handleSelectRow(doc.id)}
        />
      ),
    },
    {
      key: "firstName",
      label: "Borrower Name",
      sortable: true,
      render: (_value, doc: Kyc) => (
        <div>
          <div className="font-medium">
            {doc.borrower?.user?.fullName || `${doc.firstName} ${doc.lastName}`}
          </div>
          <div className="text-sm text-gray-500">
            {doc.borrower?.user?.email || doc.email || "N/A"}
          </div>
        </div>
      ),
    },
    {
      key: "documentTypes",
      label: "Document Types",
      sortable: true,
      render: (_value, doc: Kyc) => (
        <div className="flex flex-wrap gap-1">
          {doc.documentTypes?.map((type) => (
            <Badge key={type} variant="outline" className="text-xs">
              {type}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "citizenshipNumber",
      label: "Document Number",
      sortable: true,
      render: (_value, doc: Kyc) => (
        <span>
          {doc.citizenshipNumber ||
            doc.passportNumber ||
            doc.panNumber ||
            doc.licenseNumber ||
            "N/A"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (_value, doc: Kyc) => getStatusBadge(doc.status),
    },
    {
      key: "createdAt",
      label: "Submitted",
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  return (
    <DashboardLayout
      title="KYC Documents"
      description="Manage and verify KYC documents"
      searchPlaceholder="Search by name, citizenship, or passport number..."
      searchValue={filters.search || ""}
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
          label: "Add KYC Request",
          onClick: () => setKycFormOpen(true),
          variant: "default",
        },
      ]}
      filters={[
        {
          name: "status",
          type: "select",
          label: "Status",
          placeholder: "Filter by status",
          options: [
            { value: KycStatus.PENDING, label: "Pending" },
            { value: KycStatus.VERIFIED, label: "Verified" },
            { value: KycStatus.REJECTED, label: "Rejected" },
          ],
        },
      ]}
      filterValues={{
        status: filters.status || "all",
      }}
      onFilterChange={handleFilterChange}
    >
      <DataTable
        data={kycDocuments}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No KYC documents found"
        emptyIcon={<FileText className="w-12 h-12 text-gray-400" />}
        onSort={handleSort}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        actions={[
          {
            label: "View",
            icon: <Eye className="w-4 h-4" />,
            onClick: handleViewKyc,
          },
          {
            label: "View & Verify",
            icon: <Eye className="w-4 h-4" />,
            onClick: handleViewVerifyKyc,
          },
          {
            label: "Edit",
            icon: <Edit className="w-4 h-4" />,
            onClick: handleEditKyc,
          },
          {
            label: "Delete",
            icon: <Trash2 className="w-4 h-4" />,
            variant: "destructive",
            onClick: handleDeleteClick,
          },
        ]}
      />

      <div className="mt-6">
        <Pagination
          currentPage={filters.page || 1}
          totalPages={Math.ceil(
            (kycDocumentsData?.total || 0) / (filters.limit || 10)
          )}
          hasNextPage={
            (filters.page || 1) <
            Math.ceil((kycDocumentsData?.total || 0) / (filters.limit || 10))
          }
          hasPreviousPage={(filters.page || 1) > 1}
          total={kycDocumentsData?.total || 0}
          limit={filters.limit || 10}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      <FormSheet
        open={kycFormOpen}
        onOpenChange={setKycFormOpen}
        title={
          isReadOnly
            ? "View KYC Request"
            : editingKyc
            ? "Edit KYC Request"
            : "Add KYC Request"
        }
        description="Fill in all required information and upload necessary documents"
        sections={formSections}
        onFieldChange={handleFieldChange}
        onSubmit={handleKycSubmit}
        submitText="Submit KYC Request"
        isSubmitting={isCreating}
        isReadOnly={isReadOnly}
      />

      <KycVerificationModal
        open={verificationModalOpen}
        onOpenChange={setVerificationModalOpen}
        document={selectedDocument}
        onSubmit={handleVerificationSubmit}
        hasNext={
          selectedRows.size > 1 && selectedDocument
            ? Array.from(selectedRows).indexOf(selectedDocument.id) <
              selectedRows.size - 1
            : false
        }
      />

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete KYC Document"
        description="This will permanently delete this KYC document. This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={isDeletingKyc}
      />
    </DashboardLayout>
  );
}
