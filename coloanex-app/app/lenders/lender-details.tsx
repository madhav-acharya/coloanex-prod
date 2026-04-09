import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { useToast, AppHeader, CurrencyIcon } from "@/components/ui";
import { spacing, borderRadius } from "@/constants/theme";
import { lendersApi, kycApi, loansApi, rulesApi } from "@/api";
import type { Lender } from "@/types";
import type { Rule } from "@/api/rulesApi";
import { KycStatus } from "@/types";
import { useTheme } from "@/hooks/useTheme";

export default function LenderDetailsScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
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
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      Promise.all([
        loadLender(),
        checkKycStatus(),
        checkExistingLoan(),
        loadRules(),
      ]).finally(() => setLoading(false));
    }
  }, [id]);

  const loadLender = async () => {
    const data = await lendersApi.getById(id!);
    setLender(data);
  };

  const loadRules = async () => {
    try {
      const data = await rulesApi.getByTenant(id!);
      setRules(data.filter((r) => r.isActive && r.isPubliclyVisible));
    } catch {}
  };

  const checkKycStatus = async () => {
    try {
      const data = await kycApi.getStatus(id);
      setKycStatus(data.status as KycStatus);
      setKycId(data.kycId || null);
    } catch {
      setKycStatus(null);
    }
  };

  const checkExistingLoan = async () => {
    try {
      const data = await loansApi.checkExisting(id!);
      setHasExistingLoan(data.hasLoan);
      setExistingLoanId(data.loanId || null);
      setExistingLoanStatus(data.status || null);
    } catch {
      setHasExistingLoan(false);
    }
  };

  const getActionConfig = () => {
    if (hasExistingLoan) {
      const isPending = ["DRAFT", "SUBMITTED", "UNDER_REVIEW"].includes(
        existingLoanStatus ?? "",
      );
      return {
        label: isPending ? "View Loan Request" : "View Loan Details",
        icon: "document-text-outline" as const,
        isPrimary: !isPending,
        notice: isPending ? "Your application is under review" : null,
      };
    }
    switch (kycStatus) {
      case KycStatus.VERIFIED:
        return {
          label: "Apply for Loan",
          icon: "add-circle-outline" as const,
          isPrimary: true,
          notice: null,
        };
      case KycStatus.PENDING:
        return {
          label: "View KYC Request",
          icon: "time-outline" as const,
          isPrimary: false,
          notice: "KYC verification is pending review",
        };
      case KycStatus.REJECTED:
        return {
          label: "Resubmit KYC",
          icon: "refresh-outline" as const,
          isPrimary: false,
          notice: "KYC rejected. Resubmit with correct information",
        };
      default:
        return {
          label: "Verify KYC to Apply",
          icon: "shield-checkmark-outline" as const,
          isPrimary: true,
          notice: "Complete KYC verification first",
        };
    }
  };

  const handleAction = () => {
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
          router.push(`/kyc/${kycId}` as any);
        } else {
          router.push("/kyc" as any);
        }
        break;
      case KycStatus.REJECTED:
        router.push(`/kyc/kyc-verification?tenantId=${lender?.id}` as any);
        break;
      default:
        router.push(`/kyc/kyc-verification?tenantId=${lender?.id}` as any);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppHeader title="Lender Details" showThemeToggle={false} />
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!lender) return null;

  const action = getActionConfig();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Lender Details" showThemeToggle={false} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.heroCard, { backgroundColor: colors.card }]}>
          <View
            style={[
              styles.heroAvatar,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            {lender.logo ? (
              <Image
                source={{ uri: lender.logo }}
                style={styles.heroAvatarImg}
              />
            ) : (
              <Text
                style={[styles.heroAvatarInitial, { color: colors.primary }]}
              >
                {lender.name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>

          <Text style={[styles.heroName, { color: colors.text }]}>
            {lender.name}
          </Text>

          <View
            style={[
              styles.heroBadge,
              { backgroundColor: lender.isActive ? "#D1FAE5" : colors.surface },
            ]}
          >
            <View
              style={[
                styles.heroBadgeDot,
                {
                  backgroundColor: lender.isActive
                    ? "#16A34A"
                    : colors.textLight,
                },
              ]}
            />
            <Text
              style={[
                styles.heroBadgeText,
                { color: lender.isActive ? "#16A34A" : colors.textSecondary },
              ]}
            >
              {lender.isActive
                ? "Active & Accepting Applications"
                : "Currently Inactive"}
            </Text>
          </View>
        </View>

        {(lender.contactEmail || lender.contactPhone || lender.address) && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Contact Information
            </Text>
            {lender.contactEmail && (
              <TouchableOpacity
                style={[
                  styles.contactRow,
                  { borderBottomColor: colors.border },
                ]}
                onPress={() => Linking.openURL(`mailto:${lender.contactEmail}`)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.contactIconWrap,
                    { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.contactInfo}>
                  <Text
                    style={[
                      styles.contactLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Email
                  </Text>
                  <Text style={[styles.contactValue, { color: colors.text }]}>
                    {lender.contactEmail}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textLight}
                />
              </TouchableOpacity>
            )}
            {lender.contactPhone && (
              <TouchableOpacity
                style={[
                  styles.contactRow,
                  { borderBottomColor: colors.border },
                ]}
                onPress={() => Linking.openURL(`tel:${lender.contactPhone}`)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.contactIconWrap,
                    { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Ionicons
                    name="call-outline"
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.contactInfo}>
                  <Text
                    style={[
                      styles.contactLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Phone
                  </Text>
                  <Text style={[styles.contactValue, { color: colors.text }]}>
                    {lender.contactPhone}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textLight}
                />
              </TouchableOpacity>
            )}
            {lender.address && (
              <View style={[styles.contactRow, { borderBottomWidth: 0 }]}>
                <View
                  style={[
                    styles.contactIconWrap,
                    { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.contactInfo}>
                  <Text
                    style={[
                      styles.contactLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Address
                  </Text>
                  <Text style={[styles.contactValue, { color: colors.text }]}>
                    {lender.address}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {action.notice && (
          <View
            style={[
              styles.noticeCard,
              {
                backgroundColor: colors.primaryLight,
                borderColor: colors.primary + "30",
              },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={[styles.noticeText, { color: colors.primary }]}>
              {action.notice}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.actionBtn,
            {
              backgroundColor: action.isPrimary ? colors.primary : colors.card,
              borderColor: action.isPrimary ? colors.primary : colors.border,
            },
          ]}
          activeOpacity={0.85}
          onPress={handleAction}
        >
          <Ionicons
            name={action.icon}
            size={20}
            color={action.isPrimary ? colors.buttonText : colors.primary}
          />
          <Text
            style={[
              styles.actionBtnText,
              { color: action.isPrimary ? colors.buttonText : colors.primary },
            ]}
          >
            {action.label}
          </Text>
        </TouchableOpacity>

        {rules.length > 0 && (
          <>
            <Text style={[styles.rulesHeading, { color: colors.text }]}>
              Loan Products
            </Text>
            {rules.map((rule) => (
              <View
                key={rule.id}
                style={[styles.ruleCard, { backgroundColor: colors.card }]}
              >
                <View style={styles.ruleCardTop}>
                  <View style={styles.ruleCardMeta}>
                    <View
                      style={[
                        styles.ruleTypePill,
                        { backgroundColor: colors.primaryLight },
                      ]}
                    >
                      <Text
                        style={[
                          styles.ruleTypePillText,
                          { color: colors.primary },
                        ]}
                      >
                        {rule.ruleType.replace(/_/g, " ")}
                      </Text>
                    </View>
                    <Text style={[styles.ruleName, { color: colors.text }]}>
                      {rule.name}
                    </Text>
                    {rule.description ? (
                      <Text
                        style={[
                          styles.ruleDesc,
                          { color: colors.textSecondary },
                        ]}
                        numberOfLines={2}
                      >
                        {rule.description}
                      </Text>
                    ) : null}
                    {rule.evmAddress ? (
                      <View style={styles.evmRow}>
                        <Ionicons
                          name="link-outline"
                          size={12}
                          color={colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.evmText,
                            { color: colors.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          EVM: {rule.evmAddress}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View
                    style={[
                      styles.ruleInterestBadge,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.ruleInterestValue,
                        { color: colors.buttonText },
                      ]}
                    >
                      {rule.interestRate}%
                    </Text>
                    <Text
                      style={[
                        styles.ruleInterestLabel,
                        { color: colors.buttonText + "CC" },
                      ]}
                    >
                      p.a.
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.ruleDivider,
                    { backgroundColor: colors.border },
                  ]}
                />

                <View style={styles.ruleStatsRow}>
                  <View style={styles.ruleStat}>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <CurrencyIcon size={16} color={colors.text} />
                      <Text
                        style={[
                          styles.ruleStatVal,
                          { color: colors.text, marginLeft: 4 },
                        ]}
                      >
                        {(rule.loanLimits.minAmount / 1000).toFixed(0)}K –{" "}
                        {(rule.loanLimits.maxAmount / 1000).toFixed(0)}K
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.ruleStatLbl,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Loan Range
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.ruleStatSep,
                      { backgroundColor: colors.border },
                    ]}
                  />
                  <View style={styles.ruleStat}>
                    <Text style={[styles.ruleStatVal, { color: colors.text }]}>
                      {rule.loanLimits.minTermMonths}–
                      {rule.loanLimits.maxTermMonths} mo
                    </Text>
                    <Text
                      style={[
                        styles.ruleStatLbl,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Term
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.ruleStatSep,
                      { backgroundColor: colors.border },
                    ]}
                  />
                  <View style={styles.ruleStat}>
                    <Text style={[styles.ruleStatVal, { color: colors.text }]}>
                      {rule.penaltyConfig.gracePeriodDays}d
                    </Text>
                    <Text
                      style={[
                        styles.ruleStatLbl,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Grace Period
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.ruleTagsRow,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {rule.paymentConfig.allowedFrequencies.map((f) => (
                    <View
                      key={f}
                      style={[
                        styles.ruleTag,
                        { backgroundColor: colors.primaryLight },
                      ]}
                    >
                      <Text
                        style={[styles.ruleTagText, { color: colors.primary }]}
                      >
                        {f.charAt(0) + f.slice(1).toLowerCase()}
                      </Text>
                    </View>
                  ))}
                  {rule.paymentConfig.allowEarlyPayment && (
                    <View
                      style={[styles.ruleTag, { backgroundColor: "#D1FAE5" }]}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={11}
                        color="#16A34A"
                      />
                      <Text style={[styles.ruleTagText, { color: "#16A34A" }]}>
                        Early Payment
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    container: { flex: 1 },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
    },
    backBtn: { padding: 6, borderRadius: borderRadius.sm },
    topBarTitle: { fontSize: 17, fontWeight: "700" },
    scrollContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
    heroCard: {
      borderRadius: borderRadius.xl,
      padding: spacing.xl,
      alignItems: "center",
      marginBottom: spacing.md,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    heroAvatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      marginBottom: spacing.md,
    },
    heroAvatarImg: { width: "100%", height: "100%" },
    heroAvatarInitial: { fontSize: 36, fontWeight: "900" },
    heroName: {
      fontSize: 22,
      fontWeight: "800",
      textAlign: "center",
      marginBottom: spacing.sm,
    },
    heroBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
    },
    heroBadgeDot: { width: 7, height: 7, borderRadius: 4 },
    heroBadgeText: { fontSize: 12, fontWeight: "600" },
    section: {
      borderRadius: borderRadius.lg,
      marginBottom: spacing.md,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    contactRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
      borderBottomWidth: 1,
    },
    contactIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    contactInfo: { flex: 1 },
    contactLabel: { fontSize: 11, fontWeight: "500", marginBottom: 2 },
    contactValue: { fontSize: 14, fontWeight: "600" },
    noticeCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderWidth: 1,
      marginBottom: spacing.sm,
    },
    noticeText: { flex: 1, fontSize: 13, fontWeight: "500", lineHeight: 18 },
    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingVertical: 16,
      borderRadius: borderRadius.lg,
      borderWidth: 1.5,
      marginBottom: spacing.lg,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    actionBtnText: { fontSize: 16, fontWeight: "700" },
    rulesHeading: {
      fontSize: 17,
      fontWeight: "700",
      marginBottom: spacing.sm,
    },
    ruleCard: {
      borderRadius: borderRadius.lg,
      marginBottom: spacing.sm,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    ruleCardTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      padding: spacing.md,
      gap: spacing.sm,
    },
    ruleCardMeta: { flex: 1 },
    ruleTypePill: {
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginBottom: 6,
    },
    ruleTypePillText: {
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    ruleName: { fontSize: 15, fontWeight: "700", marginBottom: 3 },
    ruleDesc: { fontSize: 12, fontWeight: "400", lineHeight: 17 },
    evmRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 4,
    },
    evmText: { fontSize: 11, fontWeight: "500", flex: 1 },
    ruleInterestBadge: {
      borderRadius: borderRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 8,
      alignItems: "center",
      minWidth: 60,
    },
    ruleInterestValue: { fontSize: 18, fontWeight: "900" },
    ruleInterestLabel: { fontSize: 10, fontWeight: "600" },
    ruleDivider: { height: 1 },
    ruleStatsRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.sm,
    },
    ruleStat: { flex: 1, alignItems: "center" },
    ruleStatVal: { fontSize: 13, fontWeight: "700", textAlign: "center" },
    ruleStatLbl: {
      fontSize: 10,
      fontWeight: "500",
      textAlign: "center",
      marginTop: 2,
    },
    ruleStatSep: { width: 1, height: 28 },
    ruleTagsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      padding: spacing.sm,
      borderTopWidth: 1,
    },
    ruleTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
    },
    ruleTagText: { fontSize: 11, fontWeight: "600" },
  });
