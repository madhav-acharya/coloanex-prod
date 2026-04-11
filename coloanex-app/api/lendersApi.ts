import apiClient from "./client";
import type { Lender } from "@/types";

export const lendersApi = {
  getAll: async (params?: {
    limit?: number;
    offset?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{ data: Lender[]; total: number; hasMore: boolean }> => {
    const { data } = await apiClient.get("/tenants", { params });
    return {
      data: data.data || [],
      total: data.total || 0,
      hasMore: data.hasMore || false,
    };
  },

  getById: async (id: string): Promise<any> => {
    const { data } = await apiClient.get(`/tenants/${id}`);
    return data;
  },

  getReviews: async (lenderId: string): Promise<any[]> => {
    const { data } = await apiClient.get(`/tenants/${lenderId}/reviews`);
    return data;
  },
};
