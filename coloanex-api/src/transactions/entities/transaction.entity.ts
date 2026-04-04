export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
  DISBURSEMENT = 'DISBURSEMENT',
  INSTALLMENT_PAYMENT = 'INSTALLMENT_PAYMENT',
  PENALTY_PAYMENT = 'PENALTY_PAYMENT',
  FEE = 'FEE',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentGateway {
  ESEWA = 'ESEWA',
  FONEPAY = 'FONEPAY',
  KHALTI = 'KHALTI',
  WALLET = 'WALLET',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export interface PaymentDetails {
  gateway: PaymentGateway;
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
  walletId: string;
  contractId?: string;
  paymentScheduleId?: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  gatewayDetails?: GatewayDetails;
  description?: string;
  createdAt: Date;
  completedAt?: Date;
  contract?: {
    id: string;
    contractNumber: string;
  };
  wallet?: {
    id: string;
    userId: string;
  };
}
