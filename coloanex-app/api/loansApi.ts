import apiClient from "./client";
import type { Loan, LoanApplication, PaymentSchedule } from "@/types";

export const loansApi = {
  getMyLoans: async (): Promise<Loan[]> => {
    const { data } = await apiClient.get("/loans/my-loans");
    return data;
  },

  getMyLatest: async (): Promise<Loan | null> => {
    const { data } = await apiClient.get("/loans/my-latest");
    return data;
  },

  checkExisting: async (
    tenantId: string,
  ): Promise<{ hasLoan: boolean; loanId?: string; status?: string }> => {
    const { data } = await apiClient.get(`/loans/check-existing/${tenantId}`);
    return data;
  },

  getById: async (id: string): Promise<Loan> => {
    const { data } = await apiClient.get(`/loans/${id}`);
    return data;
  },

  apply: async (application: LoanApplication): Promise<any> => {
    const { data } = await apiClient.post("/loans/apply", application);
    return data;
  },

  applyForLoan: async (loanData: any): Promise<any> => {
    const { data } = await apiClient.post("/loans", loanData);
    return data;
  },

  getPaymentSchedule: async (loanId: string): Promise<PaymentSchedule[]> => {
    const { data } = await apiClient.get(`/loans/${loanId}/payment-schedule`);
    return data;
  },

  makePayment: async (
    loanId: string,
    amount: number,
    paymentMethodId?: string,
  ): Promise<any> => {
    const { data } = await apiClient.post(`/loans/${loanId}/payment`, {
      amount,
      paymentMethodId,
    });
    return data;
  },

  calculatePayment: async (
    amount: number,
    interestRate: number,
    term: number,
  ): Promise<number> => {
    const monthlyRate = interestRate / 100 / 12;
    const payment =
      (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) /
      (Math.pow(1 + monthlyRate, term) - 1);
    return Math.round(payment * 100) / 100;
  },

  getBlockchainHistory: async (id: string): Promise<any> => {
    return data;
  },
};
