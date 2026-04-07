import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { spacing, typography, borderRadius } from "@/constants/theme";
import { loansApi } from "@/api";
import type { Loan } from "@/types";
import { LoanStatus } from "@/types/loan";
import { formatCurrency } from "@/utils/currency";
import { CurrencyIcon } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";

type StatusConfig = {
  label: string;
  bgColor: string;
  textColor: string;
  icon: keyof typeof Ionicons.glyphMap;
};

function getStatusConfig(
  status: string,
  colors: Record<string, string>,
): StatusConfig {
  switch (status) {
    case LoanStatus.DRAFT:
      return {
        label: "Draft",
        bgColor: colors.surface,
        textColor: colors.textSecondary,
        icon: "document-outline",
      };
    case LoanStatus.SUBMITTED:
      return {
        label: "Submitted",
        bgColor: colors.secondaryLight,
        textColor: colors.secondary,
        icon: "paper-plane-outline",
      };
    case LoanStatus.UNDER_REVIEW:
      return {
        label: "Under Review",
        bgColor: colors.warningLight,
        textColor: colors.warning,
        icon: "time-outline",
      };
    case LoanStatus.APPROVED:
      return {
        label: "Approved",
        bgColor: colors.successLight,
        textColor: colors.success,
        icon: "checkmark-circle-outline",
      };
    case LoanStatus.REJECTED:
      return {
        label: "Rejected",
        bgColor: colors.errorLight,
        textColor: colors.error,
        icon: "close-circle-outline",
      };
    case LoanStatus.CONTRACT_GENERATED:
      return {
        label: "Contract Ready",
        bgColor: colors.secondaryLight,
        textColor: colors.secondary,
        icon: "document-text-outline",
      };
    case LoanStatus.CONTRACT_SIGNED:
      return {
        label: "Contract Signed",
        bgColor: colors.primaryLight,
        textColor: colors.primary,
        icon: "shield-checkmark-outline",
      };
    case LoanStatus.LOAN_PROVIDED:
      return {
        label: "Loan Provided",
        bgColor: colors.primaryLight,
        textColor: colors.primary,
        icon: "trending-up-outline",
      };
    case LoanStatus.PARTIALLY_PAID:
      return {
        label: "Partially Paid",
        bgColor: colors.warningLight,
        textColor: colors.warning,
        icon: "time-outline",
      };
    case LoanStatus.PAID:
      return {
        label: "Paid",
        bgColor: colors.successLight,
        textColor: colors.success,
        icon: "checkmark-circle-outline",
      };
    default:
      return {
        label: status,
        bgColor: colors.surface,
        textColor: colors.textSecondary,
        icon: "ellipse-outline",
      };
  }
}

function StatusBadge({
  status,
  colors,
  blockchainTxHash,
  styles,
}: {
  status: string;
  colors: Record<string, string>;
  blockchainTxHash?: string;
  styles: any;
}) {
  const config = getStatusConfig(status, colors);
  return (
    <View style={styles.badgeContainer}>
      <View
        style={[statusBadgeStyles.badge, { backgroundColor: config.bgColor }]}
      >
        <Ionicons name={config.icon} size={12} color={config.textColor} />
        <Text style={[statusBadgeStyles.label, { color: config.textColor }]}>
          {config.label}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          statusBadgeStyles.blockchainBadge,
          {
            backgroundColor: blockchainTxHash ? "#10B981" : "#64748B",
            opacity: 0.9,
          },
        ]}
        onPress={() => {
          const { showBlockchainInfo } = require("@/utils/blockchain");
          showBlockchainInfo(blockchainTxHash);
        }}
      >
        <Ionicons
          name={blockchainTxHash ? "link" : "link-outline"}
          size={10}
          color="white"
        />
        <Text style={statusBadgeStyles.blockchainText}>
          {blockchainTxHash ? "On-Chain" : "Off-Chain"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const statusBadgeStyles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  blockchainBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
    marginTop: 2,
  },
  blockchainText: {
    fontSize: 9,
    fontWeight: "500",
    color: "white",
  },
});

