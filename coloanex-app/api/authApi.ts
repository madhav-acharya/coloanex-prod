import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LoginRequest, SignupRequest, AuthResponse, AuthUser } from '@/types';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login/app', credentials);
    await AsyncStorage.setItem('token', data.accessToken);
    await AsyncStorage.setItem('refreshToken', data.refreshToken);
    await AsyncStorage.setItem('sessionId', data.sessionId);
    if (data.user) {
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  signup: async (userData: SignupRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/signup/app', userData);
    await AsyncStorage.setItem('token', data.accessToken);
    await AsyncStorage.setItem('refreshToken', data.refreshToken);
    await AsyncStorage.setItem('sessionId', data.sessionId);
    if (data.user) {
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      await AsyncStorage.multiRemove(['token', 'refreshToken', 'sessionId', 'user']);
    }
  },

  getCurrentUser: async (): Promise<AuthUser | null> => {
    const userJson = await AsyncStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
    return data;
  },
};
