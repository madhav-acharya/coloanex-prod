import { baseApi } from "./baseApi";

export interface PaymentDetails {
  gateway: "ESEWA" | "FONEPAY" | "KHALTI" | "WALLET" | "BANK_TRANSFER";
  transactionId?: string;
  accountNumber?: string;
  accountName?: string;
  remarks?: string;
}

export interface GatewayDetails {
  gatewayTransactionId?: string;
  gatewayStatus?: string;
  gatewayResponse?: any;
}

export interface Transaction {
  id: string;
  contractId?: string;
  walletId?: string;
  type:
    | "DEPOSIT"
    | "WITHDRAW"
    | "DISBURSEMENT"
    | "INSTALLMENT_PAYMENT"
    | "PENALTY_PAYMENT"
    | "FEE";
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  paymentDetails?: PaymentDetails;
  gatewayDetails?: GatewayDetails;
  createdAt: string;
  updatedAt: string;
  contract?: {
    id: string;
    contractNumber: string;
  };
  wallet?: {
    id: string;
    userId: string;
  };
}

export interface CreateTransactionDto {
  contractId?: string;
  walletId?: string;
  type:
    | "DEPOSIT"
    | "WITHDRAW"
    | "DISBURSEMENT"
    | "INSTALLMENT_PAYMENT"
    | "PENALTY_PAYMENT"
    | "FEE";
  amount: number;
  paymentDetails?: PaymentDetails;
}

export const transactionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createTransaction: builder.mutation<Transaction, CreateTransactionDto>({
      query: (data) => ({
        url: "/transactions",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Transactions", "Wallets"],
    }),
    getTransactionsByContract: builder.query<Transaction[], string>({
      query: (contractId) => `/transactions/contract/${contractId}`,
      providesTags: ["Transactions"],
    }),
    getTransactionsByWallet: builder.query<Transaction[], string>({
      query: (walletId) => `/transactions/wallet/${walletId}`,
      providesTags: ["Transactions"],
    }),
    getTransaction: builder.query<Transaction, string>({
      query: (id) => `/transactions/${id}`,
      providesTags: ["Transactions"],
    }),
    updateTransactionStatus: builder.mutation<
      Transaction,
      { id: string; status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED" }
    >({
      query: ({ id, status }) => ({
        url: `/transactions/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Transactions"],
    }),


  }),
});

export const {
  useCreateTransactionMutation,
  useGetTransactionsByContractQuery,
  useGetTransactionsByWalletQuery,
  useGetTransactionQuery,
  useUpdateTransactionStatusMutation,
} = transactionsApi;
