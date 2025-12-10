import { useState, useEffect, useMemo } from "react";
import { Eye, FileText } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Pagination } from "@/components/ui/pagination";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FormLabel } from "@/components/ui/form-label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  useGetKycsQuery,
  useVerifyKycMutation,
  useCreateKycMutation,
} from "@/apis/kycApi";
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
import {
  FileUploader,
  type UploadedFile,
} from "@/components/shared/FileUploader";

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
  const { isAuthenticated } = useAuth();
  const [kycFormOpen, setKycFormOpen] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Kyc | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const [createKyc, { isLoading: isCreating }] = useCreateKycMutation();

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

  const handleViewKyc = (document: Kyc) => {
    setSelectedDocument(document);
    setVerificationModalOpen(true);
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

      setVerificationModalOpen(false);
      setSelectedDocument(null);

      if (selectedRows.has(selectedDocument.id)) {
        setSelectedRows((prev) => {
          const newSet = new Set(prev);
          newSet.delete(selectedDocument.id);
          return newSet;
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to verify KYC document",
        variant: "destructive",
      });
    }
  };

  const handleKycSubmit = async () => {
    const allFiles: KycFile[] = [];

    if (selectedDocTypes.includes(KycDocumentType.CITIZENSHIP)) {
      files.citizenshipFront.forEach((f) =>
        allFiles.push({
          fileType: KycFileType.CITIZENSHIP_FRONT,
          documentType: KycDocumentType.CITIZENSHIP,
          fileUrl: f.fileUrl,
          fileName: f.fileName,
          mimeType: f.mimeType,
          sizeInBytes: f.sizeInBytes,
        })
      );
      files.citizenshipBack.forEach((f) =>
        allFiles.push({
          fileType: KycFileType.CITIZENSHIP_BACK,
          documentType: KycDocumentType.CITIZENSHIP,
          fileUrl: f.fileUrl,
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
          fileUrl: f.fileUrl,
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
          fileUrl: f.fileUrl,
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
          fileUrl: f.fileUrl,
          fileName: f.fileName,
          mimeType: f.mimeType,
          sizeInBytes: f.sizeInBytes,
        })
      );
      files.licenseBack.forEach((f) =>
        allFiles.push({
          fileType: KycFileType.LICENSE_BACK,
          documentType: KycDocumentType.DRIVING_LICENSE,
          fileUrl: f.fileUrl,
          fileName: f.fileName,
          mimeType: f.mimeType,
          sizeInBytes: f.sizeInBytes,
        })
      );
    }

    files.selfie.forEach((f) =>
      allFiles.push({
        fileType: KycFileType.SELFIE,
        fileUrl: f.fileUrl,
        fileName: f.fileName,
        mimeType: f.mimeType,
        sizeInBytes: f.sizeInBytes,
      })
    );

    files.collateral.forEach((f) =>
      allFiles.push({
        fileType: KycFileType.COLLATERAL_PHOTO,
        fileUrl: f.fileUrl,
        fileName: f.fileName,
        mimeType: f.mimeType,
        sizeInBytes: f.sizeInBytes,
      })
    );

    files.supporting.forEach((f) =>
      allFiles.push({
        fileType: KycFileType.SUPPORTING_DOCUMENT,
        fileUrl: f.fileUrl,
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
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  useEffect(() => {
    if (!kycFormOpen) {
      const timer = setTimeout(() => resetKycForm(), 150);
      return () => clearTimeout(timer);
    }
  }, [kycFormOpen]);

  // Basic fields for FormSheet
  const basicFields = [
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
  ];

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
      render: (doc: Kyc) => (
        <Checkbox
          checked={selectedRows.has(doc.id)}
          onCheckedChange={() => handleSelectRow(doc.id)}
        />
      ),
    },
    {
      key: "borrower.user.fullName",
      label: "Borrower Name",
      sortable: true,
      render: (doc: Kyc) => (
        <div>
          <div className="font-medium">
            {doc.borrower?.user.fullName || "N/A"}
          </div>
          <div className="text-sm text-gray-500">
            {doc.borrower?.user.email || "N/A"}
          </div>
        </div>
      ),
    },
    {
      key: "documentTypes",
      label: "Document Types",
      sortable: true,
      render: (doc: Kyc) => (
        <span>{doc.documentTypes?.join(", ") || "N/A"}</span>
      ),
    },
    {
      key: "citizenshipNumber",
      label: "Citizenship Number",
      sortable: true,
      render: (doc: Kyc) => (
        <span>
          {doc.citizenshipNumber ||
            doc.passportNumber ||
            doc.panNumber ||
            "N/A"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (doc: Kyc) => getStatusBadge(doc.status),
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
            label: "View & Verify",
            icon: <Eye className="w-4 h-4" />,
            onClick: handleViewKyc,
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
        title="Add KYC Request"
        description="Fill in all required information and upload necessary documents"
        fields={basicFields}
        onFieldChange={handleFieldChange}
        onSubmit={handleKycSubmit}
        submitText="Submit KYC Request"
        isSubmitting={isCreating}
      >
        {/* Document Type Selection */}
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

        <Separator />

        {/* Family Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Family Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="spouseName">Spouse Name</FormLabel>
              <Input
                id="spouseName"
                value={formData.spouseName || ""}
                onChange={(e) =>
                  handleFieldChange("spouseName", e.target.value)
                }
              />
            </div>
            <div>
              <FormLabel htmlFor="fatherName">Father's Name</FormLabel>
              <Input
                id="fatherName"
                value={formData.fatherName || ""}
                onChange={(e) =>
                  handleFieldChange("fatherName", e.target.value)
                }
              />
            </div>
            <div>
              <FormLabel htmlFor="motherName">Mother's Name</FormLabel>
              <Input
                id="motherName"
                value={formData.motherName || ""}
                onChange={(e) =>
                  handleFieldChange("motherName", e.target.value)
                }
              />
            </div>
            <div>
              <FormLabel htmlFor="grandfatherName">
                Grandfather's Name
              </FormLabel>
              <Input
                id="grandfatherName"
                value={formData.grandfatherName || ""}
                onChange={(e) =>
                  handleFieldChange("grandfatherName", e.target.value)
                }
              />
            </div>
          </div>
        </div>

        {/* Citizenship Details - Conditional */}
        {selectedDocTypes.includes(KycDocumentType.CITIZENSHIP) && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Citizenship Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormLabel htmlFor="citizenshipNumber">
                    Citizenship Number
                  </FormLabel>
                  <Input
                    id="citizenshipNumber"
                    value={formData.citizenshipNumber || ""}
                    onChange={(e) =>
                      handleFieldChange("citizenshipNumber", e.target.value)
                    }
                  />
                </div>
                <div>
                  <FormLabel htmlFor="citizenshipIssueDate">
                    Issue Date
                  </FormLabel>
                  <Input
                    id="citizenshipIssueDate"
                    type="date"
                    value={formData.citizenshipIssueDate || ""}
                    onChange={(e) =>
                      handleFieldChange("citizenshipIssueDate", e.target.value)
                    }
                  />
                </div>
                <div className="col-span-2">
                  <FormLabel htmlFor="citizenshipDistrict">
                    Issue District
                  </FormLabel>
                  <Input
                    id="citizenshipDistrict"
                    value={formData.citizenshipDistrict || ""}
                    onChange={(e) =>
                      handleFieldChange("citizenshipDistrict", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="space-y-4">
                <FileUploader
                  label="Citizenship Front"
                  accept="image/*"
                  value={files.citizenshipFront}
                  onChange={(newFiles) =>
                    setFiles((prev) => ({
                      ...prev,
                      citizenshipFront: newFiles,
                    }))
                  }
                />
                <FileUploader
                  label="Citizenship Back"
                  accept="image/*"
                  value={files.citizenshipBack}
                  onChange={(newFiles) =>
                    setFiles((prev) => ({ ...prev, citizenshipBack: newFiles }))
                  }
                />
              </div>
            </div>
          </>
        )}

        {/* Passport Details - Conditional */}
        {selectedDocTypes.includes(KycDocumentType.PASSPORT) && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Passport Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormLabel htmlFor="passportNumber">
                    Passport Number
                  </FormLabel>
                  <Input
                    id="passportNumber"
                    value={formData.passportNumber || ""}
                    onChange={(e) =>
                      handleFieldChange("passportNumber", e.target.value)
                    }
                  />
                </div>
                <div>
                  <FormLabel htmlFor="passportIssueDate">Issue Date</FormLabel>
                  <Input
                    id="passportIssueDate"
                    type="date"
                    value={formData.passportIssueDate || ""}
                    onChange={(e) =>
                      handleFieldChange("passportIssueDate", e.target.value)
                    }
                  />
                </div>
                <div>
                  <FormLabel htmlFor="passportExpiryDate">
                    Expiry Date
                  </FormLabel>
                  <Input
                    id="passportExpiryDate"
                    type="date"
                    value={formData.passportExpiryDate || ""}
                    onChange={(e) =>
                      handleFieldChange("passportExpiryDate", e.target.value)
                    }
                  />
                </div>
              </div>
              <FileUploader
                label="Passport (PDF only)"
                accept="application/pdf"
                value={files.passport}
                onChange={(newFiles) =>
                  setFiles((prev) => ({ ...prev, passport: newFiles }))
                }
              />
            </div>
          </>
        )}

        {/* PAN Details - Conditional */}
        {selectedDocTypes.includes(KycDocumentType.PAN) && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">PAN Details</h3>
              <div>
                <FormLabel htmlFor="panNumber">PAN Number</FormLabel>
                <Input
                  id="panNumber"
                  value={formData.panNumber || ""}
                  onChange={(e) =>
                    handleFieldChange("panNumber", e.target.value)
                  }
                />
              </div>
              <FileUploader
                label="PAN Card"
                accept="image/*"
                value={files.pan}
                onChange={(newFiles) =>
                  setFiles((prev) => ({ ...prev, pan: newFiles }))
                }
              />
            </div>
          </>
        )}

        {/* Driving License Details - Conditional */}
        {selectedDocTypes.includes(KycDocumentType.DRIVING_LICENSE) && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Driving License Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormLabel htmlFor="licenseNumber">License Number</FormLabel>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber || ""}
                    onChange={(e) =>
                      handleFieldChange("licenseNumber", e.target.value)
                    }
                  />
                </div>
                <div>
                  <FormLabel htmlFor="licenseIssueDate">Issue Date</FormLabel>
                  <Input
                    id="licenseIssueDate"
                    type="date"
                    value={formData.licenseIssueDate || ""}
                    onChange={(e) =>
                      handleFieldChange("licenseIssueDate", e.target.value)
                    }
                  />
                </div>
                <div>
                  <FormLabel htmlFor="licenseExpiryDate">Expiry Date</FormLabel>
                  <Input
                    id="licenseExpiryDate"
                    type="date"
                    value={formData.licenseExpiryDate || ""}
                    onChange={(e) =>
                      handleFieldChange("licenseExpiryDate", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="space-y-4">
                <FileUploader
                  label="License Front"
                  accept="image/*"
                  value={files.licenseFront}
                  onChange={(newFiles) =>
                    setFiles((prev) => ({ ...prev, licenseFront: newFiles }))
                  }
                />
                <FileUploader
                  label="License Back"
                  accept="image/*"
                  value={files.licenseBack}
                  onChange={(newFiles) =>
                    setFiles((prev) => ({ ...prev, licenseBack: newFiles }))
                  }
                />
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Address Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Permanent Address</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="permanentProvince">Province</FormLabel>
              <Input
                id="permanentProvince"
                value={formData.permanentProvince || ""}
                onChange={(e) =>
                  handleFieldChange("permanentProvince", e.target.value)
                }
              />
            </div>
            <div>
              <FormLabel htmlFor="permanentDistrict">District</FormLabel>
              <Input
                id="permanentDistrict"
                value={formData.permanentDistrict || ""}
                onChange={(e) =>
                  handleFieldChange("permanentDistrict", e.target.value)
                }
              />
            </div>
            <div>
              <FormLabel htmlFor="permanentMunicipality">
                Municipality
              </FormLabel>
              <Input
                id="permanentMunicipality"
                value={formData.permanentMunicipality || ""}
                onChange={(e) =>
                  handleFieldChange("permanentMunicipality", e.target.value)
                }
              />
            </div>
            <div>
              <FormLabel htmlFor="permanentWard">Ward No.</FormLabel>
              <Input
                id="permanentWard"
                value={formData.permanentWard || ""}
                onChange={(e) =>
                  handleFieldChange("permanentWard", e.target.value)
                }
              />
            </div>
            <div className="col-span-2">
              <FormLabel htmlFor="permanentTole">Tole/Street</FormLabel>
              <Input
                id="permanentTole"
                value={formData.permanentTole || ""}
                onChange={(e) =>
                  handleFieldChange("permanentTole", e.target.value)
                }
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Temporary Address</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="temporaryProvince">Province</FormLabel>
              <Input
                id="temporaryProvince"
                value={formData.temporaryProvince || ""}
                onChange={(e) =>
                  handleFieldChange("temporaryProvince", e.target.value)
                }
              />
            </div>
            <div>
              <FormLabel htmlFor="temporaryDistrict">District</FormLabel>
              <Input
                id="temporaryDistrict"
                value={formData.temporaryDistrict || ""}
                onChange={(e) =>
                  handleFieldChange("temporaryDistrict", e.target.value)
                }
              />
            </div>
            <div>
              <FormLabel htmlFor="temporaryMunicipality">
                Municipality
              </FormLabel>
              <Input
                id="temporaryMunicipality"
                value={formData.temporaryMunicipality || ""}
                onChange={(e) =>
                  handleFieldChange("temporaryMunicipality", e.target.value)
                }
              />
            </div>
            <div>
              <FormLabel htmlFor="temporaryWard">Ward No.</FormLabel>
              <Input
                id="temporaryWard"
                value={formData.temporaryWard || ""}
                onChange={(e) =>
                  handleFieldChange("temporaryWard", e.target.value)
                }
              />
            </div>
            <div className="col-span-2">
              <FormLabel htmlFor="temporaryTole">Tole/Street</FormLabel>
              <Input
                id="temporaryTole"
                value={formData.temporaryTole || ""}
                onChange={(e) =>
                  handleFieldChange("temporaryTole", e.target.value)
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Contact Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="phoneNumber">Phone Number</FormLabel>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber || ""}
                onChange={(e) =>
                  handleFieldChange("phoneNumber", e.target.value)
                }
              />
            </div>
            <div>
              <FormLabel htmlFor="alternatePhone">Alternate Phone</FormLabel>
              <Input
                id="alternatePhone"
                type="tel"
                value={formData.alternatePhone || ""}
                onChange={(e) =>
                  handleFieldChange("alternatePhone", e.target.value)
                }
              />
            </div>
            <div className="col-span-2">
              <FormLabel htmlFor="email">Email</FormLabel>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleFieldChange("email", e.target.value)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Employment Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Employment Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="occupation">Occupation</FormLabel>
              <Input
                id="occupation"
                value={formData.occupation || ""}
                onChange={(e) =>
                  handleFieldChange("occupation", e.target.value)
                }
              />
            </div>
            <div>
              <FormLabel htmlFor="employerName">Employer Name</FormLabel>
              <Input
                id="employerName"
                value={formData.employerName || ""}
                onChange={(e) =>
                  handleFieldChange("employerName", e.target.value)
                }
              />
            </div>
            <div>
              <FormLabel htmlFor="monthlyIncome">Monthly Income</FormLabel>
              <Input
                id="monthlyIncome"
                type="number"
                value={formData.monthlyIncome || ""}
                onChange={(e) =>
                  handleFieldChange("monthlyIncome", e.target.value)
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Bank Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Bank Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="bankName">Bank Name</FormLabel>
              <Input
                id="bankName"
                value={formData.bankName || ""}
                onChange={(e) => handleFieldChange("bankName", e.target.value)}
              />
            </div>
            <div>
              <FormLabel htmlFor="bankAccountNumber">Account Number</FormLabel>
              <Input
                id="bankAccountNumber"
                value={formData.bankAccountNumber || ""}
                onChange={(e) =>
                  handleFieldChange("bankAccountNumber", e.target.value)
                }
              />
            </div>
            <div>
              <FormLabel htmlFor="bankBranch">Branch</FormLabel>
              <Input
                id="bankBranch"
                value={formData.bankBranch || ""}
                onChange={(e) =>
                  handleFieldChange("bankBranch", e.target.value)
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Loan Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Loan Requirements</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="loanAmount">Loan Amount</FormLabel>
              <Input
                id="loanAmount"
                type="number"
                value={formData.loanAmount || ""}
                onChange={(e) =>
                  handleFieldChange("loanAmount", e.target.value)
                }
              />
            </div>
            <div>
              <FormLabel htmlFor="loanDuration">Duration (months)</FormLabel>
              <Input
                id="loanDuration"
                type="number"
                value={formData.loanDuration || ""}
                onChange={(e) =>
                  handleFieldChange("loanDuration", e.target.value)
                }
              />
            </div>
            <div className="col-span-2">
              <FormLabel htmlFor="loanPurpose">Loan Purpose</FormLabel>
              <Textarea
                id="loanPurpose"
                value={formData.loanPurpose || ""}
                onChange={(e) =>
                  handleFieldChange("loanPurpose", e.target.value)
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Collateral Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Collateral Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="collateralType">Collateral Type</FormLabel>
              <Input
                id="collateralType"
                value={formData.collateralType || ""}
                onChange={(e) =>
                  handleFieldChange("collateralType", e.target.value)
                }
                placeholder="e.g., Property, Vehicle, Gold"
              />
            </div>
            <div>
              <FormLabel htmlFor="collateralValue">Estimated Value</FormLabel>
              <Input
                id="collateralValue"
                type="number"
                value={formData.collateralValue || ""}
                onChange={(e) =>
                  handleFieldChange("collateralValue", e.target.value)
                }
              />
            </div>
            <div className="col-span-2">
              <FormLabel htmlFor="collateralDescription">Description</FormLabel>
              <Textarea
                id="collateralDescription"
                value={formData.collateralDescription || ""}
                onChange={(e) =>
                  handleFieldChange("collateralDescription", e.target.value)
                }
              />
            </div>
          </div>
          <FileUploader
            label="Collateral Photos"
            accept="image/*"
            multiple
            maxFiles={5}
            value={files.collateral}
            onChange={(newFiles) =>
              setFiles((prev) => ({ ...prev, collateral: newFiles }))
            }
          />
        </div>

        <Separator />

        {/* Additional Documents */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Additional Documents</h3>
          <FileUploader
            label="Selfie/Photo"
            accept="image/*"
            value={files.selfie}
            onChange={(newFiles) =>
              setFiles((prev) => ({ ...prev, selfie: newFiles }))
            }
          />
          <FileUploader
            label="Supporting Documents"
            accept="image/*,application/pdf"
            multiple
            maxFiles={10}
            value={files.supporting}
            onChange={(newFiles) =>
              setFiles((prev) => ({ ...prev, supporting: newFiles }))
            }
          />
        </div>
      </FormSheet>

      {selectedDocument && (
        <KycVerificationModal
          open={verificationModalOpen}
          onOpenChange={setVerificationModalOpen}
          document={selectedDocument}
          onSubmit={handleVerificationSubmit}
          onClose={() => {
            setVerificationModalOpen(false);
            setSelectedDocument(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}
