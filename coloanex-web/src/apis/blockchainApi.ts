import { baseApi } from "./baseApi";

export const blockchainApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBlockchainEnabled: builder.query<{ enabled: boolean }, void>({
      query: () => "/blockchain/enabled",
    }),
  }),
});

export const { useGetBlockchainEnabledQuery } = blockchainApi;
