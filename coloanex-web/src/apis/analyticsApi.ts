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

const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminAnalytics: builder.query<AdminAnalytics, void>({
      query: () => "analytics/admin",
    }),
    getTenantAnalytics: builder.query<TenantAnalytics, string | void>({
      query: (tenantId) => ({
        url: "analytics/tenant",
        params: tenantId ? { tenantId } : {},
      }),
    }),
    getMonthlyContracts: builder.query<MonthlyData[], number | void>({
      query: (months = 12) => ({
        url: "analytics/contracts/monthly",
        params: { months },
      }),
    }),
    getMonthlyLoans: builder.query<MonthlyData[], number | void>({
      query: (months = 12) => ({
        url: "analytics/loans/monthly",
        params: { months },
      }),
    }),
    getLoansByStatus: builder.query<StatusData[], void>({
      query: () => "analytics/loans/status",
    }),
    getContractsByStatus: builder.query<StatusData[], void>({
      query: () => "analytics/contracts/status",
    }),
    getMonthlyRevenue: builder.query<RevenueData[], number | void>({
      query: (months = 12) => ({
        url: "analytics/revenue/monthly",
        params: { months },
      }),
    }),
    getMonthlyUsers: builder.query<MonthlyData[], number | void>({
      query: (months = 12) => ({
        url: "analytics/users/monthly",
        params: { months },
      }),
    }),
    getUsersByRole: builder.query<UserRoleData[], void>({
      query: () => "analytics/users/by-role",
    }),
    getBorrowerMonthlyLoans: builder.query<MonthlyData[], number | void>({
      query: (months = 12) => ({
        url: "analytics/borrowers/monthly",
        params: { months },
      }),
    }),
    getBorrowersByStatus: builder.query<BorrowerStatusData[], void>({
      query: () => "analytics/borrowers/by-status",
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
  useGetBorrowerMonthlyLoansQuery,
  useGetBorrowersByStatusQuery,
} = analyticsApi;

export default analyticsApi;
