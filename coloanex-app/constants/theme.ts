import { Platform } from "react-native";

export const Colors = {
  light: {
    primary: "#16A34A",
    primaryDark: "#15803D",
    primaryLight: "#DCFCE7",
    secondary: "#6366F1",
    background: "#FFFFFF",
    surface: "#F3F4F6",
    card: "#FFFFFF",
    text: "#111827",
    textSecondary: "#6B7280",
    textLight: "#9CA3AF",
    border: "#E5E7EB",
    error: "#DC2626",
    errorLight: "#FEF2F2",
    success: "#16A34A",
    warning: "#F59E0B",
    icon: "#111827",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: "#16A34A",
  },
  dark: {
    primary: "#22C55E",
    primaryDark: "#16A34A",
    primaryLight: "#14532D",
    secondary: "#818CF8",
    background: "#111827",
    surface: "#1F2937",
    card: "#1F2937",
    text: "#F9FAFB",
    textSecondary: "#D1D5DB",
    textLight: "#9CA3AF",
    border: "#374151",
    error: "#EF4444",
    errorLight: "#7F1D1D",
    success: "#22C55E",
    warning: "#FBBF24",
    icon: "#F9FAFB",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: "#22C55E",
  },
  // Backward compatibility - default to light theme
  primary: "#16A34A",
  primaryDark: "#15803D",
  primaryLight: "#DCFCE7",
  secondary: "#6366F1",
  background: "#FFFFFF",
  surface: "#F3F4F6",
  card: "#FFFFFF",
  text: "#111827",
  textSecondary: "#6B7280",
  textLight: "#9CA3AF",
  border: "#E5E7EB",
  error: "#DC2626",
  errorLight: "#FEF2F2",
  success: "#16A34A",
  warning: "#F59E0B",
};

export const colors = Colors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: "700" as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 16,
  },
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
