export enum KycStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

// Removed KycDocumentType enum - not in schema

export enum KycFileType {
  CITIZENSHIP_FRONT = "CITIZENSHIP_FRONT",
  CITIZENSHIP_BACK = "CITIZENSHIP_BACK",
  PASSPORT = "PASSPORT",
  PAN = "PAN",
  LICENSE_FRONT = "LICENSE_FRONT",
  LICENSE_BACK = "LICENSE_BACK",
  SELFIE = "SELFIE",
  SUPPORTING_DOCUMENT = "SUPPORTING_DOCUMENT",
}

export interface KycFile {
  id?: string;
  kycId?: string;
  fileType: KycFileType;
  fileUrl: string;
  documentMetadata: Record<string, unknown>;
  createdAt?: string;
}

export interface Kyc {
  id: string;
  borrowerId: string;
  fullName: string;
  dateOfBirth: string;
  photoUrl: string;
  personalDetails: Record<string, unknown>;
  permanentAddress: Record<string, unknown>;
  occupation: string;
  monthlyIncome: number;
  bankDetails: Record<string, unknown>;
  status: KycStatus;
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  blockchainTxHash?: string;
  blockchainData?: Record<string, unknown>;
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
  fullName: string;
  dateOfBirth: string;
  photoUrl: string;
  personalDetails: Record<string, unknown>;
  permanentAddress: Record<string, unknown>;
  occupation: string;
  monthlyIncome: number;
  bankDetails: Record<string, unknown>;
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
