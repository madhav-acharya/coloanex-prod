import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { CurrencyIcon } from "@/components/ui";
import { spacing, borderRadius } from "@/constants/theme";
import { transactionsApi, loansApi } from "@/api";
import type { Transaction } from "@/api/transactionsApi";
import { useTheme } from "@/hooks/useTheme";
import { useAppSelector } from "@/store/hooks";

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const user = useAppSelector((state) => state.auth.user);
  const currentIdentifier = user?.id;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actorIds, setActorIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 10;

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const myLoans = await loansApi.getMyLoans().catch(() => []);
      const entityIds = Array.from(
        new Set(
          myLoans
            .flatMap((loan) => [loan.borrowerId, loan.tenantId])
            .concat(currentIdentifier ? [currentIdentifier] : []),
        ),
      ).filter((id): id is string => Boolean(id));
      const contractIds = Array.from(
        new Set(
          myLoans
            .map((loan) => (loan as any)?.contract?.id)
            .filter((id): id is string => Boolean(id)),
        ),
      );

      if (!entityIds.length && !contractIds.length) {
        setTransactions([]);
        setActorIds([]);
        return;
      }

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

      const merged = Array.from(txMap.values()).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setTransactions(merged);
      setActorIds(entityIds);
      setCurrentPage(1);
    } catch {
      setTransactions([]);
      setActorIds([]);
      setCurrentPage(1);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentIdentifier]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadTransactions();
    }, [loadTransactions]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const getTransactionIcon = (type: string) => {
    const icons: Record<string, string> = {
      DEPOSIT: "arrow-down-circle",
      WITHDRAW: "arrow-up-circle",
      DISBURSEMENT: "cash",
      INSTALLMENT_PAYMENT: "return-up-back",
      PENALTY_PAYMENT: "alert-circle",
      FEE: "remove-circle",
    };
    return icons[type] || "cash";
  };

  const getDirection = (transaction: Transaction): "in" | "out" => {
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

    if (
      actorIds.includes(transaction.receivedBy) &&
      !actorIds.includes(transaction.sentBy)
    ) {
      return "in";
    }
    if (
      actorIds.includes(transaction.sentBy) &&
      !actorIds.includes(transaction.receivedBy)
    ) {
      return "out";
    }

    return "out";
  };

  const getTransactionColor = (transaction: Transaction) => {
    return getDirection(transaction) === "in" ? colors.success : colors.error;
  };

  const getStatusColor = (status: string) => {
    const colors_map: Record<string, string> = {
      PENDING: colors.warning,
      COMPLETED: colors.success,
      FAILED: colors.error,
      CANCELLED: colors.textLight,
    };
    return colors_map[status] || colors.textLight;
  };

  const sentAmount = transactions
    .filter((t) => getDirection(t) === "out")
    .reduce((sum, t) => {
      const amount = Number((t as any)?.amount);
      return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);

  const receivedAmount = transactions
    .filter((t) => getDirection(t) === "in")
    .reduce((sum, t) => {
      const amount = Number((t as any)?.amount);
      return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);

  const renderSignedAmount = (transaction: Transaction) => {
    const isInflow = getDirection(transaction) === "in";
    const color = isInflow ? colors.success : colors.error;
    return (
      <View style={styles.signedAmountRow}>
        <Text style={[styles.transactionAmount, { color }]}>
          {isInflow ? "+" : "-"}
        </Text>
        <CurrencyIcon size={14} color={color} />
        <Text style={[styles.transactionAmount, { color }]}>
          {Number(transaction.amount || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
      </View>
    );
  };

  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Transactions</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={[styles.balanceCard, { backgroundColor: colors.card }]}>
          <View style={styles.balanceHeader}>
            <Ionicons name="swap-horizontal" size={28} color={colors.primary} />
            <Text
              style={[styles.balanceLabel, { color: colors.textSecondary }]}
            >
              Total Transactions
            </Text>
          </View>
          <Text style={[styles.balanceValue, { color: colors.text }]}>
            {transactions.length}
          </Text>

          <View style={styles.balanceSplitRow}>
            <View style={styles.balanceSplitItem}>
              <Text
                style={[
                  styles.balanceSplitLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Sent Amount
              </Text>
              <View style={styles.amountRow}>
                <CurrencyIcon size={14} color={colors.error} />
                <Text
                  style={[styles.balanceSplitValue, { color: colors.error }]}
                >
                  -
                  {Number(sentAmount || 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.balanceSplitItem}>
              <Text
                style={[
                  styles.balanceSplitLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Received Amount
              </Text>
              <View style={styles.amountRow}>
                <CurrencyIcon size={14} color={colors.success} />
                <Text
                  style={[styles.balanceSplitValue, { color: colors.success }]}
                >
                  +
                  {Number(receivedAmount || 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.transactionsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Transactions
            </Text>

            {paginatedTransactions.map((transaction) => (
              <View
                key={transaction.id}
                style={[
                  styles.transactionCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.transactionRow}>
                  <View
                    style={[
                      styles.transactionIcon,
                      {
                        backgroundColor:
                          getTransactionColor(transaction) + "20",
                      },
                    ]}
                  >
                    <Ionicons
                      name={getTransactionIcon(transaction.type) as any}
                      size={18}
                      color={getTransactionColor(transaction)}
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text
                      style={[styles.transactionType, { color: colors.text }]}
                    >
                      {transaction.type.replace(/_/g, " ")}
                    </Text>
                    <View style={styles.transactionMeta}>
                      <Text
                        style={[
                          styles.transactionDate,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </Text>
                      <View
                        style={[
                          styles.transactionStatus,
                          {
                            backgroundColor:
                              getStatusColor(transaction.status) + "20",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.transactionStatusText,
                            { color: getStatusColor(transaction.status) },
                          ]}
                        >
                          {transaction.status}
                        </Text>
                      </View>
                    </View>
                    {transaction.contract?.contractNumber && (
                      <Text
                        style={[
                          styles.transactionDescription,
                          { color: colors.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        Contract: {transaction.contract.contractNumber}
                      </Text>
                    )}
                  </View>
                  {renderSignedAmount(transaction)}
                </View>
              </View>
            ))}

            {transactions.length === 0 && (
              <View style={styles.noTransactions}>
                <Ionicons
                  name="receipt-outline"
                  size={46}
                  color={colors.textLight}
                />
                <Text
                  style={[
                    styles.noTransactionsText,
                    { color: colors.textSecondary },
                  ]}
                >
                  No transactions found yet
                </Text>
                <Text
                  style={[
                    styles.noTransactionsSubText,
                    { color: colors.textLight },
                  ]}
                >
                  Approved loans and repayments will appear here.
                </Text>
              </View>
            )}

            {transactions.length > PAGE_SIZE && (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  style={[
                    styles.pageButton,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: currentPage === 1 ? 0.5 : 1,
                    },
                  ]}
                  disabled={currentPage === 1}
                  onPress={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                >
                  <Text style={[styles.pageButtonText, { color: colors.text }]}>
                    Previous
                  </Text>
                </TouchableOpacity>

                <Text
                  style={[styles.pageInfo, { color: colors.textSecondary }]}
                >
                  Page {currentPage} / {totalPages}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.pageButton,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: currentPage === totalPages ? 0.5 : 1,
                    },
                  ]}
                  disabled={currentPage === totalPages}
                  onPress={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                >
                  <Text style={[styles.pageButtonText, { color: colors.text }]}>
                    Next
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: 22,
      fontWeight: "800",
    },
    content: {
      flex: 1,
    },
    balanceCard: {
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      alignItems: "center",
    },
    balanceHeader: {
      alignItems: "center",
      marginBottom: spacing.md,
    },
    balanceLabel: {
      fontSize: 14,
      marginTop: spacing.sm,
    },
    balanceValue: {
      fontSize: 34,
      fontWeight: "800",
      marginBottom: spacing.xs,
    },
    balanceSplitRow: {
      flexDirection: "row",
      width: "100%",
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    balanceSplitItem: {
      flex: 1,
      alignItems: "center",
      backgroundColor: "rgba(148, 163, 184, 0.08)",
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm,
    },
    balanceSplitLabel: {
      fontSize: 12,
      fontWeight: "600",
    },
    balanceSplitValue: {
      fontSize: 14,
      fontWeight: "700",
      marginTop: 2,
    },
    amountRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 2,
    },
    loaderWrap: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.xl,
    },
    transactionsSection: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: spacing.md,
    },
    transactionCard: {
      marginBottom: spacing.sm,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
    },
    transactionRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    transactionIcon: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.full,
      justifyContent: "center",
      alignItems: "center",
      marginRight: spacing.md,
    },
    transactionInfo: {
      flex: 1,
    },
    transactionType: {
      fontSize: 14,
      fontWeight: "600",
      textTransform: "capitalize",
      marginBottom: spacing.xs,
    },
    transactionMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    transactionDate: {
      fontSize: 12,
    },
    transactionStatus: {
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
    },
    transactionStatusText: {
      fontSize: 12,
      fontWeight: "600",
    },
    transactionDescription: {
      fontSize: 12,
      marginTop: spacing.xs,
    },
    transactionAmount: {
      fontSize: 16,
      fontWeight: "700",
    },
    signedAmountRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      marginLeft: spacing.xs,
    },
    noTransactions: {
      alignItems: "center",
      paddingVertical: spacing.xl,
    },
    noTransactionsText: {
      marginTop: spacing.md,
      fontSize: 14,
      fontWeight: "600",
    },
    noTransactionsSubText: {
      marginTop: 4,
      fontSize: 12,
      fontWeight: "500",
    },
    paginationRow: {
      marginTop: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    pageButton: {
      borderWidth: 1,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    pageButtonText: {
      fontSize: 12,
      fontWeight: "600",
    },
    pageInfo: {
      fontSize: 12,
      fontWeight: "600",
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.xl * 2,
    },
    emptyText: {
      marginTop: spacing.md,
      fontSize: 16,
    },
  });
