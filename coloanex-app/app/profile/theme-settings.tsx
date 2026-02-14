import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, AppHeader } from "@/components/ui";
import { spacing, typography, borderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

export default function ThemeSettingsScreen() {
  const { mode, setTheme, colors, isDark } = useTheme();
  const styles = createStyles(colors);

  const themeOptions = [
    {
      value: "light",
      label: "Light",
      icon: "sunny-outline",
      description: "Always use light theme",
    },
    {
      value: "dark",
      label: "Dark",
      icon: "moon-outline",
      description: "Always use dark theme",
    },
    {
      value: "system",
      label: "System",
      icon: "phone-portrait-outline",
      description: "Follow system settings",
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.surface }]}
    >
      <AppHeader title="Theme Settings" />

      <View style={styles.content}>
        <Card style={[styles.card, { backgroundColor: colors.card }]}>
          {themeOptions.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                { borderBottomColor: colors.border },
                index === themeOptions.length - 1 && styles.lastOption,
              ]}
              onPress={() => setTheme(option.value as any)}
            >
              <View style={styles.optionLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, { color: colors.text }]}>
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {option.description}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.radioButton,
                  { borderColor: colors.border },
                  mode === option.value && [
                    styles.radioButtonActive,
                    {
                      borderColor: colors.primary,
                      backgroundColor: colors.primary,
                    },
                  ],
                ]}
              >
                {mode === option.value && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        <View style={[styles.previewCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.previewTitle, { color: colors.text }]}>
            Preview
          </Text>
          <Text style={[styles.previewText, { color: colors.textSecondary }]}>
            Current theme: {isDark ? "Dark" : "Light"}
          </Text>
          <View style={styles.previewColors}>
            <View
              style={[styles.colorBox, { backgroundColor: colors.primary }]}
            />
            <View
              style={[
                styles.colorBox,
                { backgroundColor: colors.background },
                { borderWidth: 1, borderColor: colors.border },
              ]}
            />
            <View
              style={[
                styles.colorBox,
                { backgroundColor: colors.card },
                { borderWidth: 1, borderColor: colors.border },
              ]}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
    },
    card: {
      padding: 0,
      overflow: "hidden",
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: spacing.lg,
      borderBottomWidth: 1,
    },
    lastOption: {
      borderBottomWidth: 0,
    },
    optionLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.md,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.md,
    },
    optionText: {
      flex: 1,
    },
    optionLabel: {
      ...typography.body,
      fontWeight: "600",
      marginBottom: 4,
    },
    optionDescription: {
      ...typography.bodySmall,
    },
    radioButton: {
      width: 24,
      height: 24,
      borderRadius: borderRadius.full,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    radioButtonActive: {
      borderWidth: 2,
    },
    previewCard: {
      marginTop: spacing.xl,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
    },
    previewTitle: {
      ...typography.h3,
      fontWeight: "700",
      marginBottom: spacing.sm,
    },
    previewText: {
      ...typography.body,
      marginBottom: spacing.lg,
    },
    previewColors: {
      flexDirection: "row",
      gap: spacing.md,
    },
    colorBox: {
      width: 60,
      height: 60,
      borderRadius: borderRadius.md,
    },
  });
