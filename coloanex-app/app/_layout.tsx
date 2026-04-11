import "../shims";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { Provider } from "react-redux";
import { store } from "@/store";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppDispatch } from "@/store/hooks";
import { setAuth } from "@/store/slices/authSlice";
import { ToastProvider } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";

function AppContent() {
  const { isDark } = useTheme();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/signup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="kyc/index" />
        <Stack.Screen name="kyc/[id]" />
        <Stack.Screen name="kyc/kyc-verification" />
        <Stack.Screen name="lenders/lender-details" />
        <Stack.Screen name="loans/apply-loan" />
        <Stack.Screen name="loans/loan-details" />
        <Stack.Screen name="repayment/make-repayment" />
        <Stack.Screen name="pricing/index" />
        <Stack.Screen name="payment/success" />
        <Stack.Screen name="payment/failure" />
        <Stack.Screen name="profile/edit-profile" />
        <Stack.Screen name="profile/change-password" />
        <Stack.Screen name="profile/notifications" />
        <Stack.Screen name="profile/theme-settings" />
      </Stack>
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}

function AuthLoader({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const userJson = await AsyncStorage.getItem("user");
        if (token && userJson) {
          const user = JSON.parse(userJson);
          dispatch(setAuth({ token, user }));
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };

    loadAuth();
  }, [dispatch]);

  if (loading) {
    return null;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <ToastProvider>
        <AuthLoader>
          <AppContent />
        </AuthLoader>
      </ToastProvider>
    </Provider>
  );
}
