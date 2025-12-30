import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { Card, LenderLogo, RatingStars, Button } from "@/components/ui";
import { colors, spacing, typography, borderRadius } from "@/constants/theme";
import { lendersApi, kycApi } from "@/api";
import type { Lender, Review } from "@/types";
import { formatCurrencyShort } from "@/utils/currency";

export default function LenderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [lender, setLender] = useState<Lender | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [kycStatus, setKycStatus] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadLender();
      loadReviews();
      checkKycStatus();
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

  const loadReviews = async () => {
    try {
      const data = await lendersApi.getReviews(id!);
      setReviews(data);
    } catch (error) {
      console.error("Failed to load reviews:", error);
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

  if (!lender) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.headerCard}>
          <View style={styles.lenderHeader}>
            <LenderLogo
              logo={lender.logo}
              name={lender.name}
              size={72}
              verified={lender.verified}
            />
          </View>
          <Text style={styles.lenderName}>{lender.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={20} color={colors.warning} />
            <Text style={styles.rating}>{(lender.rating || 0).toFixed(1)}</Text>
            <Text style={styles.reviewCount}>
              ({(lender.reviewCount || 0).toLocaleString()} reviews)
            </Text>
          </View>
          <Text style={styles.responseTag}>24h Average Response</Text>
        </Card>

        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{lender.interestRate || 0}%</Text>
              <Text style={styles.statLabel}>Interest Rate</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {formatCurrencyShort(lender.minAmount || 0)}-
                {formatCurrencyShort(lender.maxAmount || 0)}
              </Text>
              <Text style={styles.statLabel}>Loan Range</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{lender.successRate || 0}%</Text>
              <Text style={styles.statLabel}>Approval Rate</Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Loan Terms</Text>
          <View style={styles.termRow}>
            <Ionicons name="cash-outline" size={20} color={colors.primary} />
            <View style={styles.termInfo}>
              <Text style={styles.termValue}>
                {formatCurrencyShort(lender.minAmount || 0)}-
                {formatCurrencyShort(lender.maxAmount || 0)}
              </Text>
              <Text style={styles.termLabel}>Loan Amount</Text>
            </View>
          </View>
          <View style={styles.termRow}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <View style={styles.termInfo}>
              <Text style={styles.termValue}>
                {lender.loanTerms?.minTerm || 0}-
                {lender.loanTerms?.maxTerm || 0} months
              </Text>
              <Text style={styles.termLabel}>Repayment Period</Text>
            </View>
          </View>
          <View style={styles.termRow}>
            <Ionicons
              name="speedometer-outline"
              size={20}
              color={colors.primary}
            />
            <View style={styles.termInfo}>
              <Text style={styles.termValue}>
                {lender.loanTerms?.processingTime || "N/A"}
              </Text>
              <Text style={styles.termLabel}>Processing Time</Text>
            </View>
          </View>
          <View style={styles.termRow}>
            <Ionicons
              name={
                lender.loanTerms?.collateralRequired
                  ? "checkmark-circle"
                  : "close-circle"
              }
              size={20}
              color={
                lender.loanTerms?.collateralRequired
                  ? colors.error
                  : colors.primary
              }
            />
            <View style={styles.termInfo}>
              <Text style={styles.termValue}>
                {lender.loanTerms?.collateralRequired
                  ? "Required"
                  : "Not Required"}
              </Text>
              <Text style={styles.termLabel}>Collateral</Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Requirements</Text>
          {(lender.requirements || []).map((req, index) => (
            <View key={index} style={styles.requirementRow}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.requirementText}>{req}</Text>
            </View>
          ))}
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            {lender.about || "No description available."}
          </Text>
        </Card>

        <View style={styles.reviewsHeader}>
          <Text style={styles.reviewsTitle}>
            Customer Reviews ({reviews.length})
          </Text>
        </View>

        {reviews.slice(0, 3).map((review) => (
          <Card key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewAvatar}>
                {review.userAvatar ? (
                  <Image
                    source={{ uri: review.userAvatar }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Ionicons
                    name="person"
                    size={24}
                    color={colors.textSecondary}
                  />
                )}
              </View>
              <View style={styles.reviewInfo}>
                <Text style={styles.reviewerName}>{review.userName}</Text>
                <RatingStars rating={review.rating} size={14} />
              </View>
              <Text style={styles.reviewDate}>{review.date}</Text>
            </View>
            <Text style={styles.reviewComment}>{review.comment}</Text>
            <TouchableOpacity style={styles.helpfulButton}>
              <Ionicons
                name="thumbs-up-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.helpfulText}>Helpful ({review.helpful})</Text>
            </TouchableOpacity>
          </Card>
        ))}

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.contactButton}>
            <Ionicons name="call-outline" size={20} color={colors.primary} />
            <Text style={styles.contactButtonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactButton}>
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
            <Text style={styles.contactButtonText}>Email</Text>
          </TouchableOpacity>
        </View>

        {kycStatus === "VERIFIED" ? (
          <Button
            title="Apply for Loan"
            onPress={() =>
              router.push({ pathname: "/loan/apply", params: { lenderId: id } })
            }
            style={styles.applyButton}
          />
        ) : (
          <Button
            title={
              kycStatus === "PENDING"
                ? "KYC Verification Pending"
                : "Verify KYC to Apply"
            }
            onPress={() => {
              if (kycStatus === "PENDING") {
                Alert.alert(
                  "KYC Pending",
                  "Your KYC verification is currently being reviewed. You'll be notified once it's approved."
                );
              } else {
                router.push("/kyc");
              }
            }}
            style={styles.applyButton}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
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
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  contactButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginHorizontal: 4,
  },
  contactButtonText: {
    ...typography.bodySmall,
    fontWeight: "600",
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  applyButton: {
    marginBottom: spacing.lg,
  },
});
