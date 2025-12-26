export enum LoanStatus {
  DRAFT = "DRAFT",
  PENDING_REVIEW = "PENDING_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  DISBURSED = "DISBURSED",
  ACTIVE = "ACTIVE",
  CLOSED = "CLOSED",
  DEFAULTED = "DEFAULTED",
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
  rejectionReason?: string;
  disbursedAt?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
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

export interface CreateLoanDto {
  borrowerId?: string;
  tenantId?: string;
  userId?: string;
  providedLoanAmount: number;
  expectedLoanAmount: number;
  loanPurpose: string;
  collateralType: string;
  collateralDescription: string;
  collateralValue: number;
  collateralImageUrl: string;
  amount: number;
  interestRate: number;
  termMonths: number;
}

export interface UpdateLoanDto {
  providedLoanAmount?: number;
  expectedLoanAmount?: number;
  loanPurpose?: string;
  collateralType?: string;
  collateralDescription?: string;
  collateralValue?: number;
  collateralImageUrl?: string;
  amount?: number;
  interestRate?: number;
  termMonths?: number;
}

export interface ReviewLoanDto {
  status: LoanStatus;
  rejectionReason?: string;
}

export interface LoanQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: LoanStatus;
  tenantId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface LoansResponse {
  data: Loan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
