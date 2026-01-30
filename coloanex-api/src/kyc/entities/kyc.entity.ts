export enum KycStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum KycDocumentType {
  CITIZENSHIP = 'CITIZENSHIP',
  PASSPORT = 'PASSPORT',
  DRIVING_LICENSE = 'DRIVING_LICENSE',
  PAN = 'PAN',
  OTHER = 'OTHER',
}

export enum KycFileType {
  CITIZENSHIP_FRONT = 'CITIZENSHIP_FRONT',
  CITIZENSHIP_BACK = 'CITIZENSHIP_BACK',
  PASSPORT = 'PASSPORT',
  PAN = 'PAN',
  LICENSE_FRONT = 'LICENSE_FRONT',
  LICENSE_BACK = 'LICENSE_BACK',
  SELFIE = 'SELFIE',
  SUPPORTING_DOCUMENT = 'SUPPORTING_DOCUMENT',
}

export interface KycFile {
  id: string;
  kycId: string;
  fileType: KycFileType;
  fileUrl: string;
  documentMetadata: Record<string, unknown>;
  createdAt: Date;
}

export interface Kyc {
  id: string;
  borrowerId: string;
  fullName: string;
  dateOfBirth: Date;
  photoUrl: string;
  personalDetails: Record<string, unknown>;
  permanentAddress: Record<string, unknown>;
  occupation: string;
  monthlyIncome: number;
  bankDetails: Record<string, unknown>;
  status: KycStatus;
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
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
