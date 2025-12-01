export interface PermissionsQueryInterface {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  name?: string;
  isSystem?: boolean;
  tenantId?: string;
  startDate?: string;
  endDate?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  updatedAtFrom?: string;
  updatedAtTo?: string;
  roleId?: string;
  userId?: string;
}
