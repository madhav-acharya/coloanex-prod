import apiClient from "./client";
import type { KycSubmission, KycStatus } from "@/types";

export const kycApi = {
  submit: async (kycData: any): Promise<any> => {
    const { data } = await apiClient.post("/kyc", kycData);
    return data;
  },

  getStatus: async (): Promise<any> => {
    const { data } = await apiClient.get("/kyc/status");
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
