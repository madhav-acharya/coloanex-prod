export interface PaymentGatewayLinks {
  esewa?: string;
  fonepay?: string;
  khalti?: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  paymentGatewayLinks?: PaymentGatewayLinks;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
}
