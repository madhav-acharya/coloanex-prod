import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { ReactNode } from "react";

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
  return <View style={[styles.card, styles[variant], style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
  },
  default: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  elevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  outlined: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
});
