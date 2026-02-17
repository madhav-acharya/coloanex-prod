import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Button } from "@/components/ui";
import { spacing, typography, borderRadius } from "@/constants/theme";
import { contractsApi } from "@/api";
import type { Contract } from "@/api/contractsApi";
import { formatCurrency } from "@/utils/currency";
import { useTheme } from "@/hooks/useTheme";

const { height } = Dimensions.get("window");

export default function ContractDetailsScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [signModalVisible, setSignModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [signature, setSignature] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadContract = async () => {
    try {
      const data = await contractsApi.getById(id);
      setContract(data);
    } catch (error) {
      console.error("Failed to load contract:", error);
      Alert.alert("Error", "Failed to load contract details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContract();
  }, [id]);

  const handleSignContract = async () => {
    if (!signature.trim()) {
      Alert.alert("Error", "Please enter your signature");
      return;
    }

    setSubmitting(true);
    try {
      await contractsApi.sign(id, { signature: signature.trim() });
      Alert.alert("Success", "Contract signed successfully!");
      setSignModalVisible(false);
      setSignature("");
      loadContract();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to sign contract");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportContract = async () => {
    if (!reportReason.trim()) {
      Alert.alert("Error", "Please enter a reason for reporting");
      return;
    }

    setSubmitting(true);
    try {
      await contractsApi.report(id, { reportReason: reportReason.trim() });
      Alert.alert(
        "Success",
        "Contract reported successfully. The lender will review your concern.",
      );
      setReportModalVisible(false);
      setReportReason("");
      loadContract();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to report contract");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors_map: Record<string, string> = {
      DRAFT: colors.textLight,
      GENERATED: colors.textLight,
      SIGNED: colors.primary,
      ACTIVE: colors.success,
      COMPLETED: colors.primary,
      DEFAULTED: colors.error,
      CANCELLED: colors.textLight,
      REPORTED: colors.warning,
    };
    return colors_map[status] || colors.textLight;
  };

  const hasBorrowerSigned = () => {
    return contract?.signatures?.some(
      (sig: any) => sig.signedBy === "BORROWER",
    );
  };

  const canSign = () => {
    return (
      contract &&
      (contract.status === "GENERATED" || contract.status === "SIGNED") &&
      !hasBorrowerSigned()
    );
  };

  const canReport = () => {
    return (
      contract &&
      (contract.status === "GENERATED" ||
        contract.status === "SIGNED" ||
        contract.status === "ACTIVE")
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Contract Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading contract...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!contract) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Contract Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorText}>Contract not found</Text>
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
        <Text style={styles.title}>Contract</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.statusContainer}>
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
        <Text style={styles.contractNumber}>{contract.contractNumber}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Lender</Text>
            <Text style={styles.summaryValue}>
              {contract.tenant?.name || "N/A"}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Loan Amount</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(contract.loanAmount)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Interest Rate</Text>
            <Text style={styles.summaryValue}>{contract.interestRate}%</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Term</Text>
            <Text style={styles.summaryValue}>
              {contract.termMonths} months
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount Due</Text>
            <Text style={[styles.summaryValue, { fontWeight: "700" }]}>
              {formatCurrency(contract.totalAmountDue)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Installment Amount</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(contract.installmentAmount)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Number of Installments</Text>
            <Text style={styles.summaryValue}>
              {contract.totalInstallments}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Start Date</Text>
            <Text style={styles.summaryValue}>
              {new Date(contract.startDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>End Date</Text>
            <Text style={styles.summaryValue}>
              {new Date(contract.endDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.termsCard}>
          <Text style={styles.termsTitle}>Terms and Conditions</Text>
          <Text style={styles.termsText}>{contract.termsAndConditions}</Text>
        </View>

        {contract.signatures && contract.signatures.length > 0 && (
          <View style={styles.signaturesCard}>
            <Text style={styles.signaturesTitle}>Signatures</Text>
            {contract.signatures.map((sig: any, index: number) => (
              <View key={index} style={styles.signatureRow}>
                <Ionicons
                  name={
                    sig.signedBy === "BORROWER" ? "person-circle" : "business"
                  }
                  size={20}
                  color={colors.primary}
                />
                <View style={styles.signatureInfo}>
                  <Text style={styles.signatureType}>
                    {sig.signedBy === "BORROWER" ? "Borrower" : "Lender"}
                  </Text>
                  <Text style={styles.signatureValue}>{sig.signature}</Text>
                  <Text style={styles.signatureDate}>
                    {new Date(sig.signedAt).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.webviewContainer}>
        {/* Contract details displayed above in ScrollView */}
      </View>

      <View style={styles.actionsContainer}>
        {canSign() && (
          <Button
            title="Sign Contract"
            onPress={() => setSignModalVisible(true)}
            style={styles.signButton}
          />
        )}
        {canReport() && (
          <Button
            title="Report Issue"
            onPress={() => setReportModalVisible(true)}
            variant="outline"
            style={styles.reportButton}
          />
        )}
        {!canSign() && !canReport() && (
          <Text style={styles.infoText}>
            {hasBorrowerSigned()
              ? "You have signed this contract. Waiting for lender to sign."
              : contract.status === "ACTIVE"
                ? "Contract is active and both parties have signed."
                : contract.status === "REPORTED"
                  ? "This contract has been reported and is under review."
                  : "No actions available for this contract."}
          </Text>
        )}
      </View>

      <Modal
        visible={signModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSignModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sign Contract</Text>
              <TouchableOpacity
                onPress={() => setSignModalVisible(false)}
                disabled={submitting}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              By signing this contract, you agree to all terms and conditions.
              Please enter your full name as your digital signature.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textLight}
              value={signature}
              onChangeText={setSignature}
              editable={!submitting}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setSignModalVisible(false)}
                variant="outline"
                style={styles.modalButton}
                disabled={submitting}
              />
              <Button
                title={submitting ? "Signing..." : "Sign Contract"}
                onPress={handleSignContract}
                style={styles.modalButton}
                disabled={submitting}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={reportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Contract Issue</Text>
              <TouchableOpacity
                onPress={() => setReportModalVisible(false)}
                disabled={submitting}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Please describe the issue you're experiencing with this contract.
              The lender will be notified and will review your concern.
            </Text>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the issue..."
              placeholderTextColor={colors.textLight}
              value={reportReason}
              onChangeText={setReportReason}
              editable={!submitting}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setReportModalVisible(false)}
                variant="outline"
                style={styles.modalButton}
                disabled={submitting}
              />
              <Button
                title={submitting ? "Reporting..." : "Report Issue"}
                onPress={handleReportContract}
                style={styles.reportModalButton}
                disabled={submitting}
              />
            </View>
          </View>
        </View>
      </Modal>
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
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: spacing.xs,
    },
    title: {
      ...typography.h2,
      color: colors.text,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      ...typography.body,
      color: colors.textLight,
      marginTop: spacing.md,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.xl,
    },
    errorText: {
      ...typography.h3,
      color: colors.error,
      marginTop: spacing.md,
    },
    statusContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
    },
    statusText: {
      ...typography.caption,
      fontWeight: "600",
    },
    contractNumber: {
      ...typography.body,
      color: colors.textLight,
      fontWeight: "600",
    },
    webviewContainer: {
      flex: 0,
    },
    webview: {
      flex: 0,
    },
    content: {
      flex: 1,
    },
    summaryCard: {
      backgroundColor: colors.card,
      margin: spacing.md,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      gap: spacing.md,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    summaryLabel: {
      ...typography.body,
      color: colors.textLight,
    },
    summaryValue: {
      ...typography.body,
      color: colors.text,
      fontWeight: "600",
    },
    termsCard: {
      backgroundColor: colors.card,
      margin: spacing.md,
      marginTop: 0,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
    },
    termsTitle: {
      ...typography.h3,
      color: colors.text,
      marginBottom: spacing.md,
    },
    termsText: {
      ...typography.body,
      color: colors.textLight,
      lineHeight: 22,
    },
    signaturesCard: {
      backgroundColor: colors.card,
      margin: spacing.md,
      marginTop: 0,
      marginBottom: spacing.xl,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
    },
    signaturesTitle: {
      ...typography.h3,
      color: colors.text,
      marginBottom: spacing.md,
    },
    signatureRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: spacing.sm,
    },
    signatureInfo: {
      flex: 1,
    },
    signatureType: {
      ...typography.caption,
      color: colors.textLight,
      textTransform: "uppercase",
      fontWeight: "600",
    },
    signatureValue: {
      ...typography.body,
      color: colors.text,
      fontWeight: "600",
      marginTop: spacing.xs,
    },
    signatureDate: {
      ...typography.caption,
      color: colors.textLight,
      marginTop: spacing.xs,
    },
    actionsContainer: {
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: spacing.sm,
    },
    signButton: {
      backgroundColor: colors.success,
    },
    reportButton: {
      borderColor: colors.error,
    },
    infoText: {
      ...typography.body,
      color: colors.textLight,
      textAlign: "center",
      paddingVertical: spacing.md,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: borderRadius.lg,
      borderTopRightRadius: borderRadius.lg,
      padding: spacing.lg,
      maxHeight: height * 0.8,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.md,
    },
    modalTitle: {
      ...typography.h3,
      color: colors.text,
    },
    modalDescription: {
      ...typography.body,
      color: colors.textLight,
      marginBottom: spacing.lg,
      lineHeight: 22,
    },
    input: {
      ...typography.body,
      color: colors.text,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    textArea: {
      minHeight: 120,
    },
    modalActions: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    modalButton: {
      flex: 1,
    },
    reportModalButton: {
      flex: 1,
      backgroundColor: colors.error,
    },
  });
