import { baseApi } from "./baseApi";

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

export const permissionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPermissions: builder.query<
      PermissionsResponse,
      PermissionsQueryParams | void
    >({
      query: (params = {}) => ({
        url: "/permissions",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "Permissions" as const,
                id,
              })),
              { type: "Permissions", id: "LIST" },
            ]
          : [{ type: "Permissions", id: "LIST" }],
    }),

    getPermission: builder.query<Permission, string>({
      query: (id) => `/permissions/${id}`,
      providesTags: (result, error, id) => [{ type: "Permissions", id }],
    }),

    createPermission: builder.mutation<Permission, CreatePermissionDto>({
      query: (data) => ({
        url: "/permissions",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Permissions", id: "LIST" }],
    }),

    updatePermission: builder.mutation<
      Permission,
      { id: string; data: UpdatePermissionDto }
    >({
      query: ({ id, data }) => ({
        url: `/permissions/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Permissions", id },
        { type: "Permissions", id: "LIST" },
      ],
    }),

    deletePermission: builder.mutation<void, string>({
      query: (id) => ({
        url: `/permissions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Permissions", id },
        { type: "Permissions", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetPermissionsQuery,
  useGetPermissionQuery,
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
  useDeletePermissionMutation,
} = permissionsApi;
