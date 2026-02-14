import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Card } from "@/components/ui";
import { spacing, typography, borderRadius } from "@/constants/theme";
import { walletsApi, transactionsApi } from "@/api";
import type { Wallet } from "@/api/walletsApi";
import type { Transaction } from "@/api/transactionsApi";
import { formatCurrency } from "@/utils/currency";
import { useTheme } from "@/hooks/useTheme";

export default function WalletScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWallet = async () => {
    try {
      const walletData = await walletsApi.getMyWallet();
      setWallet(walletData);

      if (walletData) {
        const transactionsData = await transactionsApi.getByWallet(
          walletData.id,
        );
        setTransactions(transactionsData);
      }
    } catch (error) {
      console.error("Failed to load wallet:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadWallet();
  };

  const getTransactionIcon = (type: string) => {
    const icons: Record<string, string> = {
      DEPOSIT: "arrow-down-circle",
      WITHDRAW: "arrow-up-circle",
      LOAN_DISBURSEMENT: "cash",
      LOAN_REPAYMENT: "return-up-back",
      TRANSFER_IN: "swap-horizontal",
      TRANSFER_OUT: "swap-horizontal",
      FEE: "remove-circle",
      PENALTY: "alert-circle",
      REFUND: "return-down-forward",
    };
    return icons[type] || "cash";
  };

  const getTransactionColor = (type: string) => {
    const depositTypes = [
      "DEPOSIT",
      "LOAN_DISBURSEMENT",
      "TRANSFER_IN",
      "REFUND",
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

  if (!wallet && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Wallet</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="wallet-outline" size={64} color={colors.textLight} />
          <Text style={styles.emptyText}>Wallet not available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>My Wallet</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {wallet && (
          <>
            <Card style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Ionicons name="wallet" size={32} color={colors.primary} />
                <Text style={styles.balanceLabel}>Available Balance</Text>
              </View>
              <Text style={styles.balanceValue}>
                {formatCurrency(wallet.balance)}
              </Text>
              {wallet.pendingBalance > 0 && (
                <View style={styles.pendingBalance}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={colors.warning}
                  />
                  <Text style={styles.pendingText}>
                    Pending: {formatCurrency(wallet.pendingBalance)}
                  </Text>
                </View>
              )}
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
                        "LOAN_DISBURSEMENT",
                        "TRANSFER_IN",
                        "REFUND",
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
          </>
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
