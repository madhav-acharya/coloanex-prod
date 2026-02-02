import { baseApi } from "./baseApi";

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

export interface CreateRuleDto {
  name: string;
  description?: string;
  ruleType: "STANDARD" | "PREMIUM" | "MICRO_LOAN" | "BUSINESS_LOAN";
  interestRate: number;
  loanLimits: LoanLimits;
  penaltyConfig: PenaltyConfig;
  paymentConfig: PaymentConfig;
  isActive?: boolean;
  isPubliclyVisible?: boolean;
}

export interface UpdateRuleDto extends Partial<CreateRuleDto> {}

export const rulesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRules: builder.query<Rule[], void>({
      query: () => "/rules",
    }),
    getRule: builder.query<Rule, string>({
      query: (id) => `/rules/${id}`,
    }),
    getRulesByTenant: builder.query<Rule[], string>({
      query: (tenantId) => `/rules/tenant/${tenantId}`,
    }),
    createRule: builder.mutation<Rule, CreateRuleDto>({
      query: (data) => ({
        url: "/rules",
        method: "POST",
        body: data,
      }),
    }),
    updateRule: builder.mutation<Rule, { id: string; data: UpdateRuleDto }>({
      query: ({ id, data }) => ({
        url: `/rules/${id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    deleteRule: builder.mutation<void, string>({
      query: (id) => ({
        url: `/rules/${id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetRulesQuery,
  useGetRuleQuery,
  useGetRulesByTenantQuery,
  useCreateRuleMutation,
  useUpdateRuleMutation,
  useDeleteRuleMutation,
} = rulesApi;
