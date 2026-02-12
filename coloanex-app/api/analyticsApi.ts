import client from "./client";

export interface BorrowerAnalytics {
  totalLoans: number;
  activeLoans: number;
  totalBorrowed: number;
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

const analyticsApi = {
  getBorrowerAnalytics: async (): Promise<BorrowerAnalytics> => {
    const response = await client.get("/analytics/borrower");
    return response.data;
  },

  getMonthlyLoans: async (months: number = 6): Promise<MonthlyData[]> => {
    const response = await client.get("/analytics/loans/monthly", {
      params: { months },
    });
    return response.data;
  },

  getLoansByStatus: async (): Promise<StatusData[]> => {
    const response = await client.get("/analytics/loans/status");
    return response.data;
  },
};

export default analyticsApi;
