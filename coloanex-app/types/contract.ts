export interface LoanLimits {
  minAmount: number;
  maxAmount: number;
  minTermMonths: number;
  maxTermMonths: number;
}

export interface PenaltyConfig {
  penaltyType: "PERCENTAGE" | "FIXED_AMOUNT";
  penaltyAmount: number;
  gracePeriodDays: number;
}

export interface PaymentConfig {
  allowedFrequencies: ("WEEKLY" | "MONTHLY" | "QUARTERLY")[];
  allowEarlyPayment: boolean;
  earlyPaymentPenalty?: number;
}

export interface Rule {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  ruleType: "STANDARD" | "PREMIUM" | "MICRO_LOAN" | "BUSINESS_LOAN";
  interestRate: number;
  loanLimits: LoanLimits;
  penaltyConfig: PenaltyConfig;
  paymentConfig: PaymentConfig;
  isActive: boolean;
  isPubliclyVisible: boolean;
  createdAt: string;
  updatedAt: string;
  tenant?: {
    id: string;
    name: string;
    logo?: string;
  };
}

export interface Signature {
  signedBy: "BORROWER" | "TENANT";
  signature: string;
  signedAt: string;
  ipAddress?: string;
}

export interface BlockchainData {
  transactionHash?: string;
  blockNumber?: number;
  network?: string;
  contractAddress?: string;
  timestamp?: string;
}

export interface DisbursementInfo {
  method: "ESEWA" | "FONEPAY" | "KHALTI" | "WALLET" | "BANK_TRANSFER";
  accountNumber?: string;
  accountName?: string;
  disbursedAt?: string;
  transactionId?: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
}

export interface Contract {
  id: string;
  contractNumber: string;
  tenantId: string;
  borrowerId: string;
  loanId: string;
  ruleId: string;
  status:
    | "DRAFT"
    | "GENERATED"
    | "SIGNED"
    | "ACTIVE"
    | "COMPLETED"
    | "DEFAULTED"
    | "CANCELLED"
    | "REPORTED";
  startDate: string;
  endDate: string;
  loanAmount: number;
  interestRate: number;
  termMonths: number;
  paymentFrequency: "WEEKLY" | "MONTHLY" | "QUARTERLY";
  installmentAmount: number;
  totalInstallments: number;
  totalAmountDue: number;
  totalAmountPaid: number;
  outstandingBalance: number;
  contractPdfUrl?: string;
  signatures?: Signature[];
  termsAndConditions: string;
  disbursementInfo?: DisbursementInfo;
  reportReason?: string;
  signedAt?: string;
  blockchainTxHash?: string;
  blockchainData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  tenant?: {
    id: string;
    name: string;
    logo?: string;
  };
  borrower?: {
    id: string;
    userId: string;
    user?: {
      id: string;
      fullName: string;
      email: string;
    };
  };
  loan?: {
    id: string;
    purpose: string;
  };
  rule?: {
    id: string;
    name: string;
    ruleType: string;
  };
}

export interface PaymentSchedule {
  id: string;
  contractId: string;
  installmentNumber: number;
  dueDate: string;
  dueAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "PENDING" | "PAID" | "OVERDUE" | "PARTIALLY_PAID";
  paidAt?: string;
  paymentTransactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentDetails {
  gateway: "ESEWA" | "FONEPAY" | "KHALTI" | "WALLET" | "BANK_TRANSFER";
  transactionId?: string;
  accountNumber?: string;
  accountName?: string;
  remarks?: string;
}

export interface Transaction {
  id: string;
  contractId?: string;
  walletId?: string;
  type:
    | "DEPOSIT"
    | "WITHDRAW"
    | "DISBURSEMENT"
    | "INSTALLMENT_PAYMENT"
    | "PENALTY_PAYMENT"
    | "FEE";
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  paymentDetails?: PaymentDetails;
  blockchainTxHash?: string;
  blockchainData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentGatewayLinks {
  esewa?: string;
  fonepay?: string;
  khalti?: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  paymentGatewayLinks?: PaymentGatewayLinks;
  createdAt: string;
  updatedAt: string;
}
