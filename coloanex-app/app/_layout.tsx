import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { Provider } from "react-redux";
import { store } from "@/store";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppDispatch } from "@/store/hooks";
import { setAuth } from "@/store/slices/authSlice";

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
      } catch (error) {
        console.error("Failed to load auth:", error);
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
      <AuthLoader>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="tabs" />
          <Stack.Screen name="kyc" />
          <Stack.Screen name="lender/[id]" />
          <Stack.Screen name="loan/apply" />
          <Stack.Screen name="loan/[id]" />
          <Stack.Screen name="repayment/[id]" />
          <Stack.Screen name="profile/edit-profile" />
          <Stack.Screen name="profile/change-password" />
          <Stack.Screen name="profile/notifications" />
        </Stack>
        <StatusBar style="auto" />
      </AuthLoader>
    </Provider>
  );
}
