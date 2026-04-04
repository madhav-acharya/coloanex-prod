export enum ContractStatus {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  SIGNED = 'SIGNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DEFAULTED = 'DEFAULTED',
  CANCELLED = 'CANCELLED',
  REPORTED = 'REPORTED',
}

export enum PaymentFrequency {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
}

export interface Signature {
  signedBy: 'BORROWER' | 'TENANT';
  signature: string;
  signedAt: Date;
  ipAddress?: string;
}

export interface DisbursementInfo {
  method: 'ESEWA' | 'FONEPAY' | 'KHALTI' | 'WALLET' | 'BANK_TRANSFER';
  accountNumber?: string;
  accountName?: string;
  disbursedAt?: Date;
  transactionId?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export interface Contract {
  id: string;
  contractNumber: string;
  tenantId: string;
  borrowerId: string;
  loanId: string;
  ruleId: string;
  status: ContractStatus;
  startDate: Date;
  endDate: Date;
  loanAmount: number;
  interestRate: number;
  termMonths: number;
  paymentFrequency: PaymentFrequency;
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
  signedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
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
