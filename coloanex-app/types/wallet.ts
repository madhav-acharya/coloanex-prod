export interface Rule {
  id: string;
  name: string;
  description?: string;
  ruleType: "STANDARD" | "PREMIUM" | "MICRO_LOAN" | "BUSINESS_LOAN";
  interestRate: number;
  loanLimits: {
    minAmount: number;
    maxAmount: number;
    minTermMonths: number;
    maxTermMonths: number;
  };
  penaltyConfig: {
    penaltyType: "PERCENTAGE" | "FIXED_AMOUNT";
    penaltyAmount: number;
    gracePeriodDays: number;
  };
  paymentConfig: {
    allowedFrequencies: Array<"WEEKLY" | "MONTHLY" | "QUARTERLY">;
    allowEarlyPayment: boolean;
    earlyPaymentPenalty?: number;
  };
  isActive: boolean;
  isPubliclyVisible: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  contractNumber: string;
  loanId: string;
  ruleId: string;
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "DEFAULTED" | "CANCELLED";
  loanAmount: number;
  interestRate: number;
  termMonths: number;
  startDate: string;
  paymentFrequency: "WEEKLY" | "MONTHLY" | "QUARTERLY";
  termsAndConditions: string;
  signedAt?: string;
  signature?: string;
  signedByIp?: string;
  outstandingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentSchedule {
  id: string;
  contractId: string;
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  amountPaid: number;
  penaltyAmount: number;
  status: "PENDING" | "PAID" | "OVERDUE" | "PARTIAL";
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  paymentScheduleId?: string;
  type:
    | "DEPOSIT"
    | "WITHDRAW"
    | "LOAN_DISBURSEMENT"
    | "LOAN_REPAYMENT"
    | "TRANSFER_IN"
    | "TRANSFER_OUT"
    | "FEE"
    | "PENALTY"
    | "REFUND";
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  gatewayDetails?: Record<string, unknown>;
  blockchainTxHash?: string;
  completedAt?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  tenantId: string;
  balance: number;
  pendingBalance: number;
  paymentGatewayLinks: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Lender {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  rating: number;
  totalLoans: number;
  verified: boolean;
}
