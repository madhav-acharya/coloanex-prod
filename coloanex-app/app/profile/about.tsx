import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Card } from "@/components/ui";
import { colors, spacing, typography, borderRadius } from "@/constants/theme";
import { APP_NAME, APP_VERSION } from "@/constants/app";

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.logoCard}>
          <View style={styles.logoContainer}>
            <Ionicons name="cash" size={64} color={colors.primary} />
          </View>
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.version}>Version {APP_VERSION}</Text>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>About Us</Text>
          <Text style={styles.infoText}>
            {APP_NAME} is a peer-to-peer lending platform that connects
            borrowers with lenders, making loans more accessible and affordable.
            Our mission is to provide fair and transparent lending services to
            everyone.
          </Text>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featureItem}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.success}
            />
            <Text style={styles.featureText}>Easy KYC verification</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.success}
            />
            <Text style={styles.featureText}>Competitive interest rates</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.success}
            />
            <Text style={styles.featureText}>Flexible repayment options</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.success}
            />
            <Text style={styles.featureText}>Secure transactions</Text>
          </View>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.contactText}>Email: info@coloanex.com</Text>
          <Text style={styles.contactText}>Phone: +977 1234567890</Text>
          <Text style={styles.contactText}>Address: Kathmandu, Nepal</Text>
        </Card>

        <Text style={styles.copyright}>
          © 2026 {APP_NAME}. All rights reserved.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  logoCard: {
    padding: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  appName: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  version: {
    ...typography.body,
    color: colors.textSecondary,
  },
  infoCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  infoText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  featureText: {
    ...typography.body,
    marginLeft: spacing.sm,
  },
  contactText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  copyright: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
    marginVertical: spacing.xl,
  },
});
