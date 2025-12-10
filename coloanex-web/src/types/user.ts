export interface User {
  id: string;
  email?: string;
  fullName: string;
  phone?: string;
  isActive: boolean;
  lastActiveAt?: string;
  createdAt: string;
  updatedAt: string;
  roles?: Array<{
    id: string;
    name: string;
  }>;
  permissions?: Array<{
    id: string;
    name: string;
  }>;
}

export interface UsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  roleId?: string;
  sort?: string;
  order?: string;
}

export interface UsersResponse {
  data: User[];
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
  limit: number;
}

export interface CreateUserDto {
  fullName: string;
  email?: string;
  phone?: string;
  password: string;
  roleIds?: string[];
  permissionIds?: string[];
  isActive?: boolean;
}

export interface UpdateUserDto {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  roleIds?: string[];
  permissionIds?: string[];
  isActive?: boolean;
  isBanned?: boolean;
}
