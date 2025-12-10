export interface Permission {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PermissionsResponse {
  data: Permission[];
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
  limit: number;
}

export interface CreatePermissionDto {
  name: string;
  description?: string;
}

export interface UpdatePermissionDto {
  name?: string;
  description?: string;
}
