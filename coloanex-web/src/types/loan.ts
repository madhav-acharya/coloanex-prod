export enum LoanStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CONTRACT_GENERATED = "CONTRACT_GENERATED",
  CONTRACT_SIGNED = "CONTRACT_SIGNED",
}

export interface Loan {
  id: string;
  borrowerId: string;
  tenantId: string;
  requestedAmount: number;
  approvedAmount?: number;
  purpose: string;
  collateralDetails: Record<string, unknown>;
  requestedTermMonths: number;
  status: LoanStatus;
  rejectionReason?: string;
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
  requestedAmount: number;
  purpose: string;
  collateralDetails: Record<string, unknown>;
  requestedTermMonths: number;
}

export interface UpdateLoanDto {
  requestedAmount?: number;
  purpose?: string;
  collateralDetails?: Record<string, unknown>;
  requestedTermMonths?: number;
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
