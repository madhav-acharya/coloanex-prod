export interface TenantsQueryInterface {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: string;
  isBanned?: string;
}
