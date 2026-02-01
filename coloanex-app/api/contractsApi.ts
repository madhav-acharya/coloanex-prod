import client from "./client";

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

export interface SignContractDto {
  signature: string;
  ipAddress?: string;
}

export const contractsApi = {
  getAll: async (): Promise<Contract[]> => {
    const response = await client.get("/contracts");
    return response.data;
  },

  getById: async (id: string): Promise<Contract> => {
    const response = await client.get(`/contracts/${id}`);
    return response.data;
  },

  sign: async (id: string, data: SignContractDto): Promise<Contract> => {
    const response = await client.post(`/contracts/${id}/sign`, data);
    return response.data;
  },
};
