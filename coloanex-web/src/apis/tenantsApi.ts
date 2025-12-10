import { baseApi } from "./baseApi";
import type {
  Tenant,
  TenantsQueryParams,
  TenantsResponse,
  CreateTenantDto,
  UpdateTenantDto,
} from "@/types/tenant";

export type {
  Tenant,
  TenantsQueryParams,
  TenantsResponse,
  CreateTenantDto,
  UpdateTenantDto,
};

export const tenantsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTenants: builder.query<TenantsResponse, TenantsQueryParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.search) queryParams.append("search", params.search);
        if (params.sortBy) queryParams.append("sortBy", params.sortBy);
        if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);
        if (params.isActive) queryParams.append("isActive", params.isActive);
        if (params.isBanned) queryParams.append("isBanned", params.isBanned);

        return `/tenants?${queryParams.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "Tenants" as const,
                id,
              })),
              { type: "Tenants", id: "LIST" },
            ]
          : [{ type: "Tenants", id: "LIST" }],
    }),

    getTenant: builder.query<Tenant, string>({
      query: (id) => `/tenants/${id}`,
      providesTags: (result, error, id) => [{ type: "Tenants", id }],
    }),

    createTenant: builder.mutation<Tenant, CreateTenantDto>({
      query: (body) => ({
        url: "/tenants",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Tenants", id: "LIST" }],
    }),

    updateTenant: builder.mutation<
      Tenant,
      { id: string; data: UpdateTenantDto }
    >({
      query: ({ id, data }) => ({
        url: `/tenants/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Tenants", id },
        { type: "Tenants", id: "LIST" },
      ],
    }),

    deleteTenant: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/tenants/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Tenants", id: "LIST" }],
    }),
  }),
});

export const {
  useGetTenantsQuery,
  useGetTenantQuery,
  useCreateTenantMutation,
  useUpdateTenantMutation,
  useDeleteTenantMutation,
} = tenantsApi;
