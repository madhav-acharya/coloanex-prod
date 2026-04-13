import { baseApi } from "./baseApi";

export interface AdminAnalytics {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalLoans: number;
  totalContracts: number;
  totalTransactions: number;
  pendingKYCs: number;
  totalLoanAmount: number;
  totalContractAmount: number;
}

export interface TenantAnalytics {
  totalBorrowers: number;
  totalLoans: number;
  activeLoans: number;
  totalContracts: number;
  activeContracts: number;
  pendingKYCs: number;
  verifiedKYCs: number;
  totalDisbursed: number;
  totalCollected: number;
  pendingPayments: number;
  trendPercentages?: {
    newBorrowers: number;
    periodLoans: number;
    activeLoans: number;
    periodContracts: number;
    verifiedBorrowers: number;
    pendingKYCs: number;
    activeContracts: number;
    periodDisbursed: number;
    periodCollected: number;
    pendingPayments: number;
  };
  trendSeries?: {
    newBorrowers: Array<{ month: string; value: number }>;
    periodLoans: Array<{ month: string; value: number }>;
    activeLoans: Array<{ month: string; value: number }>;
    periodContracts: Array<{ month: string; value: number }>;
    verifiedBorrowers: Array<{ month: string; value: number }>;
    pendingKYCs: Array<{ month: string; value: number }>;
    activeContracts: Array<{ month: string; value: number }>;
    periodDisbursed: Array<{ month: string; value: number }>;
    periodCollected: Array<{ month: string; value: number }>;
    pendingPayments: Array<{ month: string; value: number }>;
  };
}

export interface MonthlyData {
  month: string;
  count: number;
  amount: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
}

export interface StatusData {
  status: string;
  count: number;
}

export interface UserRoleData {
  role: string;
  count: number;
}

export interface BorrowerStatusData {
  status: string;
  count: number;
}

type TrendQuery =
  | number
  | {
      months?: number;
      startDate?: string;
      endDate?: string;
    }
  | void;

const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminAnalytics: builder.query<AdminAnalytics, void>({
      query: () => "analytics/admin",
    }),
    getTenantAnalytics: builder.query<
      TenantAnalytics,
      { tenantId?: string; startDate?: string; endDate?: string } | void
    >({
      query: (params) => ({
        url: "analytics/tenant",
        params: params
          ? {
              ...(params.tenantId ? { tenantId: params.tenantId } : {}),
              ...(params.startDate ? { startDate: params.startDate } : {}),
              ...(params.endDate ? { endDate: params.endDate } : {}),
            }
          : {},
      }),
    }),
    getMonthlyContracts: builder.query<MonthlyData[], TrendQuery>({
      query: (arg) => ({
        url: "analytics/contracts/monthly",
        params:
          typeof arg === "number"
            ? { months: arg }
            : {
                months: arg?.months ?? 12,
                ...(arg?.startDate ? { startDate: arg.startDate } : {}),
                ...(arg?.endDate ? { endDate: arg.endDate } : {}),
              },
      }),
    }),
    getMonthlyLoans: builder.query<MonthlyData[], TrendQuery>({
      query: (arg) => ({
        url: "analytics/loans/monthly",
        params:
          typeof arg === "number"
            ? { months: arg }
            : {
                months: arg?.months ?? 12,
                ...(arg?.startDate ? { startDate: arg.startDate } : {}),
                ...(arg?.endDate ? { endDate: arg.endDate } : {}),
              },
      }),
    }),
    getLoansByStatus: builder.query<
      StatusData[],
      { startDate?: string; endDate?: string } | void
    >({
      query: (params) => ({
        url: "analytics/loans/status",
        params: params
          ? {
              ...(params.startDate ? { startDate: params.startDate } : {}),
              ...(params.endDate ? { endDate: params.endDate } : {}),
            }
          : {},
      }),
    }),
    getContractsByStatus: builder.query<
      StatusData[],
      { startDate?: string; endDate?: string } | void
    >({
      query: (params) => ({
        url: "analytics/contracts/status",
        params: params
          ? {
              ...(params.startDate ? { startDate: params.startDate } : {}),
              ...(params.endDate ? { endDate: params.endDate } : {}),
            }
          : {},
      }),
    }),
    getMonthlyRevenue: builder.query<RevenueData[], TrendQuery>({
      query: (arg) => ({
        url: "analytics/revenue/monthly",
        params:
          typeof arg === "number"
            ? { months: arg }
            : {
                months: arg?.months ?? 12,
                ...(arg?.startDate ? { startDate: arg.startDate } : {}),
                ...(arg?.endDate ? { endDate: arg.endDate } : {}),
              },
      }),
    }),
    getMonthlyUsers: builder.query<MonthlyData[], TrendQuery>({
      query: (arg) => ({
        url: "analytics/users/monthly",
        params:
          typeof arg === "number"
            ? { months: arg }
            : {
                months: arg?.months ?? 12,
                ...(arg?.startDate ? { startDate: arg.startDate } : {}),
                ...(arg?.endDate ? { endDate: arg.endDate } : {}),
              },
      }),
    }),
    getUsersByRole: builder.query<
      UserRoleData[],
      { startDate?: string; endDate?: string } | void
    >({
      query: (params) => ({
        url: "analytics/users/by-role",
        params: params
          ? {
              ...(params.startDate ? { startDate: params.startDate } : {}),
              ...(params.endDate ? { endDate: params.endDate } : {}),
            }
          : {},
      }),
    }),
    getMonthlyBorrowers: builder.query<MonthlyData[], TrendQuery>({
      query: (arg) => ({
        url: "analytics/borrowers/monthly",
        params:
          typeof arg === "number"
            ? { months: arg }
            : {
                months: arg?.months ?? 12,
                ...(arg?.startDate ? { startDate: arg.startDate } : {}),
                ...(arg?.endDate ? { endDate: arg.endDate } : {}),
              },
      }),
    }),
    getBorrowerMonthlyLoans: builder.query<MonthlyData[], TrendQuery>({
      query: (arg) => ({
        url: "analytics/borrowers/monthly-loans",
        params:
          typeof arg === "number"
            ? { months: arg }
            : {
                months: arg?.months ?? 12,
                ...(arg?.startDate ? { startDate: arg.startDate } : {}),
                ...(arg?.endDate ? { endDate: arg.endDate } : {}),
              },
      }),
    }),
    getBorrowersByStatus: builder.query<
      BorrowerStatusData[],
      { startDate?: string; endDate?: string } | void
    >({
      query: (params) => ({
        url: "analytics/borrowers/by-status",
        params: params
          ? {
              ...(params.startDate ? { startDate: params.startDate } : {}),
              ...(params.endDate ? { endDate: params.endDate } : {}),
            }
          : {},
      }),
    }),
  }),
});

export const {
  useGetAdminAnalyticsQuery,
  useGetTenantAnalyticsQuery,
  useGetMonthlyContractsQuery,
  useGetMonthlyLoansQuery,
  useGetLoansByStatusQuery,
  useGetContractsByStatusQuery,
  useGetMonthlyRevenueQuery,
  useGetMonthlyUsersQuery,
  useGetUsersByRoleQuery,
  useGetMonthlyBorrowersQuery,
  useGetBorrowerMonthlyLoansQuery,
  useGetBorrowersByStatusQuery,
} = analyticsApi;

export default analyticsApi;
