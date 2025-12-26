export enum LoanStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DISBURSED = 'DISBURSED',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  DEFAULTED = 'DEFAULTED',
}

export interface Loan {
  id: string;
  borrowerId: string;
  tenantId: string;
  providedLoanAmount: number;
  expectedLoanAmount: number;
  loanPurpose: string;
  collateralType: string;
  collateralDescription: string;
  collateralValue: number;
  collateralImageUrl: string;
  txHash?: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  status: LoanStatus;
  disbursedAt?: Date;
  dueDate?: Date;
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
}
