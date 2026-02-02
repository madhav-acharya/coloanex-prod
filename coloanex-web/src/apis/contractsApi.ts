import { baseApi } from "./baseApi";

export interface Signature {
  signedBy: "BORROWER" | "TENANT";
  signature: string;
  signedAt: string;
  ipAddress?: string;
}

export interface BlockchainData {
  transactionHash?: string;
  blockNumber?: number;
  network?: string;
  contractAddress?: string;
  timestamp?: string;
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
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "DEFAULTED" | "CANCELLED";
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
  blockchainData?: BlockchainData;
  termsAndConditions: string;
  disbursementInfo?: DisbursementInfo;
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
  status?: "DRAFT" | "ACTIVE" | "COMPLETED" | "DEFAULTED" | "CANCELLED";
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

export const contractsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getContracts: builder.query<Contract[], void>({
      query: () => "/contracts",
    }),
    getContract: builder.query<Contract, string>({
      query: (id) => `/contracts/${id}`,
    }),
    createContract: builder.mutation<Contract, CreateContractDto>({
      query: (data) => ({
        url: "/contracts",
        method: "POST",
        body: data,
      }),
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
    }),
    deleteContract: builder.mutation<void, string>({
      query: (id) => ({
        url: `/contracts/${id}`,
        method: "DELETE",
      }),
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
} = contractsApi;
