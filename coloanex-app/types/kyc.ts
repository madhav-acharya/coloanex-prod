export enum KycStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
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
}

export interface KycFile {
  id?: string;
  kycId?: string;
  fileType: KycFileType;
  fileUrl: string;
  documentMetadata?: Record<string, unknown>;
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
    user?: {
      id: string;
      fullName: string;
      email: string;
    };
  };
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

export interface KycDocument {
  id: string;
  type: string;
  url: string;
  status: string;
  uploadedAt: string;
}

export interface KycSubmission {
  lenderId: string;
  loanType: string;
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    nationalId: string;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
  };
  documents: {
    governmentId?: string;
    proofOfAddress?: string;
  };
  employment: {
    status: string;
    employerName?: string;
    monthlyIncome: number;
  };
  consent: boolean;
}

export interface KycStatusInfo {
  id: string;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  notes?: string;
}
