import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export const configApi = createApi({
  reducerPath: "configApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/blockchain`,
  }),
  endpoints: (builder) => ({
    getBlockchainEnabled: builder.query<{ enabled: boolean }, void>({
      query: () => "enabled",
    }),
  }),
});

export const { useGetBlockchainEnabledQuery } = configApi;
