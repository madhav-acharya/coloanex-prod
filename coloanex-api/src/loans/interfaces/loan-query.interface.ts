import { LoanStatus } from '../entities/loan.entity';

export interface LoanQueryInterface {
  page?: number;
  limit?: number;
  search?: string;
  status?: LoanStatus;
  tenantId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
