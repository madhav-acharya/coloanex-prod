import { KycStatus } from '../entities/kyc.entity';

export interface KycQueryInterface {
  page?: number;
  limit?: number;
  search?: string;
  status?: KycStatus;
  tenantId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
