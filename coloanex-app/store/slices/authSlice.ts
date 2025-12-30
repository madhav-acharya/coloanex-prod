import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthUser } from '@/types';

interface AuthState {
  user?: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
    },
    setToken: (state, action: PayloadAction<{ token: string }>) => {
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    setAuth: (state, action: PayloadAction<{ token: string; user?: AuthUser }>) => {
      state.token = action.payload.token;
      state.user = action.payload.user || null;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const { clearError, setUser, setToken, setAuth, setLoading, setError, logout } = authSlice.actions;
export default authSlice.reducer;
