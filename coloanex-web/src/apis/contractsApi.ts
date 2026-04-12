import { baseApi } from "./baseApi";

export interface Signature {
  signedBy: "BORROWER" | "TENANT";
  signature: string;
  signedAt: string;
  ipAddress?: string;
}

export interface DisbursementInfo {
  method: "ESEWA" | "FONEPAY" | "KHALTI" | "WALLET" | "BANK_TRANSFER";
  accountNumber?: string;
  accountName?: string;
  disbursedAt?: string;
  transactionId?: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
}

export interface Contract {
  id: string;
  contractNumber: string;
  tenantId: string;
  borrowerId: string;
  loanId: string;
  ruleId: string;
  status:
    | "DRAFT"
    | "GENERATED"
    | "SIGNED"
    | "ACTIVE"
    | "COMPLETED"
    | "DEFAULTED"
    | "CANCELLED"
    | "REPORTED";
  startDate: string;
  endDate: string;
  loanAmount: number;
  interestRate: number;
  termMonths: number;
  paymentFrequency: "WEEKLY" | "MONTHLY" | "QUARTERLY";
  installmentAmount: number;
  totalInstallments: number;
  totalAmountDue: number;
  totalAmountPaid: number;
  outstandingBalance: number;
  contractPdfUrl?: string;
  signatures?: Signature[];
  termsAndConditions: string;
  disbursementInfo?: DisbursementInfo;
  reportReason?: string;
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
  tenant?: {
    id: string;
    name: string;
    logo?: string;
  };
  borrower?: {
    id: string;
    userId: string;
    user?: {
      id: string;
      fullName: string;
      email: string;
    };
  };
  loan?: {
    id: string;
    purpose: string;
  };
  rule?: {
    id: string;
    name: string;
    ruleType: string;
  };
}

export interface CreateContractDto {
  loanId: string;
  ruleId: string;
  startDate: string;
  termMonths: number;
  paymentFrequency: "WEEKLY" | "MONTHLY" | "QUARTERLY";
  termsAndConditions: string;
  loanAmount?: number;
  interestRate?: number;
}

export interface UpdateContractDto {
  status?:
    | "DRAFT"
    | "GENERATED"
    | "SIGNED"
    | "ACTIVE"
    | "COMPLETED"
    | "DEFAULTED"
    | "CANCELLED"
    | "REPORTED";
}

export interface SignContractDto {
  signature: string;
  ipAddress?: string;
}

export interface DisburseContractDto {
  method: "ESEWA" | "FONEPAY" | "KHALTI" | "WALLET" | "BANK_TRANSFER";
  accountNumber?: string;
  accountName?: string;
  transactionId?: string;
}

export interface SignAndDisburseContractDto {
  signature: string;
  method: "ESEWA" | "FONEPAY" | "KHALTI" | "WALLET" | "BANK_TRANSFER";
  accountNumber?: string;
  accountName?: string;
  transactionId?: string;
  blockchainTxHash?: string;
  blockchainData?: Record<string, unknown>;
}

export const contractsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getContracts: builder.query<Contract[], void>({
      query: () => "/contracts",
      providesTags: [{ type: "Contracts", id: "LIST" }],
    }),
    getContract: builder.query<Contract, string>({
      query: (id) => `/contracts/${id}`,
      providesTags: (result, error, id) => [{ type: "Contracts", id }],
    }),
    createContract: builder.mutation<Contract, CreateContractDto>({
      query: (data) => ({
        url: "/contracts",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Contracts", id: "LIST" }],
    }),
    updateContract: builder.mutation<
      Contract,
      { id: string; data: UpdateContractDto }
    >({
      query: ({ id, data }) => ({
        url: `/contracts/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Contracts", id },
        { type: "Contracts", id: "LIST" },
      ],
    }),
    signContract: builder.mutation<
      Contract,
      { id: string; data: SignContractDto }
    >({
      query: ({ id, data }) => ({
        url: `/contracts/${id}/sign`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Contracts", id },
        { type: "Contracts", id: "LIST" },
      ],
    }),
    disburseContract: builder.mutation<
      Contract,
      { id: string; data: DisburseContractDto }
    >({
      query: ({ id, data }) => ({
        url: `/contracts/${id}/disburse`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Contracts", id },
        { type: "Contracts", id: "LIST" },
      ],
    }),
    deleteContract: builder.mutation<void, string>({
      query: (id) => ({
        url: `/contracts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Contracts", id },
        { type: "Contracts", id: "LIST" },
      ],
    }),
    generateContractPdf: builder.mutation<Contract, string>({
      query: (id) => ({
        url: `/contracts/${id}/generate`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Contracts", id },
        { type: "Contracts", id: "LIST" },
      ],
    }),
    signAndDisburseContract: builder.mutation<
      Contract,
      { id: string; data: SignAndDisburseContractDto }
    >({
      query: ({ id, data }) => ({
        url: `/contracts/${id}/sign-and-disburse`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Contracts", id },
        { type: "Contracts", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetContractsQuery,
  useGetContractQuery,
  useCreateContractMutation,
  useUpdateContractMutation,
  useSignContractMutation,
  useDisburseContractMutation,
  useDeleteContractMutation,
  useGenerateContractPdfMutation,
  useSignAndDisburseContractMutation,
} = contractsApi;
