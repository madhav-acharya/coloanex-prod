export enum RuleType {
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  MICRO_LOAN = 'MICRO_LOAN',
  BUSINESS_LOAN = 'BUSINESS_LOAN',
}

export interface LoanLimits {
  minAmount: number;
  maxAmount: number;
  minTermMonths: number;
  maxTermMonths: number;
}

export interface PenaltyConfig {
  penaltyType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  penaltyAmount: number;
  gracePeriodDays: number;
}

export interface PaymentConfig {
  allowedFrequencies: ('WEEKLY' | 'MONTHLY' | 'QUARTERLY')[];
  allowEarlyPayment: boolean;
  earlyPaymentPenalty?: number;
}

export interface Rule {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  ruleType: RuleType;
  interestRate: number;
  loanLimits: LoanLimits;
  penaltyConfig: PenaltyConfig;
  paymentConfig: PaymentConfig;
  isActive: boolean;
  isPubliclyVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
  tenant?: {
    id: string;
    name: string;
    logo?: string;
  };
}
