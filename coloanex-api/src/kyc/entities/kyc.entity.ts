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
  COLLATERAL_PHOTO = 'COLLATERAL_PHOTO',
  SUPPORTING_DOCUMENT = 'SUPPORTING_DOCUMENT',
  OTHER = 'OTHER',
}

export interface KycFile {
  id: string;
  kycId: string;
  documentNumber?: string;
  issueDate?: Date;
  expiryDate?: Date;
  issueDistrict?: string;
  fileType: KycFileType;
  documentType?: string;
  fileUrl: string;
  fileName?: string;
  mimeType?: string;
  sizeInBytes?: number;
  createdAt: Date;
}

export interface Kyc {
  id: string;
  borrowerId: string;
  documentTypes: string[];
  firstName: string;
  middleName?: string;
  lastName: string;
  passportSizePhotoUrl: string;
  dateOfBirth: Date;
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
  loanAmount: number;
  loanPurpose: string;
  loanDuration: number;
  collateralType: string;
  collateralDescription: string;
  collateralValue: number;
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
