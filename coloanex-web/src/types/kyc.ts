export enum KycStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

export enum KycDocumentType {
  CITIZENSHIP = "CITIZENSHIP",
  PASSPORT = "PASSPORT",
  DRIVING_LICENSE = "DRIVING_LICENSE",
  PAN = "PAN",
  OTHER = "OTHER",
}

export enum KycFileType {
  CITIZENSHIP_FRONT = "CITIZENSHIP_FRONT",
  CITIZENSHIP_BACK = "CITIZENSHIP_BACK",
  PASSPORT = "PASSPORT",
  PAN = "PAN",
  LICENSE_FRONT = "LICENSE_FRONT",
  LICENSE_BACK = "LICENSE_BACK",
  SELFIE = "SELFIE",
  SUPPORTING_DOCUMENT = "SUPPORTING_DOCUMENT",
  OTHER = "OTHER",
}

export interface KycFile {
  id?: string;
  kycId?: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  issueDistrict?: string;
  fileType: KycFileType;
  documentType?: string;
  fileUrl: string;
  fileName?: string;
  mimeType?: string;
  sizeInBytes?: number;
  createdAt?: string;
}

export interface Kyc {
  id: string;
  borrowerId: string;
  documentTypes: string[];
  firstName: string;
  middleName?: string;
  lastName: string;
  passportSizePhotoUrl: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  fatherName: string;
  motherName: string;
  grandfatherName: string;
  permanentProvince: string;
  permanentDistrict: string;
  permanentMunicipality: string;
  permanentWard: string;
  permanentTole: string;
  occupation: string;
  monthlyIncome: number;
  bankName: string;
  bankAccountNumber: string;
  bankBranch: string;
  status: KycStatus;
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  files?: KycFile[];
  borrower?: {
    id: string;
    userId: string;
    tenantId: string;
    user: {
      id: string;
      fullName: string;
      email: string;
    };
  };
}

export interface KycDocumentsQuery {
  page?: number;
  limit?: number;
  status?: KycStatus;
  borrowerId?: string;
  userId?: string;
  tenantId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateKycDto {
  tenantId?: string;
  userId?: string;
  documentTypes: string[];
  firstName: string;
  middleName?: string;
  lastName: string;
  passportSizePhotoUrl: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  fatherName: string;
  motherName: string;
  grandfatherName: string;
  permanentProvince: string;
  permanentDistrict: string;
  permanentMunicipality: string;
  permanentWard: string;
  permanentTole: string;
  occupation: string;
  monthlyIncome: number;
  bankName: string;
  bankAccountNumber: string;
  bankBranch: string;
  files?: KycFile[];
}

export interface UpdateKycDto extends Partial<CreateKycDto> {
  status?: KycStatus;
  notes?: string;
}

export interface VerifyKycDto {
  status: KycStatus;
  rejectionReason?: string;
  notes?: string;
}

export interface KycsResponse {
  data: Kyc[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
