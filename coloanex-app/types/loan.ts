export interface Lender {
  id: string;
  name: string;
  logo?: string;
  rating: number;
  reviewCount: number;
  interestRate: number;
  minAmount: number;
  maxAmount: number;
  successRate: number;
  responseTime: string;
  loanTerms: {
    minTerm: number;
    maxTerm: number;
    processingTime: string;
    collateralRequired: boolean;
  };
  requirements: string[];
  about: string;
  verified: boolean;
}

export interface Loan {
  id: string;
  loanNumber: string;
  lenderId: string;
  lenderName: string;
  lenderLogo?: string;
  loanType: string;
  principalAmount: number;
  interestRate: number;
  totalAmount: number;
  remainingBalance: number;
  monthlyPayment: number;
  loanTerm: number;
  status: string;
  disbursementDate: string;
  maturityDate: string;
  nextPaymentDate: string;
  paymentsMade: number;
  totalPayments: number;
  autoDebit: boolean;
  paymentMethod?: string;
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
  date: string;
  amount: number;
  principal: number;
  interest: number;
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
