import { baseApi } from "./baseApi";
import type {
  Loan,
  LoanQuery,
  CreateLoanDto,
  UpdateLoanDto,
  ReviewLoanDto,
  LoansResponse,
} from "@/types/loan";

export const loansApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLoans: builder.query<LoansResponse, LoanQuery | void>({
      query: (params = {}) => ({
        url: "/loans",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "Loans" as const,
                id,
              })),
              { type: "Loans", id: "LIST" },
            ]
          : [{ type: "Loans", id: "LIST" }],
    }),

    getLoan: builder.query<Loan, string>({
      query: (id) => `/loans/${id}`,
      providesTags: (result, error, id) => [{ type: "Loans", id }],
    }),

    createLoan: builder.mutation<Loan, CreateLoanDto>({
      query: (data) => ({
        url: "/loans",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Loans", id: "LIST" }],
    }),

    updateLoan: builder.mutation<Loan, { id: string; data: UpdateLoanDto }>({
      query: ({ id, data }) => ({
        url: `/loans/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Loans", id },
        { type: "Loans", id: "LIST" },
      ],
    }),

    deleteLoan: builder.mutation<void, string>({
      query: (id) => ({
        url: `/loans/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Loans", id },
        { type: "Loans", id: "LIST" },
      ],
    }),

    reviewLoan: builder.mutation<Loan, { id: string; data: ReviewLoanDto }>({
      query: ({ id, data }) => ({
        url: `/loans/${id}/review`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Loans", id },
        { type: "Loans", id: "LIST" },
        { type: "Contracts", id: "LIST" },
      ],
    }),


  }),
});

export const {
  useGetLoansQuery,
  useGetLoanQuery,
  useCreateLoanMutation,
  useUpdateLoanMutation,
  useDeleteLoanMutation,
  useReviewLoanMutation,
} = loansApi;