export default function MyLoansScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const formatCurrencyWithIcon = (
    value: number | null | undefined,
    isPositive: boolean = true,
  ) => {
    const safeValue = value ?? 0;
    const color = isPositive ? "#16A34A" : "#DC2626";
    // Format number without currency symbol
    const formattedValue = safeValue.toLocaleString("en-NP");
    return (
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <CurrencyIcon size={16} color={color} />
        <Text style={[styles.currencyText, { color, marginLeft: 4 }]}>
          {formattedValue}
        </Text>
      </View>
    );
  };

  const loadLoans = useCallback(async () => {
    try {
      const data = await loansApi.getMyLoans();
      setLoans(data);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLoans();
  };

  const activeCount = loans.filter(
    (l) =>
      l.status === LoanStatus.LOAN_PROVIDED ||
      l.status === LoanStatus.PARTIALLY_PAID,
  ).length;
  const pendingCount = loans.filter((l) =>
    (
      [
        LoanStatus.SUBMITTED,
        LoanStatus.UNDER_REVIEW,
        LoanStatus.APPROVED,
        LoanStatus.CONTRACT_GENERATED,
        LoanStatus.CONTRACT_SIGNED,
      ] as string[]
    ).includes(l.status),
  ).length;
  const totalAmount = loans.reduce(
    (sum, l) => sum + Number(l.approvedAmount ?? l.requestedAmount ?? 0),
    0,
  );

  const renderLoanCard = ({ item: loan }: { item: Loan }) => {
    const amount = loan.approvedAmount ?? loan.requestedAmount;
    const lenderName = loan.borrower?.tenant?.name ?? "Unknown Lender";
    const isActive =
      loan.status === LoanStatus.LOAN_PROVIDED ||
      loan.status === LoanStatus.PARTIALLY_PAID;

    return (
      <TouchableOpacity
        style={styles.cardWrapper}
        activeOpacity={0.7}
        onPress={() =>
          router.push({
            pathname: "/loans/loan-details",
            params: { id: loan.id },
          })
        }
      >
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <View style={styles.lenderInfo}>
              <View
                style={[
                  styles.lenderAvatar,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Text style={[styles.lenderInitial, { color: colors.primary }]}>
                  {lenderName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.lenderText}>
                <Text
                  style={[styles.lenderName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {lenderName}
                </Text>
                <Text
                  style={[styles.purpose, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {loan.purpose}
                </Text>
              </View>
            </View>
            <StatusBadge
              status={loan.status}
              colors={colors}
              blockchainTxHash={loan.blockchain_tx_hash}
              styles={styles}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.cardBody}>
            <View style={styles.amountBlock}>
              <Text
                style={[styles.amountLabel, { color: colors.textSecondary }]}
              >
                {loan.approvedAmount ? "Approved Amount" : "Requested Amount"}
              </Text>
              <View style={{ alignItems: "flex-start" }}>
                {formatCurrencyWithIcon(amount, true)}
              </View>
            </View>
            <View style={styles.termBlock}>
              <Text style={[styles.termLabel, { color: colors.textSecondary }]}>
                Term
              </Text>
              <Text style={[styles.termValue, { color: colors.text }]}>
                {(loan as any).approvedTermMonths ?? loan.requestedTermMonths}{" "}
                mo
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.dateRow}>
              <Ionicons
                name="calendar-outline"
                size={13}
                color={colors.textLight}
              />
              <Text style={[styles.dateText, { color: colors.textLight }]}>
                {new Date(loan.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.textLight}
            />
          </View>

          {loan.rejectionReason && (
            <View
              style={[
                styles.rejectionBanner,
                { backgroundColor: colors.errorLight },
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={14}
                color={colors.error}
              />
              <Text
                style={[styles.rejectionText, { color: colors.error }]}
                numberOfLines={2}
              >
                {loan.rejectionReason}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>My Loans</Text>
        <TouchableOpacity
          style={[styles.applyBtn, { backgroundColor: colors.primaryLight }]}
          activeOpacity={0.8}
          onPress={() => router.push("/(tabs)/browse-lenders")}
        >
          <Ionicons name="add" size={18} color={colors.primary} />
          <Text style={[styles.applyBtnText, { color: colors.primary }]}>
            Apply
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : loans.length === 0 ? (
        <View style={styles.emptyState}>
          <View
            style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}
          >
            <Ionicons name="wallet-outline" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Loans Yet
          </Text>
          <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
            Browse lenders and apply for your first loan
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(tabs)/browse-lenders")}
          >
            <Text
              style={[styles.emptyButtonText, { color: colors.buttonText }]}
            >
              Browse Lenders
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(item) => item.id}
          renderItem={renderLoanCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={
            <View style={[styles.summaryRow, { backgroundColor: colors.card }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: colors.text }]}>
                  {loans.length}
                </Text>
                <Text style={[styles.statLbl, { color: colors.textSecondary }]}>
                  Total
                </Text>
              </View>
              <View
                style={[styles.statDivider, { backgroundColor: colors.border }]}
              />
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: colors.primary }]}>
                  {activeCount}
                </Text>
                <Text style={[styles.statLbl, { color: colors.textSecondary }]}>
                  Active
                </Text>
              </View>
              <View
                style={[styles.statDivider, { backgroundColor: colors.border }]}
              />
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: colors.warning }]}>
                  {pendingCount}
                </Text>
                <Text style={[styles.statLbl, { color: colors.textSecondary }]}>
                  Pending
                </Text>
              </View>
              <View
                style={[styles.statDivider, { backgroundColor: colors.border }]}
              />
              <View style={styles.statItem}>
                <View style={{ alignItems: "center" }}>
                  {formatCurrencyWithIcon(totalAmount, true)}
                </View>
                <Text style={[styles.statLbl, { color: colors.textSecondary }]}>
                  Total Value
                </Text>
              </View>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
    },
    title: { ...typography.h2, fontWeight: "800" },
    applyBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: borderRadius.full,
    },
    applyBtnText: { fontSize: 14, fontWeight: "600" },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
      paddingTop: spacing.md,
    },
    summaryRow: {
      flexDirection: "row",
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    statItem: { flex: 1, alignItems: "center" },
    statNum: { ...typography.h3, fontWeight: "700", fontSize: 16 },
    statLbl: { fontSize: 11, marginTop: 2, fontWeight: "500" },
    statDivider: { width: 1, marginVertical: 4 },
    cardWrapper: {
      borderRadius: borderRadius.lg,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    card: {
      borderRadius: borderRadius.lg,
      overflow: "hidden",
      padding: spacing.md,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.md,
    },
    lenderInfo: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: spacing.sm,
      marginRight: spacing.sm,
    },
    lenderAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    lenderInitial: { fontSize: 18, fontWeight: "700" },
    lenderText: { flex: 1 },
    lenderName: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
    purpose: { fontSize: 12, fontWeight: "500" },
    badgeContainer: {
      alignItems: "flex-end",
    },
    divider: { height: 1, marginBottom: spacing.md },
    cardBody: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: spacing.md,
    },
    amountBlock: { flex: 1 },
    amountLabel: {
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 4,
    },
    amountValue: { fontSize: 20, fontWeight: "800" },
    termBlock: { alignItems: "flex-end" },
    termLabel: {
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 4,
    },
    termValue: { fontSize: 18, fontWeight: "700" },
    cardFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    dateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    dateText: { fontSize: 12, fontWeight: "500" },
    rejectionBanner: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 6,
      marginTop: spacing.sm,
      padding: spacing.sm,
      borderRadius: borderRadius.sm,
    },
    rejectionText: { flex: 1, fontSize: 12, fontWeight: "500", lineHeight: 16 },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.xl,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.lg,
    },
    emptyTitle: {
      ...typography.h2,
      fontWeight: "700",
      marginBottom: spacing.sm,
      textAlign: "center",
    },
    emptyBody: {
      ...typography.body,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: spacing.xl,
    },
    emptyButton: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.full,
    },
    emptyButtonText: { fontSize: 15, fontWeight: "700" },
    currencyText: {
      fontSize: 16,
      fontWeight: "700",
    },
  });
