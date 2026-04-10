import client from "./client";

export interface BorrowerAnalytics {
  totalLoans: number;
  activeLoans: number;
  totalBorrowed: number;
  totalInterest: number;
  totalAmountDue: number;
  totalPaid: number;
  pendingAmount: number;
  overduePayments: number;
}

export interface MonthlyData {
  month: string;
  count: number;
  amount: number;
}

export interface StatusData {
  status: string;
  count: number;
}

export interface AnalyticsRangeParams {
  startDate?: string;
  endDate?: string;
}

const analyticsApi = {
  getBorrowerAnalytics: async (
    range?: AnalyticsRangeParams,
  ): Promise<BorrowerAnalytics> => {
    const response = await client.get("/analytics/borrower", {
      params: range,
    });
    return response.data;
  },

  getMonthlyLoans: async (
    months: number = 6,
    range?: AnalyticsRangeParams,
  ): Promise<MonthlyData[]> => {
    const response = await client.get("/analytics/loans/monthly", {
      params: { months, ...range },
    });
    return response.data;
  },

  getLoansByStatus: async (
    range?: AnalyticsRangeParams,
  ): Promise<StatusData[]> => {
    const response = await client.get("/analytics/loans/status", {
      params: range,
    });
    return response.data;
  },
};

export default analyticsApi;
