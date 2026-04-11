import client from "./client";

export interface PaymentConfig {
  id: string;
  ownerScope: "USER" | "TENANT";
  ownerUserId?: string;
  tenantId?: string;
  gateway: "ESEWA" | "KHALTI";
  environment: "sandbox" | "production";
  isActive: boolean;
  publicKey?: string;
  secretKey?: string;
  merchantId?: string;
  webhookUrl?: string;
  payoutConfig?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const paymentConfigsApi = {
  listMine: async (): Promise<PaymentConfig[]> => {
    const response = await client.get("/payment-configs/me");
    return response.data;
  },

  upsert: async (data: {
    scope: "USER" | "TENANT";
    userId?: string;
    tenantId?: string;
    gateway: "ESEWA" | "KHALTI";
    environment: "sandbox" | "production";
    isActive?: boolean;
    publicKey?: string;
    secretKey?: string;
    merchantId?: string;
    webhookUrl?: string;
    payoutConfig?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<PaymentConfig> => {
    const response = await client.post("/payment-configs", data);
    return response.data;
  },

  remove: async (id: string): Promise<{ message: string }> => {
    const response = await client.delete(`/payment-configs/${id}`);
    return response.data;
  },
};
