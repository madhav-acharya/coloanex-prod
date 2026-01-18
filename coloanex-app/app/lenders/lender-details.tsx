import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { Card, Button, useToast } from "@/components/ui";
import { colors, spacing, typography, borderRadius } from "@/constants/theme";
import { lendersApi, kycApi, loansApi } from "@/api";
import type { Lender } from "@/types";

export default function LenderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  const [lender, setLender] = useState<Lender | null>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [hasExistingLoan, setHasExistingLoan] = useState(false);
  const [existingLoanId, setExistingLoanId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadLender();
      checkKycStatus();
      checkExistingLoan();
    }
  }, [id]);

  const loadLender = async () => {
    try {
      const data = await lendersApi.getById(id!);
      setLender(data);
    } catch (error) {
      console.error("Failed to load lender:", error);
    }
  };

  const checkKycStatus = async () => {
    try {
      const data = await kycApi.getStatus();
      setKycStatus(data.status);
    } catch (error) {
      setKycStatus(null);
    }
  };

  const checkExistingLoan = async () => {
    try {
      const data = await loansApi.checkExisting(id!);
      setHasExistingLoan(data.hasLoan);
      setExistingLoanId(data.loanId || null);
    } catch (error) {
      setHasExistingLoan(false);
    }
  };

  if (!lender) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lender Details</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.headerCard}>
          <View style={styles.lenderIcon}>
            <Ionicons name="business" size={48} color={colors.primary} />
          </View>
          <Text style={styles.lenderName}>{lender.name}</Text>
          <View
            style={[
              styles.statusBadge,
              lender.isActive && styles.statusBadgeActive,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                lender.isActive && styles.statusTextActive,
              ]}
            >
              {lender.isActive ? "Active" : "Inactive"}
            </Text>
          </View>
        </Card>

        {(lender.contactEmail || lender.contactPhone || lender.address) && (
          <Card>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            {lender.contactEmail && (
              <View style={styles.contactRow}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.primary}
                />
                <View style={styles.contactInfoDetail}>
                  <Text style={styles.contactLabel}>Email</Text>
                  <Text style={styles.contactValue}>{lender.contactEmail}</Text>
                </View>
              </View>
            )}
            {lender.contactPhone && (
              <View style={styles.contactRow}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={colors.primary}
                />
                <View style={styles.contactInfoDetail}>
                  <Text style={styles.contactLabel}>Phone</Text>
                  <Text style={styles.contactValue}>{lender.contactPhone}</Text>
                </View>
              </View>
            )}
            {lender.address && (
              <View style={styles.contactRow}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={colors.primary}
                />
                <View style={styles.contactInfoDetail}>
                  <Text style={styles.contactLabel}>Address</Text>
                  <Text style={styles.contactValue}>{lender.address}</Text>
                </View>
              </View>
            )}
          </Card>
        )}

        <Button
          title={hasExistingLoan ? "View Loan Application" : "Apply for Loan"}
          onPress={() => {
            if (hasExistingLoan && existingLoanId) {
              router.push(`/loans/loan-details?id=${existingLoanId}`);
            } else if (kycStatus === "VERIFIED") {
              router.push({
                pathname: "/loans/apply-loan",
                params: { lenderId: id },
              });
            } else if (kycStatus === "PENDING") {
              showToast(
                "Your KYC verification is currently being reviewed. You'll be notified once it's approved.",
                "info",
              );
            } else {
              router.push(`/kyc/kyc-verification?tenantId=${lender.id}`);
            }
          }}
          disabled={!hasExistingLoan && kycStatus !== "VERIFIED"}
          style={styles.applyButton}
        />
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
    padding: spacing.lg,
    backgroundColor: colors.surface,
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  headerCard: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  lenderHeader: {
    marginBottom: spacing.md,
  },
  lenderName: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  rating: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
    marginLeft: 4,
  },
  reviewCount: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  responseTag: {
    ...typography.bodySmall,
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statsCard: {
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  termRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  termInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  termValue: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
  },
  termLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  requirementText: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.md,
    flex: 1,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  contactInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  contactLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  contactValue: {
    ...typography.body,
    fontWeight: "500",
    color: colors.text,
  },
  aboutText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  reviewsHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  reviewsTitle: {
    ...typography.h3,
    color: colors.text,
  },
  reviewCard: {
    marginBottom: spacing.md,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: borderRadius.full,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewerName: {
    ...typography.bodySmall,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  reviewDate: {
    ...typography.caption,
    color: colors.textLight,
  },
  reviewComment: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  helpfulButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  helpfulText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  applyButton: {
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
});
