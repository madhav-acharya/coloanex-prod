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
  dateOfBirth: Date;
  gender?: string;
  maritalStatus?: string;
  spouseName?: string;
  fatherName?: string;
  motherName?: string;
  grandfatherName?: string;
  citizenshipNumber?: string;
  citizenshipIssueDate?: Date;
  citizenshipDistrict?: string;
  passportNumber?: string;
  passportIssueDate?: Date;
  passportExpiryDate?: Date;
  panNumber?: string;
  licenseNumber?: string;
  licenseIssueDate?: Date;
  licenseExpiryDate?: Date;
  permanentProvince?: string;
  permanentDistrict?: string;
  permanentMunicipality?: string;
  permanentWard?: string;
  permanentTole?: string;
  temporaryProvince?: string;
  temporaryDistrict?: string;
  temporaryMunicipality?: string;
  temporaryWard?: string;
  temporaryTole?: string;
  phoneNumber?: string;
  alternatePhone?: string;
  email?: string;
  occupation?: string;
  employerName?: string;
  monthlyIncome?: number;
  bankName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  loanAmount?: number;
  loanPurpose?: string;
  loanDuration?: number;
  collateralType?: string;
  collateralDescription?: string;
  collateralValue?: number;
  status: KycStatus;
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  files?: KycFile[];
}
