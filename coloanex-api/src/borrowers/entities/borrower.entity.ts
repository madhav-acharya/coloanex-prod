export enum KycStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export class Borrower {
  id: string;
  tenantId: string;
  userId: string;
  kycStatus: KycStatus;
  rewardScore?: number;
  kycLastCheckedAt?: Date;
  kycDocumentId?: string;
  createdAt: Date;
  updatedAt: Date;
}
