export type PlatformType = 'WEB' | 'APP';
export type GasPaymentMode = 'USER_WALLET' | 'PLATFORM_WALLET' | 'AUTO';

export interface OrchestrationInput {
  userId: string;
  tenantId?: string;
  transactionType: string;
  platform: PlatformType;
  userRoles?: string[];
  preferredWalletId?: string;
  requestedGasPaymentMode?: GasPaymentMode;
}

export interface OrchestrationDecision {
  eligible: boolean;
  denialReason?: string;
  scope: 'USER' | 'TENANT' | 'NONE';
  plan: string;
  gasPaymentMode: Exclude<GasPaymentMode, 'AUTO'>;
  gasPayer: 'USER' | 'PLATFORM';
  walletId?: string;
  walletProvider?: 'METAMASK' | 'EXPO_SECURE' | 'ESEWA' | 'KHALTI';
  subscriptionId?: string;
  featureFlags: Record<string, unknown>;
  evaluationData?: Record<string, unknown>;
}
