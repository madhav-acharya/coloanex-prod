import { baseApi } from "./baseApi";

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

export const paymentConfigsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listMyPaymentConfigs: builder.query<PaymentConfig[], void>({
      query: () => "/payment-configs/me",
      providesTags: ["PaymentConfigs"],
    }),
    upsertPaymentConfig: builder.mutation<
      PaymentConfig,
      {
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
      }
    >({
      query: (body) => ({
        url: "/payment-configs",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PaymentConfigs"],
    }),
    deletePaymentConfig: builder.mutation<{ message: string }, { id: string }>({
      query: ({ id }) => ({
        url: `/payment-configs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PaymentConfigs"],
    }),
  }),
});

export const {
  useListMyPaymentConfigsQuery,
  useUpsertPaymentConfigMutation,
  useDeletePaymentConfigMutation,
} = paymentConfigsApi;
