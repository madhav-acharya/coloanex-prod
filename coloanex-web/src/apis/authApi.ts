import { baseApi } from "./baseApi";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  isActive: boolean;
  lastActiveAt?: string;
  roles: string[];
  permissions: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth"],
    }),

    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userData) => ({
        url: "/auth/signup",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["Auth"],
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["Auth"],
    }),

    refreshToken: builder.mutation<AuthResponse, { refreshToken: string }>({
      query: (body) => ({
        url: "/auth/refresh",
        method: "POST",
        body,
      }),
    }),

    getCurrentUser: builder.query<User, void>({
      query: () => "/auth/me",
      providesTags: ["Auth"],
    }),

    updateActivity: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/activity",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetCurrentUserQuery,
  useUpdateActivityMutation,
} = authApi;
