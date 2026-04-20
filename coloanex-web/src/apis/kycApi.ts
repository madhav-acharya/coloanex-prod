import { baseApi } from "./baseApi";
import type {
  Kyc,
  KycDocumentsQuery,
  CreateKycDto,
  UpdateKycDto,
  VerifyKycDto,
  KycsResponse,
} from "@/types/kyc";

export const kycApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getKycs: builder.query<KycsResponse, KycDocumentsQuery | void>({
      query: (params = {}) => ({
        url: "/kyc",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "KycDocuments" as const,
                id,
              })),
              { type: "KycDocuments", id: "LIST" },
            ]
          : [{ type: "KycDocuments", id: "LIST" }],
    }),

    getKyc: builder.query<Kyc, string>({
      query: (id) => `/kyc/${id}`,
      providesTags: (result, error, id) => [{ type: "KycDocuments", id }],
    }),

    getKycStatus: builder.query<
      { status: string | null; hasKyc: boolean; kycId?: string },
      { tenantId?: string } | void
    >({
      query: (params = {}) => ({
        url: "/kyc/status",
        params,
      }),
      providesTags: [{ type: "KycDocuments", id: "LIST" }],
    }),

    createKyc: builder.mutation<Kyc, CreateKycDto>({
      query: (data) => ({
        url: "/kyc",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "KycDocuments", id: "LIST" }],
    }),

    updateKyc: builder.mutation<Kyc, { id: string; data: UpdateKycDto }>({
      query: ({ id, data }) => ({
        url: `/kyc/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "KycDocuments", id },
        { type: "KycDocuments", id: "LIST" },
      ],
    }),

    deleteKyc: builder.mutation<void, string>({
      query: (id) => ({
        url: `/kyc/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "KycDocuments", id },
        { type: "KycDocuments", id: "LIST" },
      ],
    }),

    verifyKyc: builder.mutation<Kyc, { id: string; data: VerifyKycDto }>({
      query: ({ id, data }) => ({
        url: `/kyc/${id}/verify`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "KycDocuments", id },
        { type: "KycDocuments", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetKycsQuery,
  useGetKycQuery,
  useGetKycStatusQuery,
  useCreateKycMutation,
  useUpdateKycMutation,
  useDeleteKycMutation,
  useVerifyKycMutation,
} = kycApi;
