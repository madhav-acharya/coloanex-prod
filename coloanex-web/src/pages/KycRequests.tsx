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
  useUpdateKycMutation,
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
  const [updateKyc, { isLoading: isUpdating }] = useUpdateKycMutation();
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

  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>([]);

  const [docMetadata, setDocMetadata] = useState<{
    citizenshipNumber?: string;
    citizenshipIssueDate?: string;
    citizenshipDistrict?: string;
    passportNumber?: string;
    passportIssueDate?: string;
    passportExpiryDate?: string;
    panNumber?: string;
    licenseNumber?: string;
    licenseIssueDate?: string;
    licenseExpiryDate?: string;
  }>({});

  const [formData, setFormData] = useState<Partial<CreateKycDto>>({
    documentTypes: [],
    tenantId: "",
    firstName: "",
    lastName: "",
    passportSizePhotoUrl: "",
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    fatherName: "",
    motherName: "",
    grandfatherName: "",
    permanentProvince: "",
    permanentDistrict: "",
    permanentMunicipality: "",
    permanentWard: "",
    permanentTole: "",
    occupation: "",
    monthlyIncome: 0,
    bankName: "",
    bankAccountNumber: "",
    bankBranch: "",
    loanAmount: 0,
    loanPurpose: "",
    loanDuration: 0,
    collateralType: "",
    collateralDescription: "",
    collateralValue: 0,
  });

  const [files, setFiles] = useState<{
    passportSizePhoto: UploadedFile[];
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
    passportSizePhoto: [],
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
    if (files.passportSizePhoto.length === 0) {
      toast({
        title: "Validation Error",
        description: "Passport size photo is required",
        variant: "destructive",
      });
      return;
    }

    if (selectedDocTypes.includes(KycDocumentType.CITIZENSHIP)) {
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

    if (files.passportSizePhoto.length > 0) {
      const photoFile = files.passportSizePhoto[0];
      formData.passportSizePhotoUrl = photoFile.url;
    }

    if (selectedDocTypes.includes(KycDocumentType.CITIZENSHIP)) {
      files.citizenshipFront.forEach((f) =>
        allFiles.push({
          fileType: KycFileType.CITIZENSHIP_FRONT,
          documentType: KycDocumentType.CITIZENSHIP,
          fileUrl: f.url,
          fileName: f.fileName,
          mimeType: f.mimeType,
          sizeInBytes: f.sizeInBytes,
          documentNumber: docMetadata.citizenshipNumber,
          issueDate: docMetadata.citizenshipIssueDate,
          issueDistrict: docMetadata.citizenshipDistrict,
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
          documentNumber: docMetadata.citizenshipNumber,
          issueDate: docMetadata.citizenshipIssueDate,
          issueDistrict: docMetadata.citizenshipDistrict,
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
          documentNumber: docMetadata.passportNumber,
          issueDate: docMetadata.passportIssueDate,
          expiryDate: docMetadata.passportExpiryDate,
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
          documentNumber: docMetadata.panNumber,
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
          documentNumber: docMetadata.licenseNumber,
          issueDate: docMetadata.licenseIssueDate,
          expiryDate: docMetadata.licenseExpiryDate,
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
          documentNumber: docMetadata.licenseNumber,
          issueDate: docMetadata.licenseIssueDate,
          expiryDate: docMetadata.licenseExpiryDate,
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
      tenantId:
        formData.tenantId && formData.tenantId.trim() !== ""
          ? formData.tenantId
          : undefined,
      userId:
        selectedUserId && selectedUserId.trim() !== ""
          ? selectedUserId
          : undefined,
    } as CreateKycDto;

    console.log("Submitting KYC with:", {
      tenantId: kycData.tenantId,
      userId: kycData.userId,
      selectedUserId,
      formDataTenantId: formData.tenantId,
    });

    try {
      if (editingKyc) {
        await updateKyc({ id: editingKyc.id, data: kycData }).unwrap();
        toast({
          title: "Success",
          description: "KYC request updated successfully",
        });
      } else {
        await createKyc(kycData).unwrap();
        toast({
          title: "Success",
          description: "KYC request submitted successfully",
        });
      }

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
    setDocMetadata({});
    setFormData({
      documentTypes: [],
      firstName: "",
      lastName: "",
      passportSizePhotoUrl: "",
      dateOfBirth: "",
      gender: "",
      maritalStatus: "",
      fatherName: "",
      motherName: "",
      grandfatherName: "",
      permanentProvince: "",
      permanentDistrict: "",
      permanentMunicipality: "",
      permanentWard: "",
      permanentTole: "",
      occupation: "",
      monthlyIncome: 0,
      bankName: "",
      bankAccountNumber: "",
      bankBranch: "",
      loanAmount: 0,
      loanPurpose: "",
      loanDuration: 0,
      collateralType: "",
      collateralDescription: "",
      collateralValue: 0,
    });
    setFiles({
      passportSizePhoto: [],
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
    const docMetadataFields = [
      "citizenshipNumber",
      "citizenshipIssueDate",
      "citizenshipDistrict",
      "passportNumber",
      "passportIssueDate",
      "passportExpiryDate",
      "panNumber",
      "licenseNumber",
      "licenseIssueDate",
      "licenseExpiryDate",
    ];

    if (fieldId === "userId") {
      setSelectedUserId(value);
    } else if (docMetadataFields.includes(fieldId)) {
      setDocMetadata((prev) => ({ ...prev, [fieldId]: value }));
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
        passportSizePhotoUrl: editingKyc.passportSizePhotoUrl || "",
        dateOfBirth: editingKyc.dateOfBirth
          ? new Date(editingKyc.dateOfBirth).toISOString().split("T")[0]
          : "",
        gender: editingKyc.gender || "",
        maritalStatus: editingKyc.maritalStatus || "",
        fatherName: editingKyc.fatherName || "",
        motherName: editingKyc.motherName || "",
        grandfatherName: editingKyc.grandfatherName || "",
        permanentProvince: editingKyc.permanentProvince || "",
        permanentDistrict: editingKyc.permanentDistrict || "",
        permanentMunicipality: editingKyc.permanentMunicipality || "",
        permanentWard: editingKyc.permanentWard || "",
        permanentTole: editingKyc.permanentTole || "",
        occupation: editingKyc.occupation || "",
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

      if (editingKyc.passportSizePhotoUrl) {
        setFiles((prev) => ({
          ...prev,
          passportSizePhoto: [
            {
              url: editingKyc.passportSizePhotoUrl,
              fileName: "passport-photo",
              mimeType: "image/jpeg",
              sizeInBytes: 0,
            },
          ],
        }));
      }

      if (editingKyc.files && editingKyc.files.length > 0) {
        const newFiles = {
          passportSizePhoto: editingKyc.passportSizePhotoUrl
            ? [
                {
                  url: editingKyc.passportSizePhotoUrl,
                  fileName: "passport-photo",
                  mimeType: "image/jpeg",
                  sizeInBytes: 0,
                },
              ]
            : [],
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

        const newDocMetadata = {
          citizenshipNumber: "",
          citizenshipIssueDate: "",
          citizenshipDistrict: "",
          passportNumber: "",
          passportIssueDate: "",
          passportExpiryDate: "",
          panNumber: "",
          licenseNumber: "",
          licenseIssueDate: "",
          licenseExpiryDate: "",
        };

        editingKyc.files.forEach((file) => {
          const uploadedFile: UploadedFile = {
            url: file.fileUrl,
            fileName: file.fileName || "",
            mimeType: file.mimeType || "",
            sizeInBytes: file.sizeInBytes || 0,
          };

          // Populate document metadata from file metadata
          if (
            file.documentType === KycDocumentType.CITIZENSHIP &&
            file.documentNumber
          ) {
            newDocMetadata.citizenshipNumber = file.documentNumber;
            newDocMetadata.citizenshipIssueDate = file.issueDate
              ? new Date(file.issueDate).toISOString().split("T")[0]
              : "";
            newDocMetadata.citizenshipDistrict = file.issueDistrict || "";
          } else if (
            file.documentType === KycDocumentType.PASSPORT &&
            file.documentNumber
          ) {
            newDocMetadata.passportNumber = file.documentNumber;
            newDocMetadata.passportIssueDate = file.issueDate
              ? new Date(file.issueDate).toISOString().split("T")[0]
              : "";
            newDocMetadata.passportExpiryDate = file.expiryDate
              ? new Date(file.expiryDate).toISOString().split("T")[0]
              : "";
          } else if (
            file.documentType === KycDocumentType.PAN &&
            file.documentNumber
          ) {
            newDocMetadata.panNumber = file.documentNumber;
          } else if (
            file.documentType === KycDocumentType.DRIVING_LICENSE &&
            file.documentNumber
          ) {
            newDocMetadata.licenseNumber = file.documentNumber;
            newDocMetadata.licenseIssueDate = file.issueDate
              ? new Date(file.issueDate).toISOString().split("T")[0]
              : "";
            newDocMetadata.licenseExpiryDate = file.expiryDate
              ? new Date(file.expiryDate).toISOString().split("T")[0]
              : "";
          }

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
        setDocMetadata(newDocMetadata);
      }
    }
  }, [editingKyc, kycFormOpen]);

  useEffect(() => {
    if (!kycFormOpen) {
      const timer = setTimeout(() => resetKycForm(), 150);
      return () => clearTimeout(timer);
    }
  }, [kycFormOpen]);

  useEffect(() => {
    if (selectedUserId && !editingKyc && usersData?.data) {
      const selectedUser = usersData.data.find((u) => u.id === selectedUserId);
      if (selectedUser) {
        const nameParts = selectedUser.fullName.split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        setFormData((prev) => ({
          ...prev,
          firstName,
          lastName,
        }));
      }
    }
  }, [selectedUserId, usersData, editingKyc]);

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
            required: true,
          },
          {
            id: "maritalStatus",
            label: "Marital Status",
            value: formData.maritalStatus || "",
            type: "select",
            options: maritalStatusOptions,
            required: true,
          },
        ],
        fileFields: [
          {
            label: "Passport Size Photo",
            accept: "image" as const,
            maxFiles: 1,
            folder: "kyc/photos",
            value: files.passportSizePhoto,
            onChange: (newFiles: UploadedFile[]) =>
              setFiles((prev) => ({ ...prev, passportSizePhoto: newFiles })),
            required: true,
          },
        ],
      },
      {
        title: "Family Information",
        fields: [
          {
            id: "fatherName",
            label: "Father's Name",
            value: formData.fatherName || "",
            required: true,
            placeholder: "Enter father's name",
          },
          {
            id: "motherName",
            label: "Mother's Name",
            value: formData.motherName || "",
            required: true,
            placeholder: "Enter mother's name",
          },
          {
            id: "grandfatherName",
            label: "Grandfather's Name",
            value: formData.grandfatherName || "",
            required: true,
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
            value: docMetadata.citizenshipNumber || "",
            required: selectedDocTypes.includes(KycDocumentType.CITIZENSHIP),
            placeholder: "Enter citizenship number",
          },
          {
            id: "citizenshipIssueDate",
            label: "Issue Date",
            value: docMetadata.citizenshipIssueDate || "",
            type: "date" as const,
            required: selectedDocTypes.includes(KycDocumentType.CITIZENSHIP),
          },
          {
            id: "citizenshipDistrict",
            label: "Issue District",
            value: docMetadata.citizenshipDistrict || "",
            required: selectedDocTypes.includes(KycDocumentType.CITIZENSHIP),
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
            required: selectedDocTypes.includes(KycDocumentType.CITIZENSHIP),
          },
          {
            label: "Citizenship Back",
            accept: "image" as const,
            maxFiles: 1,
            folder: "kyc/citizenship",
            value: files.citizenshipBack,
            onChange: (newFiles: UploadedFile[]) =>
              setFiles((prev) => ({ ...prev, citizenshipBack: newFiles })),
            required: selectedDocTypes.includes(KycDocumentType.CITIZENSHIP),
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
            value: docMetadata.passportNumber || "",
            required: selectedDocTypes.includes(KycDocumentType.PASSPORT),
            placeholder: "Enter passport number",
          },
          {
            id: "passportIssueDate",
            label: "Issue Date",
            value: docMetadata.passportIssueDate || "",
            type: "date" as const,
            required: selectedDocTypes.includes(KycDocumentType.PASSPORT),
          },
          {
            id: "passportExpiryDate",
            label: "Expiry Date",
            value: docMetadata.passportExpiryDate || "",
            type: "date" as const,
            required: selectedDocTypes.includes(KycDocumentType.PASSPORT),
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
            required: selectedDocTypes.includes(KycDocumentType.PASSPORT),
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
            value: docMetadata.panNumber || "",
            required: selectedDocTypes.includes(KycDocumentType.PAN),
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
            required: selectedDocTypes.includes(KycDocumentType.PAN),
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
            value: docMetadata.licenseNumber || "",
            required: selectedDocTypes.includes(
              KycDocumentType.DRIVING_LICENSE
            ),
            placeholder: "Enter license number",
          },
          {
            id: "licenseIssueDate",
            label: "Issue Date",
            value: docMetadata.licenseIssueDate || "",
            type: "date" as const,
            required: selectedDocTypes.includes(
              KycDocumentType.DRIVING_LICENSE
            ),
          },
          {
            id: "licenseExpiryDate",
            label: "Expiry Date",
            value: docMetadata.licenseExpiryDate || "",
            type: "date" as const,
            required: selectedDocTypes.includes(
              KycDocumentType.DRIVING_LICENSE
            ),
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
            required: selectedDocTypes.includes(
              KycDocumentType.DRIVING_LICENSE
            ),
          },
          {
            label: "License Back",
            accept: "image" as const,
            maxFiles: 1,
            folder: "kyc/license",
            value: files.licenseBack,
            onChange: (newFiles: UploadedFile[]) =>
              setFiles((prev) => ({ ...prev, licenseBack: newFiles })),
            required: selectedDocTypes.includes(
              KycDocumentType.DRIVING_LICENSE
            ),
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
            required: true,
            placeholder: "Enter province",
          },
          {
            id: "permanentDistrict",
            label: "District",
            value: formData.permanentDistrict || "",
            required: true,
            placeholder: "Enter district",
          },
          {
            id: "permanentMunicipality",
            label: "Municipality",
            value: formData.permanentMunicipality || "",
            required: true,
            placeholder: "Enter municipality",
          },
          {
            id: "permanentWard",
            label: "Ward No.",
            value: formData.permanentWard || "",
            required: true,
            placeholder: "Enter ward number",
          },
          {
            id: "permanentTole",
            label: "Tole/Street",
            value: formData.permanentTole || "",
            required: true,
            placeholder: "Enter tole/street",
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
            required: true,
            placeholder: "Enter occupation",
          },
          {
            id: "monthlyIncome",
            label: "Monthly Income",
            value: formData.monthlyIncome?.toString() || "",
            type: "number",
            required: true,
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
            required: true,
            placeholder: "Enter bank name",
          },
          {
            id: "bankAccountNumber",
            label: "Account Number",
            value: formData.bankAccountNumber || "",
            required: true,
            placeholder: "Enter account number",
          },
          {
            id: "bankBranch",
            label: "Branch",
            value: formData.bankBranch || "",
            required: true,
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
            required: true,
            placeholder: "Enter loan amount",
          },
          {
            id: "loanDuration",
            label: "Duration (months)",
            value: formData.loanDuration?.toString() || "",
            type: "number",
            required: true,
            placeholder: "Enter duration",
          },
          {
            id: "loanPurpose",
            label: "Loan Purpose",
            value: formData.loanPurpose || "",
            type: "textarea",
            required: true,
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
      docMetadata,
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
      render: (_value, doc: Kyc) => {
        const docNumber = doc.files?.find(
          (f) => f.documentNumber
        )?.documentNumber;
        return <span>{docNumber || "N/A"}</span>;
      },
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
