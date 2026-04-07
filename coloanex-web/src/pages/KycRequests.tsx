import { useState, useEffect, useMemo } from "react";
import { Eye, FileText, Edit, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Pagination } from "@/components/ui/pagination";
import { DataTable } from "@/components/shared/DataTable";
import { Column } from "@/types/components";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FormLabel } from "@/components/ui/form-label";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { BlockchainProcessingModal } from "@/components/ui/blockchain-processing-modal";
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
import { KycStatus, KycFileType } from "@/types/kyc";
import { useAuth } from "@/hooks/useAuth";
import { KycVerificationModal } from "@/components/modals/KycVerificationModal";
import { recordKYCOnBlockchain, updateKYCOnBlockchain, deleteKYCOnBlockchain } from "@/utils/blockchain";
import { FormSheet } from "@/components/shared/FormSheet";
import { UploadedFile } from "@/types/upload";
import { ethers } from "ethers";

// Local enum for UI document type selection (not in schema)
enum KycDocumentType {
  CITIZENSHIP = "CITIZENSHIP",
  PASSPORT = "PASSPORT",
  DRIVING_LICENSE = "DRIVING_LICENSE",
  PAN = "PAN",
  OTHER = "OTHER",
}

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
  const [isProcessingBlockchain, setIsProcessingBlockchain] = useState(false);
  const [blockchainStep, setBlockchainStep] = useState<"blockchain" | "database" | "complete">("blockchain");

  const [createKyc, { isLoading: isCreating }] = useCreateKycMutation();
  const [updateKyc, { isLoading: isUpdating }] = useUpdateKycMutation();
  const [deleteKyc] = useDeleteKycMutation();

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

  // Form state - different from the actual DTO structure
  const [formData, setFormData] = useState<any>({
    tenantId: "",
    firstName: "",
    middleName: "",
    lastName: "",
    passportSizePhotoUrl: "",
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    nationality: "",
    fatherName: "",
    motherName: "",
    grandfatherName: "",
    spouseName: "",
    permanentProvince: "",
    permanentDistrict: "",
    permanentMunicipality: "",
    permanentWard: "",
    permanentStreet: "",
    permanentTole: "",
    occupation: "",
    monthlyIncome: 0,
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
    branchName: "",
    accountType: "",
    bankAccountNumber: "",
    bankBranch: "",
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
    supporting: [],
  });

  // Determine if user should be filtered by tenant
  const shouldFilterByTenant = useMemo(() => {
    return isLender || user?.roles?.some((ur) => ur.role.name === "Admin");
  }, [isLender, user]);

  const [filters, setFilters] = useState<KycDocumentsQuery>({
    page: 1,
    limit: 10,
    search: "",
    status: KycStatus.PENDING,
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
    data: kycDocumentsData,
    isLoading,
    error: kycDocumentsError,
  } = useGetKycsQuery(filters, { skip: !isAuthenticated });

  const [verifyKycDocument] = useVerifyKycMutation();

  const kycDocuments = useMemo(
    () => kycDocumentsData?.data || [],
    [kycDocumentsData],
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

  const handleSelectionChange = (selected: Set<string>) => {
    setSelectedRows(selected);
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
    setIsProcessingBlockchain(true);
    setBlockchainStep("blockchain");
    
    try {
      let blockchainTxHash: string | undefined;

      try {
        blockchainTxHash = await deleteKYCOnBlockchain(kycToDelete.id);
      } catch (blockchainError: any) {
        if (blockchainError.code === "ACTION_REJECTED") {
          toast({
            title: "Transaction Cancelled",
            description: "You rejected the blockchain transaction",
            variant: "destructive",
          });
          setIsProcessingBlockchain(false);
          setIsDeletingKyc(false);
          return;
        } else {
          setIsProcessingBlockchain(false);
          setIsDeletingKyc(false);
          toast({
            title: "Blockchain Error",
            description: blockchainError.reason || blockchainError.message || "Failed to process blockchain transaction",
            variant: "destructive",
          });
          return;
        }
      }

      setBlockchainStep("database");

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
      setIsProcessingBlockchain(false);
    }
  };

  const handleVerifySelected = () => {
    if (selectedRows.size === 0) return;
    const firstSelectedDoc = kycDocuments.find((doc) =>
      selectedRows.has(doc.id),
    );
    if (firstSelectedDoc) {
      setSelectedDocument(firstSelectedDoc);
      setVerificationModalOpen(true);
    }
  };

  const handleVerificationSubmit = async (
    status: KycStatus,
    notes?: string,
  ) => {
    if (!selectedDocument) return;

    try {
      setIsProcessingBlockchain(true);
      setBlockchainStep("blockchain");
      
      if (status === KycStatus.VERIFIED) {
        try {
          const userAddress = ethers.getAddress(
            "0x" +
              ethers
                .keccak256(ethers.toUtf8Bytes(selectedDocument.borrowerId))
                .slice(2, 42),
          );

          await updateKYCOnBlockchain(selectedDocument.id, status);

          toast({
            title: "Blockchain Transaction",
            description: "KYC verification recorded on blockchain successfully",
          });
        } catch (blockchainError) {
          const error = blockchainError as Error;
          setIsProcessingBlockchain(false);
          if (error.message.includes("MetaMask")) {
            toast({
              title: "MetaMask Required",
              description:
                "Please install and connect MetaMask to proceed with blockchain verification",
              variant: "destructive",
            });
            return;
          } else if (error.message.includes("User rejected")) {
            toast({
              title: "Transaction Rejected",
              description: "Blockchain verification was cancelled",
              variant: "destructive",
            });
            return;
          } else {
            toast({
              title: "Blockchain Error",
              description: `Failed to record on blockchain: ${error.message}`,
              variant: "destructive",
            });
          }
        }
      }

      setBlockchainStep("database");
      await verifyKycDocument({
        id: selectedDocument.id,
        data: { status, notes },
      }).unwrap();

      setBlockchainStep("complete");
      setTimeout(() => {
        setIsProcessingBlockchain(false);
      }, 1000);

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
    } finally {
      setIsProcessingBlockchain(false);
      setBlockchainStep("blockchain");
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
      formData.photoUrl = photoFile.url;
    }

    if (selectedDocTypes.includes(KycDocumentType.CITIZENSHIP)) {
      files.citizenshipFront.forEach((f) =>
        allFiles.push({
          fileType: KycFileType.CITIZENSHIP_FRONT,
          fileUrl: f.url,
          documentMetadata: {
            documentNumber: docMetadata.citizenshipNumber,
            issueDate: docMetadata.citizenshipIssueDate,
            issueDistrict: docMetadata.citizenshipDistrict,
          },
        }),
      );
      files.citizenshipBack.forEach((f) =>
        allFiles.push({
          fileType: KycFileType.CITIZENSHIP_BACK,
          fileUrl: f.url,
          documentMetadata: {
            documentNumber: docMetadata.citizenshipNumber,
            issueDate: docMetadata.citizenshipIssueDate,
            issueDistrict: docMetadata.citizenshipDistrict,
          },
        }),
      );
    }

    if (selectedDocTypes.includes(KycDocumentType.PASSPORT)) {
      files.passport.forEach((f) =>
        allFiles.push({
          fileType: KycFileType.PASSPORT,
          fileUrl: f.url,
          documentMetadata: {
            documentNumber: docMetadata.passportNumber,
            issueDate: docMetadata.passportIssueDate,
            expiryDate: docMetadata.passportExpiryDate,
          },
        }),
      );
    }

    if (selectedDocTypes.includes(KycDocumentType.PAN)) {
      files.pan.forEach((f) =>
        allFiles.push({
          fileType: KycFileType.PAN,
          fileUrl: f.url,
          documentMetadata: {
            documentNumber: docMetadata.panNumber,
          },
        }),
      );
    }

    if (selectedDocTypes.includes(KycDocumentType.DRIVING_LICENSE)) {
      files.licenseFront.forEach((f) =>
        allFiles.push({
          fileType: KycFileType.LICENSE_FRONT,
          fileUrl: f.url,
          documentMetadata: {
            documentNumber: docMetadata.licenseNumber,
            issueDate: docMetadata.licenseIssueDate,
            expiryDate: docMetadata.licenseExpiryDate,
          },
        }),
      );
      files.licenseBack.forEach((f) =>
        allFiles.push({
          fileType: KycFileType.LICENSE_BACK,
          fileUrl: f.url,
          documentMetadata: {
            documentNumber: docMetadata.licenseNumber,
            issueDate: docMetadata.licenseIssueDate,
            expiryDate: docMetadata.licenseExpiryDate,
          },
        }),
      );
    }

    files.selfie.forEach((f) =>
      allFiles.push({
        fileType: KycFileType.SELFIE,
        fileUrl: f.url,
        documentMetadata: {},
      }),
    );

    files.supporting.forEach((f) =>
      allFiles.push({
        fileType: KycFileType.SUPPORTING_DOCUMENT,
        fileUrl: f.url,
        documentMetadata: {},
      }),
    );

    const kycData: CreateKycDto = {
      fullName:
        `${formData.firstName || ""} ${formData.middleName || ""} ${formData.lastName || ""}`.trim(),
      dateOfBirth: formData.dateOfBirth || "",
      photoUrl: formData.passportSizePhotoUrl || "",
      personalDetails: {
        firstName: formData.firstName || "",
        middleName: formData.middleName || "",
        lastName: formData.lastName || "",
        gender: formData.gender || "",
        nationality: formData.nationality || "",
        fatherName: formData.fatherName || "",
        motherName: formData.motherName || "",
        grandfatherName: formData.grandfatherName || "",
        spouseName: formData.spouseName || "",
      },
      permanentAddress: {
        province: formData.permanentProvince || "",
        district: formData.permanentDistrict || "",
        municipality: formData.permanentMunicipality || "",
        ward: formData.permanentWard || "",
        street: formData.permanentStreet || "",
      },
      occupation: formData.occupation || "",
      monthlyIncome: formData.monthlyIncome || 0,
      bankDetails: {
        bankName: formData.bankName || "",
        accountNumber: formData.accountNumber || "",
        accountHolderName: formData.accountHolderName || "",
        branchName: formData.branchName || "",
        accountType: formData.accountType || "",
      },
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

    try {
      if (editingKyc) {
        await updateKyc({ id: editingKyc.id, data: kycData }).unwrap();
        toast({
          title: "Success",
          description: "KYC request updated successfully",
        });
      } else {
        const kycResponse = await createKyc(kycData).unwrap();

        try {
          const userAddress = ethers.getAddress(
            "0x" +
              ethers.keccak256(ethers.toUtf8Bytes(kycResponse.id)).slice(2, 42),
          );

          await recordKYCOnBlockchain(kycResponse.id, userAddress);

          toast({
            title: "Success",
            description:
              "KYC request submitted and recorded on blockchain successfully",
          });
        } catch (blockchainError) {
          const error = blockchainError as Error;
          if (error.message.includes("MetaMask")) {
            toast({
              title: "KYC Submitted",
              description:
                "KYC request submitted successfully. MetaMask is required for blockchain verification.",
            });
          } else if (error.message.includes("User rejected")) {
            toast({
              title: "KYC Submitted",
              description:
                "KYC request submitted successfully. Blockchain recording was cancelled.",
            });
          } else {
            toast({
              title: "KYC Submitted",
              description:
                "KYC request submitted successfully. Blockchain recording failed.",
            });
          }
        }
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

    // Auto-assign tenant for Admin/Lender users
    const shouldAutoSetTenant = (isAdmin || isLender) && user?.tenantId;

    setFormData({
      tenantId: shouldAutoSetTenant ? user.tenantId : "",
      firstName: "",
      middleName: "",
      lastName: "",
      passportSizePhotoUrl: "",
      dateOfBirth: "",
      gender: "",
      maritalStatus: "",
      nationality: "",
      fatherName: "",
      motherName: "",
      grandfatherName: "",
      spouseName: "",
      permanentProvince: "",
      permanentDistrict: "",
      permanentMunicipality: "",
      permanentWard: "",
      permanentStreet: "",
      permanentTole: "",
      occupation: "",
      monthlyIncome: 0,
      bankName: "",
      accountNumber: "",
      accountHolderName: "",
      branchName: "",
      accountType: "",
      bankAccountNumber: "",
      bankBranch: "",
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
      const personalDetails = (editingKyc.personalDetails as any) || {};
      const permanentAddress = (editingKyc.permanentAddress as any) || {};
      const bankDetails = (editingKyc.bankDetails as any) || {};

      setFormData({
        firstName: personalDetails.firstName || "",
        middleName: personalDetails.middleName || "",
        lastName: personalDetails.lastName || "",
        passportSizePhotoUrl: editingKyc.photoUrl || "",
        dateOfBirth: editingKyc.dateOfBirth
          ? new Date(editingKyc.dateOfBirth).toISOString().split("T")[0]
          : "",
        gender: personalDetails.gender || "",
        maritalStatus: personalDetails.maritalStatus || "",
        fatherName: personalDetails.fatherName || "",
        motherName: personalDetails.motherName || "",
        grandfatherName: personalDetails.grandfatherName || "",
        spouseName: personalDetails.spouseName || "",
        nationality: personalDetails.nationality || "",
        permanentProvince: permanentAddress.province || "",
        permanentDistrict: permanentAddress.district || "",
        permanentMunicipality: permanentAddress.municipality || "",
        permanentWard: permanentAddress.ward || "",
        permanentTole: permanentAddress.street || permanentAddress.tole || "",
        occupation: editingKyc.occupation || "",
        monthlyIncome: editingKyc.monthlyIncome,
        bankName: bankDetails.bankName || "",
        bankAccountNumber:
          bankDetails.accountNumber || bankDetails.bankAccountNumber || "",
        bankBranch: bankDetails.branchName || bankDetails.bankBranch || "",
        accountType: bankDetails.accountType || "",
        accountHolderName: bankDetails.accountHolderName || "",
        tenantId: editingKyc.borrower?.tenantId || "",
      });

      if (editingKyc.borrower?.userId) {
        setSelectedUserId(editingKyc.borrower.userId);
      }

      if (editingKyc.photoUrl) {
        setFiles((prev) => ({
          ...prev,
          passportSizePhoto: [
            {
              url: editingKyc.photoUrl,
              fileName: "passport-photo",
              mimeType: "image/jpeg",
              sizeInBytes: 0,
            },
          ],
        }));
      }

      if (editingKyc.files && editingKyc.files.length > 0) {
        const newFiles = {
          passportSizePhoto: editingKyc.photoUrl
            ? [
                {
                  url: editingKyc.photoUrl,
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

        // Extract document types from files
        const docTypes = new Set<KycDocumentType>();

        editingKyc.files.forEach((file) => {
          const uploadedFile: UploadedFile = {
            url: file.fileUrl,
            fileName: "", // Not available in schema
            mimeType: "", // Not available in schema
            sizeInBytes: 0, // Not available in schema
          };

          // Extract documentType from metadata
          const metadata = file.documentMetadata as any;
          let documentType: KycDocumentType | undefined;

          // Populate document metadata from file metadata
          if (
            file.fileType === "CITIZENSHIP_FRONT" ||
            file.fileType === "CITIZENSHIP_BACK"
          ) {
            documentType = KycDocumentType.CITIZENSHIP;
            if (metadata?.documentNumber) {
              newDocMetadata.citizenshipNumber = metadata.documentNumber;
              newDocMetadata.citizenshipIssueDate = metadata.issueDate
                ? new Date(metadata.issueDate).toISOString().split("T")[0]
                : "";
              newDocMetadata.citizenshipDistrict = metadata.issueDistrict || "";
            }
          } else if (file.fileType === "PASSPORT") {
            documentType = KycDocumentType.PASSPORT;
            if (metadata?.documentNumber) {
              newDocMetadata.passportNumber = metadata.documentNumber;
              newDocMetadata.passportIssueDate = metadata.issueDate
                ? new Date(metadata.issueDate).toISOString().split("T")[0]
                : "";
              newDocMetadata.passportExpiryDate = metadata.expiryDate
                ? new Date(metadata.expiryDate).toISOString().split("T")[0]
                : "";
            }
          } else if (file.fileType === "PAN") {
            documentType = KycDocumentType.PAN;
            if (metadata?.documentNumber) {
              newDocMetadata.panNumber = metadata.documentNumber;
            }
          } else if (
            file.fileType === "LICENSE_FRONT" ||
            file.fileType === "LICENSE_BACK"
          ) {
            documentType = KycDocumentType.DRIVING_LICENSE;
            if (metadata?.documentNumber) {
              newDocMetadata.licenseNumber = metadata.documentNumber;
              newDocMetadata.licenseIssueDate = metadata.issueDate
                ? new Date(metadata.issueDate).toISOString().split("T")[0]
                : "";
              newDocMetadata.licenseExpiryDate = metadata.expiryDate
                ? new Date(metadata.expiryDate).toISOString().split("T")[0]
                : "";
            }
          }

          if (documentType) {
            docTypes.add(documentType);
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
            case "SUPPORTING_DOCUMENT":
              newFiles.supporting.push(uploadedFile);
              break;
          }
        });

        setFiles(newFiles);
        setDocMetadata(newDocMetadata);
        setSelectedDocTypes(Array.from(docTypes));
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
            <p className="text-sm text-muted-foreground mb-3">
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
              KycDocumentType.DRIVING_LICENSE,
            ),
            placeholder: "Enter license number",
          },
          {
            id: "licenseIssueDate",
            label: "Issue Date",
            value: docMetadata.licenseIssueDate || "",
            type: "date" as const,
            required: selectedDocTypes.includes(
              KycDocumentType.DRIVING_LICENSE,
            ),
          },
          {
            id: "licenseExpiryDate",
            label: "Expiry Date",
            value: docMetadata.licenseExpiryDate || "",
            type: "date" as const,
            required: selectedDocTypes.includes(
              KycDocumentType.DRIVING_LICENSE,
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
              KycDocumentType.DRIVING_LICENSE,
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
              KycDocumentType.DRIVING_LICENSE,
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
    ],
  );

  const getStatusBadge = (status: KycStatus) => {
    switch (status) {
      case KycStatus.VERIFIED:
        return (
          <Badge className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
            Verified
          </Badge>
        );
      case KycStatus.REJECTED:
        return (
          <Badge className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Pending
          </Badge>
        );
    }
  };

  const columns: Column<Kyc>[] = [
    {
      key: "fullName",
      label: "Borrower Name",
      sortable: true,
      render: (doc: Kyc) => (
        <div>
          <div className="font-medium">
            {doc.borrower?.user?.fullName || doc.fullName}
          </div>
          <div className="text-sm text-muted-foreground">
            {doc.borrower?.user?.email || "N/A"}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (doc: Kyc) => getStatusBadge(doc.status),
    },
    {
      key: "blockchainTxHash",
      label: "Blockchain",
      sortable: false,
      render: (doc: Kyc) => {
        const hasBlockchainTx = !!(doc as any)?.blockchainTxHash || !!(doc as any)?.blockchain_tx_hash;
        return (
          <button
            onClick={() => {
              if (hasBlockchainTx) {
                window.open(
                  `https://sepolia.etherscan.io/tx/${(doc as any).blockchainTxHash || (doc as any).blockchain_tx_hash}`,
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
      key: "createdAt",
      label: "Submitted",
      sortable: true,
      render: (doc: Kyc) => new Date(doc.createdAt).toLocaleDateString(),
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
            (kycDocumentsData?.total || 0) / (filters.limit || 10),
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

      <BlockchainProcessingModal
        open={isProcessingBlockchain}
        currentStep={blockchainStep}
        message="Recording KYC verification on the blockchain and updating the database. Please wait..."
      />
    </DashboardLayout>
  );
}
