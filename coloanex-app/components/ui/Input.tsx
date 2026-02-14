import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  icon?: string;
  isPassword?: boolean;
}

export default function Input({
  label,
  error,
  containerStyle,
  style,
  icon,
  isPassword,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { colors } = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
      <View style={styles.inputContainer}>
        {icon && (
          <Ionicons
            name={icon as any}
            size={20}
            color={colors.textLight}
            style={styles.icon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: error ? colors.error : colors.border,
              color: colors.text,
            },
            icon && styles.inputWithIcon,
            isPassword && styles.inputWithPassword,
            style,
          ]}
          placeholderTextColor={colors.textLight}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color={colors.textLight}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },
  inputContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    elevation: 2,
  },
  inputWithIcon: {
    paddingLeft: 44,
  },
  inputWithPassword: {
    paddingRight: 44,
  },
  icon: {
    position: "absolute",
    left: 12,
    zIndex: 1,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    padding: 4,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
});
