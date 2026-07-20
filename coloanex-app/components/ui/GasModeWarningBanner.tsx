import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/slices/authSlice";
import { walletsApi } from "@/api";
import { spacing, borderRadius } from "@/constants/theme";

export type GasPaymentMode = "USER_WALLET" | "PLATFORM_WALLET";

interface GasModeWarningBannerProps {
  gasPaymentMode?: GasPaymentMode | string | null;
  onSwitch?: () => void | Promise<void>;
}

export function GasModeWarningBanner({
  gasPaymentMode: gasPaymentModeProp,
  onSwitch,
}: GasModeWarningBannerProps) {
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
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.warningLight,
          borderColor: colors.warning,
        },
      ]}
    >
      <View style={styles.row}>
        <View
          style={[styles.iconWrap, { backgroundColor: colors.warning + "25" }]}
        >
          <Ionicons name="warning" size={20} color={colors.warning} />
        </View>
        <Text style={[styles.message, { color: colors.text }]}>
          Wallet mode is not supported in the app. Please switch to Platform
          Mode (subscription mode) to continue.
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleSwitch}
        disabled={switching}
        activeOpacity={0.85}
      >
        {switching ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Switch to Platform Mode</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  button: {
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
