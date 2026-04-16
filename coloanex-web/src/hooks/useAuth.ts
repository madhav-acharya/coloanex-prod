import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "@/store";
import {
  setAuth,
  setUser,
  setToken,
  setLoading,
  setError,
  clearError,
  logout as logoutAction,
} from "@/store/slices/authSlice";
import {
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetCurrentUserQuery,
} from "@/apis/authApi";
import { handleLogout } from "@/lib/logout";
import type { LoginRequest, AuthUser } from "@/types/auth";
import { getHomeRoute } from "@/lib/roleUtils";

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((state: RootState) => state.auth);

  const [loginMutation] = useLoginMutation();
  const [logoutMutation] = useLogoutMutation();
  const [refreshTokenMutation] = useRefreshTokenMutation();
  const { data: currentUser, refetch: refetchUser } = useGetCurrentUserQuery(
    undefined,
    {
      skip: !auth.isAuthenticated && !localStorage.getItem("token"),
    }
  );

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token && !auth.isAuthenticated) {
      dispatch(setAuth({ token }));
    }
  }, [dispatch, auth.isAuthenticated]);

  useEffect(() => {
    if (currentUser && auth.isAuthenticated) {
      dispatch(setUser(currentUser));
    }
  }, [currentUser, dispatch, auth.isAuthenticated]);

  // Login function
  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        dispatch(setLoading(true));
        dispatch(clearError());
        const response = await loginMutation(credentials).unwrap();
        localStorage.setItem("token", response.accessToken);
        localStorage.setItem("refreshToken", response.refreshToken);
        localStorage.setItem("sessionId", response.sessionId);
        dispatch(setAuth({ token: response.accessToken }));
        if (response.user) {
          dispatch(setUser(response.user));
          navigate(getHomeRoute(response.user));
        } else {
          navigate("/dashboard");
        }
        return response;
      } catch (error) {
        const errorMessage =
          error?.data?.message || "Login failed. Please try again.";
        dispatch(setError(errorMessage));
        throw error;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, loginMutation, navigate]
  );

  const logout = useCallback(async () => {
    await handleLogout(logoutMutation, dispatch, navigate);
  }, [dispatch, logoutMutation, navigate]);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    try {
      const storedRefreshToken = localStorage.getItem("refreshToken");
      if (!storedRefreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await refreshTokenMutation({
        refreshToken: storedRefreshToken,
      }).unwrap();

      localStorage.setItem("token", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);

      dispatch(setAuth({ token: response.accessToken }));

      await refetchUser();

      return response;
    } catch (error) {
      dispatch(logoutAction());
      navigate("/login");
      throw error;
    }
  }, [dispatch, refreshTokenMutation, navigate, refetchUser]);

  const updateUser = useCallback(
    (user: AuthUser) => {
      dispatch(setUser(user));
    },
    [dispatch]
  );

  // Update token
  const updateToken = useCallback(
    (token: string) => {
      dispatch(setToken({ token }));
    },
    [dispatch]
  );

  // Clear error
  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    ...auth,
    login,
    logout,
    refreshToken,
    updateUser,
    updateToken,
    clearError: clearAuthError,
  };
};
