import { baseApi } from "./baseApi";

export interface Wallet {
  id: string;
  userId: string;
  provider: "METAMASK" | "EXPO_SECURE" | "ESEWA" | "KHALTI";
  purpose: "PRIMARY" | "GAS" | "RECEIVE_ESEWA" | "RECEIVE_KHALTI" | "GENERAL";
  platform: "WEB" | "APP";
  address: string;
  label?: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWalletDto {
  provider: "METAMASK" | "EXPO_SECURE" | "ESEWA" | "KHALTI";
  purpose?: "PRIMARY" | "GAS" | "RECEIVE_ESEWA" | "RECEIVE_KHALTI" | "GENERAL";
  platform: "WEB" | "APP";
  address: string;
  label?: string;
}

export const walletsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyWallets: builder.query<Wallet[], void>({
      query: () => "/wallets/me",
      providesTags: ["Wallets"],
    }),
    createWallet: builder.mutation<Wallet, CreateWalletDto>({
      query: (body) => ({
        url: "/wallets",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Wallets"],
    }),
    updateGasMode: builder.mutation<
      {
        id: string;
        gasPaymentMode: "USER_WALLET" | "PLATFORM_WALLET";
      },
      {
        gasPaymentMode: "USER_WALLET" | "PLATFORM_WALLET";
        platform?: "WEB" | "APP";
      }
    >({
      query: (body) => ({
        url: "/wallets/gas-mode",
        method: "PATCH",
        body: {
          gasPaymentMode: body.gasPaymentMode,
          platform: body.platform || "WEB",
        },
      }),
      invalidatesTags: ["Wallets", "Transactions", "Auth"],
    }),
    setPrimaryWallet: builder.mutation<Wallet, { id: string }>({
      query: ({ id }) => ({
        url: `/wallets/${id}/primary`,
        method: "PATCH",
      }),
      invalidatesTags: ["Wallets"],
    }),
    deleteWallet: builder.mutation<{ message: string }, { id: string }>({
      query: ({ id }) => ({
        url: `/wallets/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Wallets"],
    }),
  }),
});

export const {
  useGetMyWalletsQuery,
  useCreateWalletMutation,
  useUpdateGasModeMutation,
  useSetPrimaryWalletMutation,
  useDeleteWalletMutation,
} = walletsApi;
