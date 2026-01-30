export enum LoanStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CONTRACT_GENERATED = "CONTRACT_GENERATED",
  CONTRACT_SIGNED = "CONTRACT_SIGNED",
}

export interface Lender {
  id: string;
  name: string;
  isActive: boolean;
  isBanned: boolean;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
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
  status: LoanStatus | string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  borrower?: {
    tenant?: {
      id: string;
      name: string;
    };
    user?: {
      id: string;
      fullName: string;
      email: string;
    };
  };
  monthlyPayment?: number;
  remainingBalance?: number;
  nextPaymentDate?: string;
  paymentsMade?: number;
  totalPayments?: number;
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

export interface LoanApplication {
  lenderId: string;
  loanType: string;
  amount: number;
  purpose: string;
  repaymentPeriod: number;
  additionalDetails?: string;
}

export interface PaymentSchedule {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  status: string;
}

export interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}
