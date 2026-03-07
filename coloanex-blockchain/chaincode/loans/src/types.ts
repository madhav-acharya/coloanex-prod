export interface LoanAsset {
  docType: "loan";
  id: string;
  borrowerId: string;
  tenantId: string;
  requestedAmount: string;
  approvedAmount: string | null;
  purpose: string;
  collateralDetails: Record<string, unknown>;
  requestedTermMonths: number;
  approvedTermMonths: number | null;
  status: LoanStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export type LoanStatus =
  | "DRAFT"
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "DISBURSED"
  | "CLOSED"
  | "DEFAULTED";

export interface LoanStatusTransition {
  from: LoanStatus[];
  to: LoanStatus;
}

export const LOAN_STATUS_TRANSITIONS: LoanStatusTransition[] = [
  { from: ["DRAFT"], to: "PENDING" },
  { from: ["PENDING"], to: "UNDER_REVIEW" },
  { from: ["UNDER_REVIEW"], to: "APPROVED" },
  { from: ["UNDER_REVIEW"], to: "REJECTED" },
  { from: ["APPROVED"], to: "DISBURSED" },
  { from: ["DISBURSED"], to: "CLOSED" },
  { from: ["DISBURSED"], to: "DEFAULTED" },
];
