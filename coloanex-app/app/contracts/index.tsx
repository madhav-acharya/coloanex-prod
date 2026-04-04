import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Card, AppHeader } from "@/components/ui";
import { spacing, typography, borderRadius } from "@/constants/theme";
import { contractsApi } from "@/api";
import type { Contract } from "@/types";
import { formatCurrency } from "@/utils/currency";
import { useTheme } from "@/hooks/useTheme";

export default function ContractsScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadContracts = async () => {
    try {
      const data = await contractsApi.getAll();
      setContracts(data);
    } catch (error) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadContracts();
  };

  const getStatusColor = (status: string) => {
    const colors_map: Record<string, string> = {
      DRAFT: colors.textLight,
      GENERATED: "#3b82f6",
      SIGNED: colors.primary,
      ACTIVE: colors.success,
      COMPLETED: colors.primary,
      DEFAULTED: colors.error,
      CANCELLED: colors.textLight,
      REPORTED: colors.warning,
    };
    return colors_map[status] || colors.textLight;
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      DRAFT: "document-text",
      GENERATED: "document-attach",
      SIGNED: "checkmark-done",
      ACTIVE: "checkmark-circle",
      COMPLETED: "trophy",
      DEFAULTED: "alert-circle",
      CANCELLED: "close-circle",
      REPORTED: "flag",
    };
    return icons[status] || "document-text";
  };


        id: contract.id,
        type: "contract",
        status: contract.status,
        amount: contract.loanAmount,
        transactionHash:
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt,
        details: {
          contractNumber: contract.contractNumber,
          borrower: contract.borrower?.user?.fullName,
          lender: contract.borrower?.tenant?.name,
        },
      });
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="My Contracts" showThemeToggle={false} />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.subtitle}>View and manage your loan contracts</Text>

        {contracts.map((contract) => (
          <TouchableOpacity
            key={contract.id}
            onPress={() => router.push(`/contracts/${contract.id}` as any)}
            activeOpacity={0.7}
          >
            <Card style={styles.contractCard}>
              <View style={styles.contractHeader}>
                <View
                  style={[
                    styles.statusIcon,
                    {
                      backgroundColor: getStatusColor(contract.status) + "20",
                    },
                  ]}
                >
                  <Ionicons
                    name={getStatusIcon(contract.status) as any}
                    size={24}
                    color={getStatusColor(contract.status)}
                  />
                </View>
                <View style={styles.contractInfo}>
                  <Text style={styles.contractNumber}>
                    {contract.contractNumber}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: getStatusColor(contract.status) + "20",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(contract.status) },
                      ]}
                    >
                      {contract.status}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textLight}
                />
              </View>

              <View style={styles.amountSection}>
                <Text style={styles.amountLabel}>Loan Amount</Text>
                <Text style={styles.amountValue}>
                  {formatCurrency(contract.loanAmount)}
                </Text>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>Interest Rate</Text>
                  <Text style={styles.detailValue}>
                    {contract.interestRate}%
                  </Text>
                </View>
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>Term</Text>
                  <Text style={styles.detailValue}>
                    {contract.termMonths} months
                  </Text>
                </View>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>Outstanding Balance</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(contract.outstandingBalance)}
                  </Text>
                </View>
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>Payment Frequency</Text>
                  <Text style={styles.detailValue}>
                    {contract.paymentFrequency}
                  </Text>
                </View>
              </View>

              <View style={styles.dateRow}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={colors.textLight}
                />
                <Text style={styles.dateText}>
                  Start Date:{" "}
                  {new Date(contract.startDate).toLocaleDateString()}
                </Text>
              </View>

                <TouchableOpacity
                  style={[
                    {
                      backgroundColor: "#10b981" + "20",
                      borderColor: "#10b981" + "40",
                    },
                  ]}
                  onPress={(e) => {
                    e.stopPropagation?.();
                  }}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    On-Chain
                  </Text>
                </TouchableOpacity>
              )}

              {contract.signedAt && (
                <View style={styles.dateRow}>
                  <Ionicons
                    name="checkmark-done-outline"
                    size={16}
                    color={colors.success}
                  />
                  <Text style={[styles.dateText, { color: colors.success }]}>
                    Signed on:{" "}
                    {new Date(contract.signedAt).toLocaleDateString()}
                  </Text>
                </View>
              )}

              {contract.status === "ACTIVE" && (
                <View style={styles.dateRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={[styles.dateText, { color: colors.primary }]}>
                    View Payment Schedule →
                  </Text>
                </View>
              )}

              {contract.status === "GENERATED" && (
                <TouchableOpacity
                  style={[
                    styles.actionBanner,
                    {
                      backgroundColor: colors.primary + "15",
                      borderColor: colors.primary + "40",
                    },
                  ]}
                  onPress={() =>
                    router.push(`/contracts/${contract.id}` as any)
                  }
                >
                  <Ionicons
                    name="create-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.actionBannerText, { color: colors.primary }]}
                  >
                    Tap to review and sign this contract
                  </Text>
                </TouchableOpacity>
              )}

              {contract.contractPdfUrl && (
                <TouchableOpacity
                  style={[
                    styles.actionBanner,
                    {
                      backgroundColor: "#6366f112",
                      borderColor: "#6366f140",
                      marginTop: contract.status === "GENERATED" ? 8 : 0,
                    },
                  ]}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    Linking.openURL(contract.contractPdfUrl!);
                  }}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={16}
                    color="#6366f1"
                  />
                  <Text style={[styles.actionBannerText, { color: "#6366f1" }]}>
                    View PDF
                  </Text>
                  <Ionicons name="open-outline" size={14} color="#6366f1" />
                </TouchableOpacity>
              )}
            </Card>
          </TouchableOpacity>
        ))}

        {contracts.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons
              name="document-text-outline"
              size={64}
              color={colors.textLight}
            />
            <Text style={styles.emptyText}>No contracts found</Text>
          </View>
        )}
      </ScrollView>

      />
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: 20,
      fontWeight: "700" as any,
      color: colors.text,
    },
    content: {
      flex: 1,
      padding: spacing.lg,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
    },
    contractCard: {
      marginBottom: spacing.md,
    },
    contractHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    statusIcon: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.lg,
      justifyContent: "center",
      alignItems: "center",
      marginRight: spacing.md,
    },
    contractInfo: {
      flex: 1,
    },
    contractNumber: {
      fontSize: 16,
      fontWeight: "600" as any,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    statusBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: borderRadius.sm,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600" as any,
    },
    amountSection: {
      marginBottom: spacing.md,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    amountLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    amountValue: {
      fontSize: 28,
      fontWeight: "700" as any,
      color: colors.primary,
    },
    detailsGrid: {
      flexDirection: "row",
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    detailBox: {
      flex: 1,
    },
    detailLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: "600" as any,
      color: colors.text,
    },
    dateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    dateText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    signButton: {
      marginTop: spacing.md,
    },
    viewScheduleButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      marginTop: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.primary + "10",
      borderRadius: borderRadius.md,
    },
    viewScheduleText: {
      fontSize: 14,
      fontWeight: "600" as any,
      color: colors.primary,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.xl * 2,
    },
    emptyText: {
      marginTop: spacing.md,
      fontSize: 16,
      color: colors.textSecondary,
    },
    actionBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginTop: spacing.sm,
      padding: spacing.md,
      borderWidth: 1,
      borderRadius: borderRadius.md,
    },
    actionBannerText: {
      fontSize: 13,
      fontWeight: "600" as any,
    },
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      alignSelf: "flex-start",
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderWidth: 1,
      borderRadius: borderRadius.sm,
      marginTop: spacing.xs,
    },
      fontSize: 12,
      fontWeight: "600" as any,
    },
  });
