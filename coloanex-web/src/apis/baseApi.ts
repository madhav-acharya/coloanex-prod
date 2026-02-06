import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/store";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState, endpoint }) => {
    const token =
      (getState() as RootState).auth.token || localStorage.getItem("token");
    const sessionId = localStorage.getItem("sessionId");

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (endpoint !== "uploadSingle" && endpoint !== "uploadMultiple") {
      headers.set("Content-Type", "application/json");
    }

    return headers;
  },
});

// Base query with re-authentication logic
const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshToken = localStorage.getItem("refreshToken");

    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: "/auth/refresh",
          method: "POST",
          body: { refreshToken },
        },
        api,
        extraOptions,
      );

      if (refreshResult.data) {
        const {
          accessToken,
          refreshToken: newRefreshToken,
          sessionId,
        } = refreshResult.data as any;
        localStorage.setItem("token", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);
        localStorage.setItem("sessionId", sessionId);

        api.dispatch({
          type: "auth/setToken",
          payload: { token: accessToken },
        });

        result = await baseQuery(args, api, extraOptions);
      } else {
        // Clear auth state
        api.dispatch({ type: "auth/logout" });

        // Prevent redirect loop
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    } else {
      api.dispatch({ type: "auth/logout" });
      api.dispatch({ type: "auth/logout" });

      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
  }

  return result;
};

// Create the base API
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Auth",
    "Roles",
    "Permissions",
    "Users",
    "Tenants",
    "KycDocuments",
    "Loans",
    "Borrowers",
    "Notifications",
    "Rules",
    "Contracts",
    "PaymentSchedules",
    "Transactions",
    "Wallets",
    "MailStatus",
  ],
  endpoints: () => ({}),
});
