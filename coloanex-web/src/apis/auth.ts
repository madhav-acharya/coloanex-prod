import { apiClient } from "./client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
    isActive: boolean;
    lastActiveAt?: string;
    roles: string[];
    permissions: string[];
  };
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

export const authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post("/auth/login", credentials);
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<LoginResponse> => {
    const response = await apiClient.post("/auth/register", userData);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },

  refreshToken: async (): Promise<{ access_token: string }> => {
    const response = await apiClient.post("/auth/refresh");
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get("/auth/profile");
    return response.data;
  },

  markUserOnline: async (id: string): Promise<void> => {
    await apiClient.post(`/${id}/users/mark-online`);
  },

  markUserOffline: async (id: string): Promise<void> => {
    await apiClient.post(`/${id}/users/mark-offline`);
  },

  updateActivity: async (): Promise<void> => {
    await apiClient.post("/users/activity");
  },
};
