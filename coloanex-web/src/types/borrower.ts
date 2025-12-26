export interface Borrower {
  id: string;
  tenantId: string;
  userId: string;
  kycStatus: string;
  rewardScore?: number;
  kycLastCheckedAt?: string;
  kycDocumentId?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
}

export interface BorrowersResponse {
  data: Borrower[];
  total: number;
  page: number;
  limit: number;
}
