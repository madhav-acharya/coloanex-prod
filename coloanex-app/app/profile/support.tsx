import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, AppHeader } from "@/components/ui";
import { spacing, typography, borderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

export default function SupportScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const supportOptions = [
    {
      icon: "mail-outline",
      title: "Email Support",
      subtitle: "support@coloanex.com",
      action: () => Linking.openURL("mailto:support@coloanex.com"),
    },
    {
      icon: "call-outline",
      title: "Phone Support",
      subtitle: "+977 1234567890",
      action: () => Linking.openURL("tel:+9771234567890"),
    },
    {
      icon: "chatbubble-outline",
      title: "Live Chat",
      subtitle: "Chat with our support team",
      action: () => {},
    },
    {
      icon: "document-text-outline",
      title: "FAQs",
      subtitle: "Find answers to common questions",
      action: () => {},
    },
  ];

  return (
    <View style={styles.container}>
      <AppHeader title="Help & Support" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>How can we help you?</Text>
          <Text style={styles.infoText}>
            Our support team is available 24/7 to assist you with any questions
            or concerns.
          </Text>
        </Card>

        {supportOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            onPress={option.action}
            style={styles.optionCard}
          >
            <View style={styles.optionIcon}>
              <Ionicons
                name={option.icon as any}
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    content: {
      flex: 1,
      padding: spacing.md,
    },
    infoCard: {
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    infoTitle: {
      ...typography.h3,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    infoText: {
      ...typography.body,
      color: colors.textSecondary,
    },
    optionCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.sm,
    },
    optionIcon: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.md,
    },
    optionContent: {
      flex: 1,
    },
    optionTitle: {
      ...typography.body,
      color: colors.text,
      fontWeight: "600",
      marginBottom: spacing.xs / 2,
    },
    optionSubtitle: {
      ...typography.body,
      color: colors.textSecondary,
    },
  });
