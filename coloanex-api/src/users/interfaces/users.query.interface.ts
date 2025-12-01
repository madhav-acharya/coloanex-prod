export interface UsersQueryInterface {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  tenantId?: string;
  isActive?: boolean;
  isBanned?: boolean;
  isEmailVerified?: boolean;
  startDate?: string;
  endDate?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  updatedAtFrom?: string;
  updatedAtTo?: string;
  lastActiveAtFrom?: string;
  lastActiveAtTo?: string;
  roleId?: string;
  permissionId?: string;
}
