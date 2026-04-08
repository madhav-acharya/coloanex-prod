import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { Card, AppHeader } from "@/components/ui";
import { spacing, borderRadius } from "@/constants/theme";
import { transactionsApi } from "@/api";
import type { Transaction } from "@/api/transactionsApi";
import { formatCurrency } from "@/utils/currency";
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

  const loadTransactions = useCallback(async () => {
    if (!currentIdentifier) return;
    try {
      const transactionsData = await transactionsApi.getByEntity(
        currentIdentifier,
      );
      setTransactions(transactionsData);
    } catch (error) {
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

  const getTransactionColor = (type: string) => {
    const depositTypes = [
      "DEPOSIT",
      "DISBURSEMENT",
      "INSTALLMENT_PAYMENT",
    ];
    return depositTypes.includes(type) ? colors.success : colors.error;
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

  const toGive = transactions
    .filter((t) => t.sentBy === currentIdentifier && t.type !== "DEPOSIT")
    .reduce((sum, t) => sum + t.amount, 0);

  const toReceive = transactions
    .filter((t) => t.receivedBy === currentIdentifier && t.type !== "WITHDRAW")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <View style={styles.container}>
      <AppHeader title="Transactions" showThemeToggle={false} />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Ionicons name="swap-horizontal" size={32} color={colors.primary} />
            <Text style={styles.balanceLabel}>Total Transactions</Text>
          </View>
          <Text style={styles.balanceValue}>
            {transactions.length}
          </Text>
          
          <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.sm }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>To Give</Text>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.error }}>{formatCurrency(toGive)}</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>To Receive</Text>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.success }}>{formatCurrency(toReceive)}</Text>
            </View>
          </View>
        </Card>

        <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push("/activity-logs" as any)}
              >
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: colors.success + "20" },
                  ]}
                >
                  <Ionicons
                    name="add-circle"
                    size={24}
                    color={colors.success}
                  />
                </View>
                <Text style={styles.actionText}>Deposit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push("/activity-logs" as any)}
              >
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: colors.error + "20" },
                  ]}
                >
                  <Ionicons
                    name="remove-circle"
                    size={24}
                    color={colors.error}
                  />
                </View>
                <Text style={styles.actionText}>Withdraw</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push("/activity-logs" as any)}
              >
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: colors.primary + "20" },
                  ]}
                >
                  <Ionicons
                    name="list-circle"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.actionText}>History</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.transactionsSection}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>

              {transactions.slice(0, 10).map((transaction) => (
                <Card key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionRow}>
                    <View
                      style={[
                        styles.transactionIcon,
                        {
                          backgroundColor:
                            getTransactionColor(transaction.type) + "20",
                        },
                      ]}
                    >
                      <Ionicons
                        name={getTransactionIcon(transaction.type) as any}
                        size={20}
                        color={getTransactionColor(transaction.type)}
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionType}>
                        {transaction.type.replace(/_/g, " ")}
                      </Text>
                      <View style={styles.transactionMeta}>
                        <Text style={styles.transactionDate}>
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
                      {transaction.description && (
                        <Text style={styles.transactionDescription}>
                          {transaction.description}
                        </Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.transactionAmount,
                        { color: getTransactionColor(transaction.type) },
                      ]}
                    >
                      {[
                        "DEPOSIT",
                        "DISBURSEMENT",
                      ].includes(transaction.type)
                        ? "+"
                        : "-"}
                      {formatCurrency(transaction.amount)}
                    </Text>
                  </View>
                </Card>
              ))}

              {transactions.length === 0 && (
                <View style={styles.noTransactions}>
                  <Ionicons
                    name="receipt-outline"
                    size={48}
                    color={colors.textLight}
                  />
                  <Text style={styles.noTransactionsText}>
                    No transactions yet
                  </Text>
                </View>
              )}

              {transactions.length > 10 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => router.push("/activity-logs" as any)}
                >
                  <Text style={styles.viewAllText}>View All Transactions</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}
            </View>
      </ScrollView>
    </View>
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
      padding: spacing.lg,
      borderBottomWidth: 1,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
    },
    content: {
      flex: 1,
    },
    balanceCard: {
      margin: spacing.lg,
      padding: spacing.xl,
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
      fontSize: 36,
      fontWeight: "700",
      marginBottom: spacing.sm,
    },
    pendingBalance: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
    },
    pendingText: {
      fontSize: 12,
      fontWeight: "600",
    },
    actionsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.xl,
    },
    actionButton: {
      alignItems: "center",
      gap: spacing.sm,
    },
    actionIcon: {
      width: 56,
      height: 56,
      borderRadius: borderRadius.full,
      justifyContent: "center",
      alignItems: "center",
    },
    actionText: {
      fontSize: 14,
    },
    transactionsSection: {
      padding: spacing.lg,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: spacing.md,
    },
    transactionCard: {
      marginBottom: spacing.sm,
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
    noTransactions: {
      alignItems: "center",
      paddingVertical: spacing.xl * 2,
    },
    noTransactionsText: {
      marginTop: spacing.md,
      fontSize: 14,
    },
    viewAllButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingVertical: spacing.md,
      marginTop: spacing.md,
    },
    viewAllText: {
      fontSize: 14,
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
