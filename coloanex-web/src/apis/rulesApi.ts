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
  interestRate: number | string;
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
  evmAddress?: string | null;
  isOnChain?: boolean;
  blockchainTxHash?: string | null;
  blockchainData?: Record<string, unknown> | null;
}

export interface CreateRuleDto {
  id?: string;
  tenantId?: string;
  name: string;
  description?: string;
  ruleType: "STANDARD" | "PREMIUM" | "MICRO_LOAN" | "BUSINESS_LOAN";
  interestRate: number;
  loanLimits: LoanLimits;
  penaltyConfig: PenaltyConfig;
  paymentConfig: PaymentConfig;
  isActive?: boolean;
  isPubliclyVisible?: boolean;
  blockchainTxHash?: string;
  blockchainData?: Record<string, unknown>;
}

export interface UpdateRuleDto extends Partial<CreateRuleDto> {}

export const rulesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRules: builder.query<Rule[], void>({
      query: () => "/rules",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Rules" as const, id })),
              { type: "Rules", id: "LIST" },
            ]
          : [{ type: "Rules", id: "LIST" }],
    }),
    getRule: builder.query<Rule, string>({
      query: (id) => `/rules/${id}`,
      providesTags: (result, error, id) => [{ type: "Rules", id }],
    }),
    getRulesByTenant: builder.query<Rule[], string>({
      query: (tenantId) => `/rules/tenant/${tenantId}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Rules" as const, id })),
              { type: "Rules", id: "LIST" },
            ]
          : [{ type: "Rules", id: "LIST" }],
    }),
    createRule: builder.mutation<Rule, CreateRuleDto>({
      query: (data) => ({
        url: "/rules",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Rules", id: "LIST" }],
    }),
    updateRule: builder.mutation<Rule, { id: string; data: UpdateRuleDto }>({
      query: ({ id, data }) => ({
        url: `/rules/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Rules", id },
        { type: "Rules", id: "LIST" },
      ],
    }),
    deleteRule: builder.mutation<void, string>({
      query: (id) => ({
        url: `/rules/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Rules", id },
        { type: "Rules", id: "LIST" },
      ],
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
