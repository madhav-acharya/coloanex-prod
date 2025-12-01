export interface QueryInterface {
  page?: number;
  limit?: number;
  sort?: string;
  order?: string;
  search?: string;
  userId?: string;
  tenantId?: string;
  startDate?: string;
  endDate?: string;
}
