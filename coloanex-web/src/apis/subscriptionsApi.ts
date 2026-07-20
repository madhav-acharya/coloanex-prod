import { baseApi } from "./baseApi";

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  scope: "USER" | "TENANT";
  description?: string;
  features?: string[] | Record<string, unknown>;
  price: number;
  maxTransactions: number;
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
  userId?: string;
  tenantId?: string;
  startsAt: string;
  endsAt?: string;
  usageCount?: number;
  usageWindowStart?: string;
  tenant?: { id: string; name: string };
  planRef?: {
    code: string;
    name: string;
    maxTransactions?: number;
    billingCycle?: string;
    currency?: string;
  };
}

export const subscriptionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listPlans: builder.query<SubscriptionPlan[], void>({
      query: () => "/subscriptions/plans",
      providesTags: ["Subscriptions"],
    }),
    listMySubscriptions: builder.query<Subscription[], void>({
      query: () => "/subscriptions/me",
      providesTags: ["Subscriptions"],
    }),
    purchaseSubscription: builder.mutation<
      Subscription,
      {
        planCode: string;
        scope: "USER" | "TENANT";
        tenantId?: string;
        paymentTransactionId?: string;
      }
    >({
      query: (body) => ({
        url: "/subscriptions/purchase",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Subscriptions", "Transactions"],
    }),
    selectSubscription: builder.mutation<Subscription, { id: string }>({
      query: ({ id }) => ({
        url: `/subscriptions/${id}/select`,
        method: "POST",
      }),
      invalidatesTags: ["Subscriptions", "Transactions"],
    }),
    createPlan: builder.mutation<
      SubscriptionPlan,
      {
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
      }
    >({
      query: (body) => ({
        url: "/subscriptions/plans",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Subscriptions"],
    }),
    updatePlan: builder.mutation<
      SubscriptionPlan,
      {
        id: string;
        code?: string;
        name?: string;
        scope?: "USER" | "TENANT";
        description?: string;
        features?: string[];
        price?: number;
        maxTransactions?: number;
        currency?: string;
        billingCycle?: string;
        isActive?: boolean;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/subscriptions/plans/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Subscriptions"],
    }),
    deletePlan: builder.mutation<{ message: string }, { id: string }>({
      query: ({ id }) => ({
        url: `/subscriptions/plans/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Subscriptions"],
    }),
  }),
});

export const {
  useListPlansQuery,
  useListMySubscriptionsQuery,
  usePurchaseSubscriptionMutation,
  useSelectSubscriptionMutation,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
} = subscriptionsApi;
