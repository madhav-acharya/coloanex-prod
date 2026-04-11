import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { ReactNode } from "react";
import { useTheme } from "@/hooks/useTheme";

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: "default" | "elevated" | "outlined";
}

export default function Card({
  children,
  style,
  variant = "default",
}: CardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: 20,
          padding: 20,
        },
        variant === "default" && styles.default,
        variant === "elevated" && styles.elevated,
        variant === "outlined" && {
          borderWidth: 1,
          borderColor: colors.border,
          ...styles.outlined,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  default: {
    elevation: 4,
  },
  elevated: {
    elevation: 8,
  },
  outlined: {
    elevation: 2,
  },
});
