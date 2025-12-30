import apiClient from "./client";
import type { Lender, Review } from "@/types";

export const lendersApi = {
  getAll: async (): Promise<Lender[]> => {
    const { data } = await apiClient.get("/tenants");
    return data.data || [];
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
