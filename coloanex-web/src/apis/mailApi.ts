import { baseApi } from "./baseApi";

export interface MailConnectionStatus {
  isConnected: boolean;
  email?: string;
}

export interface ConnectMailResponse {
  authUrl: string;
}

export interface DisconnectMailResponse {
  message: string;
  isConnected: boolean;
}

export const mailApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMailAuthUrl: builder.query<ConnectMailResponse, void>({
      query: () => "/mail/connect",
    }),

    disconnectMail: builder.mutation<DisconnectMailResponse, void>({
      query: () => ({
        url: "/mail/disconnect",
        method: "DELETE",
      }),
      invalidatesTags: ["MailStatus"],
    }),

    getMailStatus: builder.query<MailConnectionStatus, void>({
      query: () => "/mail/status",
      providesTags: ["MailStatus"],
    }),
  }),
});

export const {
  useGetMailAuthUrlQuery,
  useDisconnectMailMutation,
  useGetMailStatusQuery,
} = mailApi;
