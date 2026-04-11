import client from "./client";

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  scope: "USER" | "TENANT";
  description?: string;
  features?: string[];
  price: number;
  maxTransactions?: number;
  currency: string;
  billingCycle: string;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  scope: "USER" | "TENANT";
  plan: string;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED" | "CANCELLED";
  lifecycleStatus?: "BOUGHT" | "EXPIRED" | "LIMIT_EXCEEDED";
  isSelected?: boolean;
  startsAt: string;
  endsAt?: string;
  tenantId?: string;
  usageCount?: number;
  usageWindowStart?: string;
  planRef?: {
    code: string;
    name: string;
    maxTransactions?: number;
    billingCycle?: string;
    currency?: string;
  };
}

export const subscriptionsApi = {
  listPlans: async (): Promise<SubscriptionPlan[]> => {
    const response = await client.get("/subscriptions/plans");
    return response.data;
  },

  listMine: async (): Promise<Subscription[]> => {
    const response = await client.get("/subscriptions/me");
    return response.data;
  },

  purchase: async (data: {
    planCode: string;
    scope: "USER" | "TENANT";
    tenantId?: string;
    paymentTransactionId?: string;
  }): Promise<Subscription> => {
    const response = await client.post("/subscriptions/purchase", data);
    return response.data;
  },

  select: async (id: string): Promise<Subscription> => {
    const response = await client.post(`/subscriptions/${id}/select`);
    return response.data;
  },

  createPlan: async (data: {
    code: string;
    name: string;
    scope?: "USER" | "TENANT";
    description?: string;
    features?: string[];
    price: number;
    maxTransactions?: number;
    currency?: string;
    billingCycle?: string;
    isActive?: boolean;
  }): Promise<SubscriptionPlan> => {
    const response = await client.post("/subscriptions/plans", data);
    return response.data;
  },

  updatePlan: async (
    id: string,
    data: Partial<SubscriptionPlan>,
  ): Promise<SubscriptionPlan> => {
    const response = await client.patch(`/subscriptions/plans/${id}`, data);
    return response.data;
  },

  removePlan: async (id: string): Promise<{ message: string }> => {
    const response = await client.delete(`/subscriptions/plans/${id}`);
    return response.data;
  },
};
