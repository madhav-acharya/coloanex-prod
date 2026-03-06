export enum InstallmentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
}

export interface PaymentSchedule {
  id: string;
  contractId: string;
  installmentNumber: number;
  dueDate: Date;
  dueAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: InstallmentStatus;
  paidAt?: Date;
  paymentTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
  contract?: {
    id: string;
    contractNumber: string;
    borrowerId: string;
    tenantId: string;
  };
}
