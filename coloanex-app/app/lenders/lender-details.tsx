import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { Card, Button, useToast } from "@/components/ui";
import { colors, spacing, typography, borderRadius } from "@/constants/theme";
import { lendersApi, kycApi, loansApi } from "@/api";
import type { Lender } from "@/types";
import { KycStatus } from "@/types";

export default function LenderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  const [lender, setLender] = useState<Lender | null>(null);
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [hasExistingLoan, setHasExistingLoan] = useState(false);
  const [existingLoanId, setExistingLoanId] = useState<string | null>(null);
  const [existingLoanStatus, setExistingLoanStatus] = useState<string | null>(
    null,
  );
  const [kycId, setKycId] = useState<string | null>(null);

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
      const data = await kycApi.getStatus(id);
      console.log("KYC Status Response:", data);
      setKycStatus(data.status as KycStatus);
      setKycId(data.kycId || null);
    } catch (error) {
      console.error("KYC Status Error:", error);
      setKycStatus(null);
      setKycId(null);
    }
  };

  const checkExistingLoan = async () => {
    try {
      const data = await loansApi.checkExisting(id!);
      setHasExistingLoan(data.hasLoan);
      setExistingLoanId(data.loanId || null);
      setExistingLoanStatus(data.status || null);
    } catch (error) {
      setHasExistingLoan(false);
      setExistingLoanId(null);
      setExistingLoanStatus(null);
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
            {lender.logo ? (
              <Image
                source={{ uri: lender.logo }}
                style={styles.lenderLogoImage}
              />
            ) : (
              <Ionicons name="business" size={48} color="#fff" />
            )}
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

        {renderActionButton()}
      </ScrollView>
    </View>
  );

  function getButtonConfig() {
    if (hasExistingLoan) {
      const isLoanPending =
        existingLoanStatus === "DRAFT" ||
        existingLoanStatus === "SUBMITTED" ||
        existingLoanStatus === "UNDER_REVIEW";
      if (isLoanPending) {
        return {
          title: "View Loan Request",
          disabled: false,
          variant: "outline" as const,
          message: "Your loan application is pending review",
        };
      }
      return {
        title: "View Loan Details",
        disabled: false,
        variant: "primary" as const,
        message: null,
      };
    }

    switch (kycStatus) {
      case KycStatus.VERIFIED:
        return {
          title: "Apply for Loan",
          disabled: false,
          variant: "primary" as const,
          message: null,
        };
      case KycStatus.PENDING:
        return {
          title: "View KYC Request",
          disabled: false,
          variant: "outline" as const,
          message: "Your KYC verification is pending review",
        };
      case KycStatus.REJECTED:
        return {
          title: "Resubmit KYC",
          disabled: false,
          variant: "outline" as const,
          message:
            "Your KYC was rejected. Please resubmit with correct information",
        };
      default:
        return {
          title: "Verify KYC",
          disabled: false,
          variant: "primary" as const,
          message: null,
        };
    }
  }

  function handleButtonPress() {
    if (hasExistingLoan && existingLoanId) {
      router.push(`/loans/loan-details?id=${existingLoanId}` as any);
      return;
    }

    switch (kycStatus) {
      case KycStatus.VERIFIED:
        router.push({
          pathname: "/loans/apply-loan" as any,
          params: { lenderId: id },
        });
        break;
      case KycStatus.PENDING:
        if (kycId) {
          router.push(`/kyc/kyc-details?id=${kycId}` as any);
        } else {
          showToast(
            "Your KYC verification is currently being reviewed",
            "info",
          );
        }
        break;
      case KycStatus.REJECTED:
        router.push(`/kyc/kyc-verification?tenantId=${lender?.id}` as any);
        break;
      default:
        router.push(`/kyc/kyc-verification?tenantId=${lender?.id}` as any);
        break;
    }
  }

  function renderActionButton() {
    const buttonConfig = getButtonConfig();

    return (
      <View>
        {buttonConfig.message && (
          <View style={styles.messageCard}>
            <View style={styles.messageContainer}>
              <Ionicons
                name="information-circle"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.messageText}>{buttonConfig.message}</Text>
            </View>
          </View>
        )}
        <Button
          title={buttonConfig.title}
          onPress={handleButtonPress}
          disabled={buttonConfig.disabled}
          variant={buttonConfig.variant}
          style={styles.applyButton}
        />
      </View>
    );
  }
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
  lenderIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  lenderLogoImage: {
    width: "100%",
    height: "100%",
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  statusBadgeActive: {
    backgroundColor: colors.primaryLight,
  },
  statusText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  statusTextActive: {
    color: colors.primary,
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
  contactInfoDetail: {
    marginLeft: spacing.md,
    flex: 1,
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
  },
  messageCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: colors.primary,
    lineHeight: 20,
    marginLeft: spacing.sm,
  },
});
