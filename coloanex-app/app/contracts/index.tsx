import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Card, Button } from "@/components/ui";
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
      console.error("Failed to load contracts:", error);
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

  const handleSignContract = async (contractId: string) => {
    Alert.prompt(
      "Sign Contract",
      "Enter your digital signature to sign the contract",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign",
          onPress: async (signature?: string) => {
            if (!signature) return;
            try {
              await contractsApi.sign(contractId, { signature });
              Alert.alert("Success", "Contract signed successfully");
              loadContracts();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to sign contract");
            }
          },
        },
      ],
      "plain-text",
    );
  };

  const getStatusColor = (status: string) => {
    const colors_map: Record<string, string> = {
      DRAFT: colors.textLight,
      ACTIVE: colors.success,
      COMPLETED: colors.primary,
      DEFAULTED: colors.error,
      CANCELLED: colors.textLight,
    };
    return colors_map[status] || colors.textLight;
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      DRAFT: "document-text",
      ACTIVE: "checkmark-circle",
      COMPLETED: "trophy",
      DEFAULTED: "alert-circle",
      CANCELLED: "close-circle",
    };
    return icons[status] || "document-text";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>My Contracts</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.subtitle}>View and manage your loan contracts</Text>

        {contracts.map((contract) => (
          <Card key={contract.id} style={styles.contractCard}>
            <View style={styles.contractHeader}>
              <View
                style={[
                  styles.statusIcon,
                  { backgroundColor: getStatusColor(contract.status) + "20" },
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
                    { backgroundColor: getStatusColor(contract.status) + "20" },
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
                <Text style={styles.detailValue}>{contract.interestRate}%</Text>
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
                Start Date: {new Date(contract.startDate).toLocaleDateString()}
              </Text>
            </View>

            {contract.signedAt && (
              <View style={styles.dateRow}>
                <Ionicons
                  name="checkmark-done-outline"
                  size={16}
                  color={colors.success}
                />
                <Text style={[styles.dateText, { color: colors.success }]}>
                  Signed on: {new Date(contract.signedAt).toLocaleDateString()}
                </Text>
              </View>
            )}

            {contract.status === "DRAFT" && (
              <Button
                title="Sign Contract"
                onPress={() => handleSignContract(contract.id)}
                style={styles.signButton}
              />
            )}

            {contract.status === "ACTIVE" && (
              <TouchableOpacity
                style={styles.viewScheduleButton}
                onPress={() =>
                  router.push(`/payment-schedules/${contract.id}` as any)
                }
              >
                <Text style={styles.viewScheduleText}>
                  View Payment Schedule
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
          </Card>
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
    </SafeAreaView>
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
  });
