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
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { spacing, typography, borderRadius } from "@/constants/theme";
import { loansApi, transactionsApi } from "@/api";
import type { Loan } from "@/types";
import { LoanStatus } from "@/types/loan";
import { CurrencyIcon } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import type { Transaction } from "@/api/transactionsApi";
import { useAppSelector } from "@/store/hooks";

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
  styles,
}: {
  status: string;
  colors: Record<string, string>;
  styles: any;
}) {
  const config = getStatusConfig(status, colors);
  return (
    <View
      style={[statusBadgeStyles.badge, { backgroundColor: config.bgColor }]}
    >
      <Ionicons name={config.icon} size={12} color={config.textColor} />
      <Text style={[statusBadgeStyles.label, { color: config.textColor }]}>
        {config.label}
      </Text>
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
});

export default function MyLoansScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { width } = useWindowDimensions();
  const isCompactScreen = width < 390;
  const user = useAppSelector((state) => state.auth.user);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    [],
  );
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const formatCurrencyWithIcon = (
    value: number | null | undefined,
    isPositive: boolean = true,
    compact: boolean = false,
  ) => {
    const safeValue = value ?? 0;
    const color = isPositive ? "#16A34A" : "#DC2626";

    // Use our custom formatting function for consistency
    const numericValue =
      typeof safeValue === "string" ? parseFloat(safeValue) : safeValue;
    const formattedValue = isNaN(numericValue)
      ? "0.00"
      : compact
        ? numericValue.toLocaleString("en-IN", {
            maximumFractionDigits: 0,
          })
        : (() => {
            const parts = numericValue.toFixed(2).split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            return parts.join(".");
          })();

    return (
      <View style={styles.currencyRow}>
        <CurrencyIcon size={compact ? 14 : 16} color={color} />
        <Text
          style={[
            styles.currencyText,
            compact && styles.currencyTextCompact,
            { color },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
        >
          {formattedValue}
        </Text>
      </View>
    );
  };

  const loadLoans = useCallback(async () => {
    try {
      const data = await loansApi.getMyLoans();
      setLoans(data);
      const entityIds = Array.from(
        new Set(
          data
            .flatMap((loan) => [loan.borrowerId, loan.tenantId])
            .concat(user?.id ? [user.id] : []),
        ),
      ).filter((id): id is string => Boolean(id));
      const contractIds = Array.from(
        new Set(
          data
            .map((loan) => (loan as any)?.contract?.id)
            .filter((id): id is string => Boolean(id)),
        ),
      );

      if (entityIds.length > 0 || contractIds.length > 0) {
        setLoadingTransactions(true);
        const [entityBatches, contractBatches] = await Promise.all([
          Promise.all(
            entityIds.map((id) =>
              transactionsApi.getByEntity(id).catch(() => []),
            ),
          ),
          Promise.all(
            contractIds.map((id) =>
              transactionsApi.getByContract(id).catch(() => []),
            ),
          ),
        ]);
        const txMap = new Map<string, Transaction>();
        [...entityBatches.flat(), ...contractBatches.flat()].forEach((tx) => {
          txMap.set(tx.id, tx);
        });
        const mergedAll = Array.from(txMap.values()).filter((tx) => {
          if (!tx.contractId) return true;
          return contractIds.length > 0
            ? contractIds.includes(tx.contractId)
            : true;
        });
        setAllTransactions(mergedAll);
        const merged = mergedAll
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .slice(0, 5);
        setRecentTransactions(merged);
      } else {
        setRecentTransactions([]);
        setAllTransactions([]);
      }
    } catch {
      setRecentTransactions([]);
      setAllTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingTransactions(false);
    }
  }, [user?.id]);

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
  const totalRepaidFromContracts = loans.reduce((sum, l) => {
    return sum + Number(l.contract?.totalAmountPaid ?? 0);
  }, 0);

  const totalRepaidFromTransactions = allTransactions.reduce((sum, tx) => {
    const repaymentTypes = ["INSTALLMENT_PAYMENT", "PENALTY_PAYMENT"];
    if (tx.status !== "COMPLETED" || !repaymentTypes.includes(tx.type)) {
      return sum;
    }
    return sum + Number(tx.amount ?? 0);
  }, 0);

  const totalPaid =
    totalRepaidFromContracts > 0
      ? totalRepaidFromContracts
      : totalRepaidFromTransactions;

  const totalAmountDue = loans.reduce((sum, l) => {
    const due = Number(l.contract?.totalAmountDue ?? 0);
    if (due > 0) return sum + due;
    return sum + Number(l.approvedAmount ?? l.requestedAmount ?? 0);
  }, 0);

  const totalPrincipal = loans.reduce((sum, l) => {
    const principal = Number(
      l.contract?.loanAmount ?? l.approvedAmount ?? l.requestedAmount ?? 0,
    );
    return sum + principal;
  }, 0);

  const totalInterest = Math.max(totalAmountDue - totalPrincipal, 0);
  const rejectedCount = loans.filter(
    (l) => l.status === LoanStatus.REJECTED,
  ).length;

  const summaryStats = [
    {
      key: "total",
      label: "Total",
      value: String(loans.length),
      color: colors.text,
      icon: "albums-outline" as keyof typeof Ionicons.glyphMap,
      iconBg: colors.surface,
    },
    {
      key: "active",
      label: "Active",
      value: String(activeCount),
      color: colors.primary,
      icon: "checkmark-circle-outline" as keyof typeof Ionicons.glyphMap,
      iconBg: colors.primaryLight,
    },
    {
      key: "pending",
      label: "Pending",
      value: String(pendingCount),
      color: colors.warning,
      icon: "time-outline" as keyof typeof Ionicons.glyphMap,
      iconBg: colors.warningLight,
    },
    {
      key: "rejected",
      label: "Rejected",
      value: String(rejectedCount),
      color: colors.error,
      icon: "close-circle-outline" as keyof typeof Ionicons.glyphMap,
      iconBg: colors.errorLight,
    },
    {
      key: "borrowedWithInterest",
      label: "Principal + Interest",
      value: totalAmountDue,
      color: colors.warning,
      icon: "calculator-outline" as keyof typeof Ionicons.glyphMap,
      iconBg: colors.warningLight,
      isCurrency: true,
      subtitle: `Interest: ${totalInterest.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
    },
    {
      key: "paid",
      label: "Total Repaid",
      value: totalPaid,
      color: colors.success,
      icon: "wallet-outline" as keyof typeof Ionicons.glyphMap,
      iconBg: colors.successLight,
      isCurrency: true,
    },
  ];

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
            <StatusBadge status={loan.status} colors={colors} styles={styles} />
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
            <View style={styles.cardFooterLeft}>
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

              <TouchableOpacity
                style={[
                  styles.chainPill,
                  {
                    backgroundColor: loan.blockchainTxHash
                      ? colors.success
                      : colors.textLight,
                  },
                ]}
                onPress={() => {
                  const { showBlockchainInfo } = require("@/utils/blockchain");
                  showBlockchainInfo(loan.blockchainTxHash);
                }}
              >
                <Ionicons
                  name={loan.blockchainTxHash ? "link" : "link-outline"}
                  size={10}
                  color="white"
                />
                <Text style={styles.chainPillText}>
                  {loan.blockchainTxHash ? "On-Chain" : "Off-Chain"}
                </Text>
              </TouchableOpacity>
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

  const getTransactionTypeLabel = (type: Transaction["type"]) =>
    type.replace(/_/g, " ");

  const getTransactionStatusColor = (
    status: Transaction["status"],
    colorSet: Record<string, string>,
  ) => {
    switch (status) {
      case "COMPLETED":
        return colorSet.success;
      case "FAILED":
      case "CANCELLED":
        return colorSet.error;
      default:
        return colorSet.warning;
    }
  };

  const getTransactionDirection = (transaction: Transaction): "in" | "out" => {
    const outflowTypes = [
      "WITHDRAW",
      "INSTALLMENT_PAYMENT",
      "PENALTY_PAYMENT",
      "FEE",
    ];
    const inflowTypes = ["DEPOSIT", "DISBURSEMENT"];

    if (outflowTypes.includes(transaction.type)) {
      return "out";
    }

    if (inflowTypes.includes(transaction.type)) {
      return "in";
    }

    const relatedIds = Array.from(
      new Set(
        loans
          .flatMap((loan) => [loan.borrowerId, loan.tenantId])
          .concat(user?.id ? [user.id] : []),
      ),
    ).filter((id): id is string => Boolean(id));

    if (
      relatedIds.includes(transaction.receivedBy) &&
      !relatedIds.includes(transaction.sentBy)
    ) {
      return "in";
    }

    if (
      relatedIds.includes(transaction.sentBy) &&
      !relatedIds.includes(transaction.receivedBy)
    ) {
      return "out";
    }

    return "out";
  };

  const renderRecentTxSignedAmount = (transaction: Transaction) => {
    const isInflow = getTransactionDirection(transaction) === "in";
    const color = isInflow ? colors.success : colors.error;

    return (
      <View style={styles.recentTxAmountRow}>
        <Text style={[styles.recentTxAmountSign, { color }]}>
          {isInflow ? "+" : "-"}
        </Text>
        <CurrencyIcon size={12} color={color} />
        <Text style={[styles.recentTxAmountText, { color }]}>
          {Number(transaction.amount || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
      </View>
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
            <View>
              <View style={styles.summaryGrid}>
                {summaryStats.map((stat) => (
                  <View
                    key={stat.key}
                    style={[
                      styles.summaryCard,
                      { backgroundColor: colors.card },
                    ]}
                  >
                    <View style={styles.summaryCardTop}>
                      <View
                        style={[
                          styles.summaryIcon,
                          { backgroundColor: stat.iconBg },
                        ]}
                      >
                        <Ionicons
                          name={stat.icon}
                          size={16}
                          color={stat.color}
                        />
                      </View>
                      <Text
                        style={[
                          styles.statLbl,
                          { color: colors.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {stat.label}
                      </Text>
                    </View>

                    {stat.isCurrency ? (
                      <View style={styles.summaryValueWrap}>
                        {formatCurrencyWithIcon(
                          stat.value as number,
                          true,
                          isCompactScreen,
                        )}
                        {(stat as any).subtitle ? (
                          <Text
                            style={[
                              styles.summarySubText,
                              { color: colors.textSecondary },
                            ]}
                            numberOfLines={1}
                          >
                            {(stat as any).subtitle}
                          </Text>
                        ) : null}
                      </View>
                    ) : (
                      <Text
                        style={[styles.statNum, { color: stat.color }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                      >
                        {stat.value as string}
                      </Text>
                    )}
                  </View>
                ))}
              </View>

              <View
                style={[
                  styles.recentTxSection,
                  { backgroundColor: colors.card },
                ]}
              >
                <View style={styles.recentTxHeader}>
                  <Text style={[styles.recentTxTitle, { color: colors.text }]}>
                    Recent Transactions
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/transactions")}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.recentTxViewAll,
                        { color: colors.primary },
                      ]}
                    >
                      View all
                    </Text>
                  </TouchableOpacity>
                </View>

                {loadingTransactions ? (
                  <View style={styles.recentTxLoadingWrap}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : recentTransactions.length === 0 ? (
                  <Text
                    style={[
                      styles.recentTxEmpty,
                      { color: colors.textSecondary },
                    ]}
                  >
                    No transactions found yet
                  </Text>
                ) : (
                  recentTransactions.map((tx, index) => (
                    <View
                      key={tx.id}
                      style={[
                        styles.recentTxRow,
                        index < recentTransactions.length - 1 && {
                          borderBottomColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.recentTxLeft}>
                        <View
                          style={[
                            styles.recentTxIcon,
                            { backgroundColor: colors.primaryLight },
                          ]}
                        >
                          <Ionicons
                            name="swap-horizontal-outline"
                            size={14}
                            color={colors.primary}
                          />
                        </View>
                        <View style={styles.recentTxInfo}>
                          <Text
                            style={[
                              styles.recentTxType,
                              { color: colors.text },
                            ]}
                            numberOfLines={1}
                          >
                            {getTransactionTypeLabel(tx.type)}
                          </Text>
                          <Text
                            style={[
                              styles.recentTxDate,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {new Date(tx.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.recentTxRight}>
                        {renderRecentTxSignedAmount(tx)}
                        <Text
                          style={[
                            styles.recentTxStatus,
                            {
                              color: getTransactionStatusColor(
                                tx.status,
                                colors,
                              ),
                            },
                          ]}
                        >
                          {tx.status}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
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
      paddingHorizontal: spacing.md,
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
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
      paddingTop: spacing.md,
    },
    summaryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginBottom: spacing.sm,
      rowGap: spacing.sm,
    },
    summaryCard: {
      width: "48.5%",
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      marginBottom: spacing.sm,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    summaryCardTop: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    summarySubText: {
      fontSize: 11,
      fontWeight: "500",
    },
    summaryIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    statNum: { ...typography.h3, fontWeight: "800", fontSize: 22 },
    statLbl: { fontSize: 12, fontWeight: "600", flexShrink: 1 },
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
      alignItems: "flex-start",
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    amountBlock: { flex: 1, minWidth: 0 },
    amountLabel: {
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 4,
    },
    amountValue: { fontSize: 20, fontWeight: "800" },
    termBlock: { alignItems: "flex-end", minWidth: 72 },
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
    cardFooterLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    dateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    dateText: { fontSize: 12, fontWeight: "500" },
    chainPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: borderRadius.full,
    },
    chainPillText: {
      fontSize: 10,
      fontWeight: "700",
      color: "white",
    },
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
    summaryValueWrap: {
      width: "100%",
      alignItems: "flex-start",
      paddingHorizontal: 0,
      gap: 4,
    },
    currencyRow: {
      flexDirection: "row",
      alignItems: "center",
      minWidth: 0,
      maxWidth: "100%",
    },
    currencyText: {
      fontSize: 16,
      fontWeight: "700",
      marginLeft: 4,
      flexShrink: 1,
    },
    currencyTextCompact: {
      fontSize: 13,
      fontWeight: "800",
    },
    recentTxSection: {
      borderRadius: borderRadius.lg,
      padding: spacing.sm,
      marginBottom: spacing.sm,
    },
    recentTxHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.xs,
    },
    recentTxTitle: { fontSize: 16, fontWeight: "700" },
    recentTxViewAll: { fontSize: 12, fontWeight: "700" },
    recentTxLoadingWrap: { paddingVertical: spacing.md, alignItems: "center" },
    recentTxEmpty: {
      fontSize: 12,
      fontWeight: "500",
      textAlign: "center",
      paddingVertical: spacing.md,
    },
    recentTxRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
    },
    recentTxLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      minWidth: 0,
    },
    recentTxIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    recentTxInfo: { flex: 1, minWidth: 0 },
    recentTxType: { fontSize: 12, fontWeight: "600" },
    recentTxDate: { fontSize: 11, fontWeight: "500", marginTop: 2 },
    recentTxRight: { alignItems: "flex-end", marginLeft: spacing.sm },
    recentTxAmountRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    recentTxAmountSign: {
      fontSize: 11,
      fontWeight: "700",
    },
    recentTxAmountText: {
      fontSize: 12,
      fontWeight: "700",
    },
    recentTxStatus: { fontSize: 10, fontWeight: "700", marginTop: 2 },
  });
