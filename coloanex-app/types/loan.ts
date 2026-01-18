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
  amount: number;
  interestRate: number;
  termMonths: number;
  status: string;
  loanPurpose: string;
  collateralType: string;
  collateralDescription: string;
  collateralValue: number;
  collateralImageUrl: string;
  providedLoanAmount: number;
  expectedLoanAmount: number;
  disbursedAt?: string;
  dueDate?: string;
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
