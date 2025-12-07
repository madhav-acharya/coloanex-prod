import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/store";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    // Get token from Redux state or localStorage
    const token =
      (getState() as RootState).auth.token || localStorage.getItem("token");
    const sessionId = localStorage.getItem("sessionId");

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
      console.log(
        `[RTK Query] Request with token: ${token.substring(0, 30)}...`
      );
      console.log(`[RTK Query] SessionId: ${sessionId}`);
    } else {
      console.warn("[RTK Query] No token available");
    }

    headers.set("Content-Type", "application/json");
    return headers;
  },
});

// Base query with re-authentication logic
const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    console.error("[RTK Query] 401 Unauthorized:", result.error);

    // Attempt to refresh token
    const refreshToken = localStorage.getItem("refreshToken");

    if (refreshToken) {
      console.log("[RTK Query] Attempting token refresh...");
      const refreshResult = await baseQuery(
        {
          url: "/auth/refresh",
          method: "POST",
          body: { refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        // Store the new tokens
        const {
          accessToken,
          refreshToken: newRefreshToken,
          sessionId,
        } = refreshResult.data as any;
        localStorage.setItem("token", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);
        localStorage.setItem("sessionId", sessionId);

        // Update Redux state
        api.dispatch({
          type: "auth/setToken",
          payload: { token: accessToken },
        });

        console.log("[RTK Query] Token refreshed successfully");

        // Retry the original request
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Refresh failed - logout user
        console.error("[RTK Query] Token refresh failed");

        // Clear auth state
        api.dispatch({ type: "auth/logout" });

        // Prevent redirect loop
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    } else {
      // No refresh token - logout user
      console.error("[RTK Query] No refresh token available");

      // Clear auth state
      api.dispatch({ type: "auth/logout" });

      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
  } else if (result.error && result.error.status === 403) {
    console.error("[RTK Query] 403 Forbidden:", result.error);
  }

  return result;
};

// Create the base API
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Auth", "Roles", "Permissions", "Users"],
  endpoints: () => ({}),
});
