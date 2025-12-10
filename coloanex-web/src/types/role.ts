import type { Permission } from "./permission";

export interface Role {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  permissions?: Permission[];
}

export interface RolesResponse {
  data: Role[];
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
  limit: number;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export interface RolesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  name?: string;
  dateFrom?: string;
  dateTo?: string;
}
