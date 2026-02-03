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
  pendingBalance: number;
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
      invalidatesTags: ["Wallets"],
    }),
    getMyWallet: builder.query<Wallet, void>({
      query: () => "/wallets/my-wallet",
      providesTags: ["Wallets"],
    }),
    getWalletByUser: builder.query<Wallet, string>({
      query: (userId) => `/wallets/user/${userId}`,
      providesTags: ["Wallets"],
    }),
    getWallet: builder.query<Wallet, string>({
      query: (id) => `/wallets/${id}`,
      providesTags: ["Wallets"],
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
      invalidatesTags: ["Wallets"],
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
