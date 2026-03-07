export interface ContractAsset {
  docType: "contract";
  id: string;
  contractNumber: string;
  tenantId: string;
  borrowerId: string;
  loanId: string;
  ruleId: string;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  loanAmount: string;
  interestRate: string;
  termMonths: number;
  paymentFrequency: PaymentFrequency;
  installmentAmount: string;
  totalInstallments: number;
  totalAmountDue: string;
  totalAmountPaid: string;
  outstandingBalance: string;
  signatures: ContractSignature[];
  termsAndConditions: string;
  disbursementInfo: DisbursementInfo | null;
  signedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContractSignature {
  signerId: string;
  signerRole: string;
  signedAt: string;
  signatureHash: string;
}

export interface DisbursementInfo {
  disbursedAt: string;
  disbursedAmount: string;
  method: string;
  reference: string;
}

export type ContractStatus =
  | "DRAFT"
  | "PENDING_SIGNATURES"
  | "ACTIVE"
  | "COMPLETED"
  | "DEFAULTED"
  | "CANCELLED";

export type PaymentFrequency =
  | "DAILY"
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "YEARLY";

export interface ContractStatusTransition {
  from: ContractStatus[];
  to: ContractStatus;
}

export const CONTRACT_STATUS_TRANSITIONS: ContractStatusTransition[] = [
  { from: ["DRAFT"], to: "PENDING_SIGNATURES" },
  { from: ["PENDING_SIGNATURES"], to: "ACTIVE" },
  { from: ["ACTIVE"], to: "COMPLETED" },
  { from: ["ACTIVE"], to: "DEFAULTED" },
  { from: ["DRAFT", "PENDING_SIGNATURES"], to: "CANCELLED" },
];
