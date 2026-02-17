export enum LoanStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CONTRACT_GENERATED = 'CONTRACT_GENERATED',
  CONTRACT_SIGNED = 'CONTRACT_SIGNED',
  LOAN_PROVIDED = 'LOAN_PROVIDED',
}

export interface CollateralDetails {
  type: string;
  description: string;
  value: number;
  imageUrl?: string;
  [key: string]: unknown;
}

export interface Loan {
  id: string;
  borrowerId: string;
  tenantId: string;
  ruleId?: string;
  requestedAmount: number;
  approvedAmount?: number;
  purpose: string;
  collateralDetails: CollateralDetails;
  requestedTermMonths: number;
  approvedTermMonths?: number;
  status: LoanStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
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
  tenant?: {
    id: string;
    name: string;
    logo?: string;
  };
  contract?: {
    id: string;
    status: string;
    contractNumber: string;
  };
}
