import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/components/ui";
import { spacing, typography, borderRadius } from "@/constants/theme";
import { formatCurrency } from "@/utils/currency";

export default function PaymentFailureScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { showToast } = useToast();
  const { amount, gateway } = useLocalSearchParams<{
    amount: string;
    gateway: string;
  }>();

  const parsedAmount = parseFloat(amount ?? "0");

  useEffect(() => {
    showToast("Payment was not completed. Please try again.", "error");
  }, [showToast]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View
          style={[styles.iconCircle, { backgroundColor: colors.errorLight }]}
        >
          <Ionicons name="close-circle" size={72} color={colors.error} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          Payment Failed
        </Text>

        {parsedAmount > 0 && (
          <Text style={[styles.amount, { color: colors.textSecondary }]}>
            {formatCurrency(parsedAmount)}
          </Text>
        )}

        {gateway && (
          <View
            style={[styles.gatewayBadge, { backgroundColor: colors.surface }]}
          >
            <Ionicons
              name="card-outline"
              size={15}
              color={colors.textSecondary}
            />
            <Text style={[styles.gatewayText, { color: colors.textSecondary }]}>
              via {gateway === "ESEWA" ? "eSewa" : "Khalti"}
            </Text>
          </View>
        )}

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Your payment could not be completed. No amount has been deducted.
          Please check your payment details and try again.
        </Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.error }]}
          activeOpacity={0.85}
          onPress={() => router.back()}
        >
          <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
          <Text style={[styles.primaryBtnText, { color: "#FFFFFF" }]}>
            Try Again
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.secondaryBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          activeOpacity={0.85}
          onPress={() => router.replace("/(tabs)/my-loans")}
        >
          <Ionicons
            name="document-text-outline"
            size={18}
            color={colors.text}
          />
          <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
            View My Loans
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl * 2,
      paddingBottom: spacing.xxl,
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
    },
    iconCircle: {
      width: 128,
      height: 128,
      borderRadius: 64,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.sm,
    },
    title: {
      ...typography.h1,
      fontWeight: "700",
      textAlign: "center",
    },
    amount: {
      fontSize: 28,
      fontWeight: "700",
      textAlign: "center",
    },
    gatewayBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
    },
    gatewayText: {
      ...typography.caption,
      fontWeight: "500",
    },
    description: {
      ...typography.body,
      textAlign: "center",
      marginTop: spacing.xs,
      lineHeight: 22,
      paddingHorizontal: spacing.sm,
    },
    buttons: {
      gap: spacing.sm,
    },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
    },
    primaryBtnText: {
      ...typography.body,
      fontWeight: "600",
    },
    secondaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
    },
    secondaryBtnText: {
      ...typography.body,
      fontWeight: "600",
    },
  });
