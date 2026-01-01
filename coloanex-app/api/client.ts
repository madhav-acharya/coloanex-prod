import axios, { AxiosError, AxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const {
            accessToken,
            refreshToken: newRefreshToken,
            sessionId,
          } = response.data;

          await AsyncStorage.setItem("token", accessToken);
          await AsyncStorage.setItem("refreshToken", newRefreshToken);
          await AsyncStorage.setItem("sessionId", sessionId);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear auth and redirect to login
        await AsyncStorage.multiRemove([
          "token",
          "refreshToken",
          "sessionId",
          "user",
        ]);
        router.replace("/auth/login");
        return Promise.reject(refreshError);
      }

      // No refresh token - clear auth and redirect to login
      await AsyncStorage.multiRemove([
        "token",
        "refreshToken",
        "sessionId",
        "user",
      ]);
      router.replace("/auth/login");
    }

    return Promise.reject(error);
  }
);

export default apiClient;
