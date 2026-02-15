import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { spacing, typography } from "@/constants/theme";

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  showThemeToggle?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
}

export default function AppHeader({
  title,
  showBack = true,
  showThemeToggle = true,
  onBackPress,
  rightComponent,
}: AppHeaderProps) {
  const { colors, mode, setTheme, isDark } = useTheme();
  const styles = createStyles(colors);

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)/home");
      }
    }
  };

  const handleThemeToggle = () => {
    const nextTheme = isDark ? "light" : "dark";
    setTheme(nextTheme);
  };

  const getThemeIcon = () => {
    if (mode === "system") {
      return "phone-portrait-outline";
    }
    return isDark ? "moon" : "sunny";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          {showBack && (
            <TouchableOpacity
              onPress={handleBackPress}
              style={styles.iconButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          {title && <Text style={styles.title}>{title}</Text>}
        </View>

        <View style={styles.rightSection}>
          {rightComponent}
          {showThemeToggle && (
            <TouchableOpacity
              onPress={handleThemeToggle}
              style={styles.iconButton}
            >
              <Ionicons name={getThemeIcon()} size={24} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      backgroundColor: colors.card,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    leftSection: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    rightSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    iconButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 20,
    },
    title: {
      ...typography.h3,
      color: colors.text,
      fontWeight: "700",
      marginLeft: spacing.sm,
    },
  });
