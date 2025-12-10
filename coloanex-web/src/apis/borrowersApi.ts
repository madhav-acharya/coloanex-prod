import { baseApi } from "./baseApi";

export interface Borrower {
  id: string;
  tenantId: string;
  userId: string;
  kycStatus: string;
  rewardScore?: number;
  kycLastCheckedAt?: string;
  kycDocumentId?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
}

interface BorrowersResponse {
  data: Borrower[];
  total: number;
  page: number;
  limit: number;
}

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
  }),
});

export const { useGetBorrowersQuery } = borrowersApi;
