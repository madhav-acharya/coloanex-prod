export interface Tenant {
  id: string;
  name: string;
  isActive: boolean;
  isBanned: boolean;
  contactEmail: string;
  contactPhone: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  ownerUserId: string;
  ownerUser?: {
    id: string;
    fullName: string;
    email?: string;
  };
  _count?: {
    users: number;
    borrowers: number;
  };
}

export interface TenantsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  isActive?: string;
  isBanned?: string;
  sort?: string;
  order?: string;
}

export interface TenantsResponse {
  data: Tenant[];
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
  limit: number;
}

export interface CreateTenantDto {
  name: string;
  isActive?: boolean;
  isBanned?: boolean;
  contactEmail: string;
  contactPhone: string;
  address?: string;
  ownerUserId: string;
}

export interface UpdateTenantDto {
  name?: string;
  isActive?: boolean;
  isBanned?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  ownerUserId?: string;
}
