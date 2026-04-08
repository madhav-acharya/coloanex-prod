import { baseApi } from "./baseApi";
import { Borrower, BorrowersResponse } from "@/types/borrower";

export const borrowersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBorrowers: builder.query<
      BorrowersResponse,
      { limit?: number; page?: number } | void
    >({
      query: (params = {}) => ({
        url: "/borrowers",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "Borrowers" as const,
                id,
              })),
              { type: "Borrowers", id: "LIST" },
            ]
          : [{ type: "Borrowers", id: "LIST" }],
    }),
    getBorrowersByTenant: builder.query<Borrower[], string>({
      query: (tenantId) => ({
        url: `/borrowers/by-tenant/${tenantId}`,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Borrowers" as const, id })),
              { type: "Borrowers", id: "LIST" },
            ]
          : [{ type: "Borrowers", id: "LIST" }],
    }),
  }),
});

export const { useGetBorrowersQuery, useGetBorrowersByTenantQuery } = borrowersApi;
