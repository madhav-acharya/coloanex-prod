import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "text";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        styles[`${size}Button`],
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#FFFFFF" : "#10B981"}
        />
      ) : (
        <Text
          style={[
            styles.text,
            styles[`${variant}Text`],
            styles[`${size}Text`],
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primary: {
    backgroundColor: "#16A34A",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#16A34A",
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    backgroundColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },
  smallButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  mediumButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  largeButton: {
    paddingVertical: 18,
    paddingHorizontal: 36,
  },
  disabled: {
    opacity: 0.5,
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  outlineText: {
    color: "#10B981",
    fontSize: 16,
    fontWeight: "600",
  },
  textText: {
    color: "#10B981",
    fontSize: 16,
    fontWeight: "500",
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
});
