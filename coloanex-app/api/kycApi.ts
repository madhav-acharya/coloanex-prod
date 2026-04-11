import apiClient from "./client";
import type { Kyc } from "@/types";

export const kycApi = {
  submit: async (kycData: any): Promise<any> => {
    const { data } = await apiClient.post("/kyc", kycData);
    return data;
  },

  getStatus: async (tenantId?: string): Promise<any> => {
    const params = tenantId ? { tenantId } : {};
    const { data } = await apiClient.get("/kyc/status", { params });
    return data;
  },

  getMyLatest: async (tenantId?: string): Promise<any> => {
    const params = tenantId ? { tenantId } : {};
    const { data } = await apiClient.get("/kyc/my-latest", { params });
    return data;
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    status?: string;
  }): Promise<{ data: Kyc[]; total: number }> => {
    const { data } = await apiClient.get("/kyc", { params });
    return data;
  },

  getById: async (id: string): Promise<any> => {
    const { data } = await apiClient.get(`/kyc/${id}`);
    return data;
  },

  update: async (id: string, payload: any): Promise<any> => {
    const { data } = await apiClient.patch(`/kyc/${id}`, payload);
    return data;
  },

  uploadDocument: async (file: any, documentType: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);

    const { data } = await apiClient.post("/uploads/single", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return data.url;
  },
};
