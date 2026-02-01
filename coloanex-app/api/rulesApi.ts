import client from "./client";

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

export const rulesApi = {
  getAll: async (): Promise<Rule[]> => {
    const response = await client.get("/rules");
    return response.data;
  },

  getById: async (id: string): Promise<Rule> => {
    const response = await client.get(`/rules/${id}`);
    return response.data;
  },

  getByTenant: async (tenantId: string): Promise<Rule[]> => {
    const response = await client.get(`/rules/tenant/${tenantId}`);
    return response.data;
  },
};
