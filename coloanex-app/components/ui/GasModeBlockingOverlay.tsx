import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/slices/authSlice";
import { walletsApi } from "@/api";

export type GasPaymentMode = "USER_WALLET" | "PLATFORM_WALLET";

interface GasModeBlockingOverlayProps {
  gasPaymentMode?: GasPaymentMode | string | null;
  onSwitch?: () => void | Promise<void>;
}

export function GasModeBlockingOverlay({
  gasPaymentMode: gasPaymentModeProp,
  onSwitch,
}: GasModeBlockingOverlayProps) {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [switching, setSwitching] = useState(false);

  const gasPaymentMode = gasPaymentModeProp ?? user?.gasPaymentMode;

  if (gasPaymentMode !== "USER_WALLET") return null;

  const handleSwitch = async () => {
    if (switching) return;
    setSwitching(true);
    try {
      if (onSwitch) {
        await onSwitch();
      } else {
        const result = await walletsApi.updateGasMode(
          "PLATFORM_WALLET",
          "APP",
        );
        if (user) {
          dispatch(
            setUser({
              ...user,
              gasPaymentMode: result.gasPaymentMode,
            }),
          );
        }
      }
    } finally {
      setSwitching(false);
    }
  };

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View
          style={[styles.iconContainer, { backgroundColor: colors.warning + "15" }]}
        >
          <Ionicons name="wallet-outline" size={40} color={colors.warning} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          Platform Mode Required
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Wallet mode is not supported in the app. Please switch to Platform Mode
          (subscription mode) to continue.
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleSwitch}
          disabled={switching}
        >
          {switching ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Switch to Platform Mode</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={switching}
        >
          <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    zIndex: 1001,
  },
  card: {
    width: "100%",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 22,
  },
  button: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
