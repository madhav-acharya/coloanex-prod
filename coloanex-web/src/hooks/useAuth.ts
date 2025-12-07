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
  type LoginRequest,
  type User,
} from "@/apis/authApi";

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((state: RootState) => state.auth);

  const [loginMutation] = useLoginMutation();
  const [logoutMutation] = useLogoutMutation();
  const [refreshTokenMutation] = useRefreshTokenMutation();

  // Load auth from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        dispatch(setAuth({ user, token }));
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        localStorage.clear();
      }
    }
  }, [dispatch]);

  // Sync auth to localStorage
  useEffect(() => {
    if (auth.isAuthenticated && auth.token && auth.user) {
      localStorage.setItem("token", auth.token);
      localStorage.setItem("user", JSON.stringify(auth.user));
    } else if (!auth.isAuthenticated) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("sessionId");
      localStorage.removeItem("user");
    }
  }, [auth.isAuthenticated, auth.token, auth.user]);

  // Login function
  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        dispatch(setLoading(true));
        dispatch(clearError());

        const response = await loginMutation(credentials).unwrap();

        // Store tokens
        localStorage.setItem("token", response.accessToken);
        localStorage.setItem("refreshToken", response.refreshToken);
        localStorage.setItem("sessionId", response.sessionId);

        // Update state
        dispatch(
          setAuth({
            user: response.user,
            token: response.accessToken,
          })
        );

        navigate("/dashboard");
        return response;
      } catch (error: any) {
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

  // Logout function
  const logout = useCallback(async () => {
    try {
      await logoutMutation().unwrap();
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      dispatch(logoutAction());
      navigate("/login");
    }
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

      dispatch(
        setAuth({
          user: response.user,
          token: response.accessToken,
        })
      );

      return response;
    } catch (error) {
      dispatch(logoutAction());
      navigate("/login");
      throw error;
    }
  }, [dispatch, refreshTokenMutation, navigate]);

  // Update user
  const updateUser = useCallback(
    (user: User) => {
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
