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

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        {icon && (
          <Ionicons
            name={icon as any}
            size={20}
            color="#9CA3AF"
            style={styles.icon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            error && styles.inputError,
            icon && styles.inputWithIcon,
            isPassword && styles.inputWithPassword,
            style,
          ]}
          placeholderTextColor="#9CA3AF"
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
              color="#9CA3AF"
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
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
    color: "#1F2937",
    marginBottom: 10,
  },
  inputContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputWithIcon: {
    paddingLeft: 44,
  },
  inputWithPassword: {
    paddingRight: 44,
  },
  inputError: {
    borderColor: "#EF4444",
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
    color: "#EF4444",
    marginTop: 4,
  },
});
