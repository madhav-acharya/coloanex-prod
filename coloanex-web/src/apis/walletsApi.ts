import { baseApi } from "./baseApi";

export interface PaymentGatewayLinks {
  esewa?: string;
  fonepay?: string;
  khalti?: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  paymentGatewayLinks?: PaymentGatewayLinks;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface CreateWalletDto {
  esewa?: string;
  fonepay?: string;
  khalti?: string;
}

export const walletsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createWallet: builder.mutation<Wallet, CreateWalletDto>({
      query: (data) => ({
        url: "/wallets",
        method: "POST",
        body: data,
      }),
    }),
    getMyWallet: builder.query<Wallet, void>({
      query: () => "/wallets/my-wallet",
    }),
    getWalletByUser: builder.query<Wallet, string>({
      query: (userId) => `/wallets/user/${userId}`,
    }),
    getWallet: builder.query<Wallet, string>({
      query: (id) => `/wallets/${id}`,
    }),
    updateWalletBalance: builder.mutation<
      Wallet,
      { id: string; amount: number }
    >({
      query: ({ id, amount }) => ({
        url: `/wallets/${id}/balance`,
        method: "PATCH",
        body: { amount },
      }),
    }),
  }),
});

export const {
  useCreateWalletMutation,
  useGetMyWalletQuery,
  useGetWalletByUserQuery,
  useGetWalletQuery,
  useUpdateWalletBalanceMutation,
} = walletsApi;
