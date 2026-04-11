import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Dimensions,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import {
  Button,
  AppHeader,
  CurrencyIcon,
  BlockchainProcessingModal,
  useToast,
} from "@/components/ui";
import { spacing, typography, borderRadius } from "@/constants/theme";
import { contractsApi } from "@/api";
import type { Contract } from "@/api/contractsApi";
import { formatCurrency } from "@/utils/currency";
import { useTheme } from "@/hooks/useTheme";
import { ensureActiveSubscription } from "@/utils/subscriptionGuard";

const { height } = Dimensions.get("window");

export default function ContractDetailsScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const styles = createStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [signModalVisible, setSignModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [signature, setSignature] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadContract = async () => {
    setErrorMessage(null);
    try {
      const data = await contractsApi.getById(id);
      setContract(data);
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load contract details";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    loadContract();
  }, [id]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const handleSignContract = async () => {
    const hasSubscription = await ensureActiveSubscription(showToast);
    if (!hasSubscription) {
      return;
    }

    const sig =
      signature.trim() || contract?.borrower?.user?.fullName?.trim() || "";
    if (!sig) {
      Alert.alert("Error", "Unable to retrieve borrower name for signing");
      return;
    }

    setSubmitting(true);
    try {
      await contractsApi.sign(id, { signature: sig });
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
    const hasSubscription = await ensureActiveSubscription(showToast);
    if (!hasSubscription) {
      return;
    }

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

  const CONTRACT_STEPS = ["GENERATED", "SIGNED", "ACTIVE", "COMPLETED"];

  const getStepIndex = (status: string) => {
    const idx = CONTRACT_STEPS.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  const hasBorrowerSigned = () => {
    return contract?.signatures?.some(
      (sig: any) => sig.signedBy === "BORROWER",
    );
  };

  const hasTenantSigned = () => {
    return contract?.signatures?.some((sig: any) => sig.signedBy === "TENANT");
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
      <View style={styles.container}>
        <AppHeader title="Contract Details" showThemeToggle={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading contract...</Text>
        </View>
      </View>
    );
  }

  if (!contract) {
    return (
      <View style={styles.container}>
        <AppHeader title="Contract Details" showThemeToggle={false} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorText}>
            {errorMessage || "Contract not found"}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              setLoading(true);
              loadContract();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Contract" showThemeToggle={false} />

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
        <View style={styles.timelineContainer}>
          {CONTRACT_STEPS.map((step, idx) => {
            const currentIdx = getStepIndex(contract.status);
            const isCompleted = idx <= currentIdx;
            const isActive = idx === currentIdx;
            return (
              <React.Fragment key={step}>
                <View style={styles.timelineStep}>
                  <View
                    style={[
                      styles.timelineDot,
                      {
                        backgroundColor: isCompleted
                          ? getStatusColor(contract.status)
                          : colors.border,
                        borderColor: isActive
                          ? getStatusColor(contract.status)
                          : "transparent",
                        borderWidth: isActive ? 2 : 0,
                      },
                    ]}
                  >
                    {isCompleted && (
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.timelineLabel,
                      {
                        color: isCompleted
                          ? getStatusColor(contract.status)
                          : colors.textLight,
                        fontWeight: isActive ? "700" : "400",
                      },
                    ]}
                  >
                    {step.charAt(0) + step.slice(1).toLowerCase()}
                  </Text>
                </View>
                {idx < CONTRACT_STEPS.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      {
                        backgroundColor:
                          idx < currentIdx
                            ? getStatusColor(contract.status)
                            : colors.border,
                      },
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {canSign() && (
          <TouchableOpacity
            style={[
              styles.signBanner,
              {
                backgroundColor: colors.primary + "15",
                borderColor: colors.primary + "40",
              },
            ]}
            onPress={() => {
              setSignature(contract?.borrower?.user?.fullName ?? "");
              setSignModalVisible(true);
            }}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <View style={styles.signBannerText}>
              <Text style={[styles.signBannerTitle, { color: colors.primary }]}>
                Your Signature Required
              </Text>
              <Text style={[styles.signBannerSub, { color: colors.textLight }]}>
                Tap to review & sign this contract
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}

        {contract.contractPdfUrl && (
          <TouchableOpacity
            style={[
              styles.signBanner,
              {
                backgroundColor: "#6366f1" + "12",
                borderColor: "#6366f1" + "40",
                marginTop: canSign() ? 8 : 0,
              },
            ]}
            onPress={() => Linking.openURL(contract.contractPdfUrl!)}
          >
            <Ionicons name="document-text-outline" size={20} color="#6366f1" />
            <View style={styles.signBannerText}>
              <Text style={[styles.signBannerTitle, { color: "#6366f1" }]}>
                View Contract PDF
              </Text>
              <Text style={[styles.signBannerSub, { color: colors.textLight }]}>
                Open and read the full contract document
              </Text>
            </View>
            <Ionicons name="open-outline" size={16} color="#6366f1" />
          </TouchableOpacity>
        )}

        {contract.status === "GENERATED" &&
          hasBorrowerSigned() &&
          !hasTenantSigned() && (
            <View
              style={[
                styles.pendingBanner,
                {
                  backgroundColor: colors.warning + "15",
                  borderColor: colors.warning + "40",
                },
              ]}
            >
              <Ionicons name="time-outline" size={20} color={colors.warning} />
              <Text
                style={[styles.pendingBannerText, { color: colors.warning }]}
              >
                Waiting for lender to sign
              </Text>
            </View>
          )}
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
            onPress={() => {
              setSignature(contract?.borrower?.user?.fullName ?? "");
              setSignModalVisible(true);
            }}
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
              <Text style={styles.modalTitle}>Sign Loan Agreement</Text>
              <TouchableOpacity
                onPress={() => setSignModalVisible(false)}
                disabled={submitting}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {contract && (
              <View style={styles.signSummary}>
                <Text style={styles.signSummaryRow}>
                  <Text style={styles.signSummaryLabel}>Contract No.: </Text>
                  {contract.contractNumber}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.signSummaryLabel}>Loan Amount: </Text>
                  <CurrencyIcon size={16} color="#000" />
                  <Text style={{ marginLeft: 4 }}>
                    {(() => {
                      const amount = contract.loanAmount;
                      const numericValue =
                        typeof amount === "string"
                          ? parseFloat(amount)
                          : amount;
                      if (isNaN(numericValue)) return "0.00";
                      const parts = numericValue.toFixed(2).split(".");
                      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                      return parts.join(".");
                    })()}
                  </Text>
                </View>
                <Text style={styles.signSummaryRow}>
                  <Text style={styles.signSummaryLabel}>Interest Rate: </Text>
                  {contract.interestRate}% per month
                </Text>
                <Text style={styles.signSummaryRow}>
                  <Text style={styles.signSummaryLabel}>Term: </Text>
                  {contract.termMonths} months &bull;{" "}
                  {contract.totalInstallments} installments
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.signSummaryLabel}>Total Due: </Text>
                  <CurrencyIcon size={16} color="#000" />
                  <Text style={{ marginLeft: 4 }}>
                    {(() => {
                      const amount = contract.totalAmountDue;
                      const numericValue =
                        typeof amount === "string"
                          ? parseFloat(amount)
                          : amount;
                      if (isNaN(numericValue)) return "0.00";
                      const parts = numericValue.toFixed(2).split(".");
                      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                      return parts.join(".");
                    })()}
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.modalDescription}>
              By clicking{" "}
              <Text style={{ fontWeight: "700" }}>I Agree &amp; Sign</Text>, you
              acknowledge that you have read, understood, and voluntarily agree
              to be bound by all terms and conditions of this Loan Agreement.
              Your name will constitute your electronic signature.
            </Text>

            <View style={styles.signatureDisplay}>
              <Text style={styles.signatureDisplayLabel}>
                Electronic Signature
              </Text>
              <Text style={styles.signatureDisplayName}>
                {signature || contract?.borrower?.user?.fullName || "—"}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setSignModalVisible(false)}
                variant="outline"
                style={styles.modalButton}
                disabled={submitting}
              />
              <Button
                title={submitting ? "Signing..." : "I Agree & Sign"}
                onPress={handleSignContract}
                style={StyleSheet.flatten([
                  styles.modalButton,
                  styles.signConfirmButton,
                ])}
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
              Please describe the issue you&apos;re experiencing with this
              contract. The lender will be notified and will review your
              concern.
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

      <BlockchainProcessingModal
        visible={submitting}
        message={
          signModalVisible
            ? "Recording contract signature on the blockchain and updating the database. Please wait..."
            : "Recording contract report on the blockchain and updating the database. Please wait..."
        }
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
      textAlign: "center",
    },
    retryButton: {
      marginTop: spacing.lg,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
    },
    retryButtonText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "600" as any,
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
      fontSize: 16,
    },
    modalTitleRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.sm,
    },
    modalIconBadge: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.primaryLight,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    modalDescription: {
      ...typography.body,
      color: colors.textLight,
      marginBottom: spacing.lg,
      lineHeight: 22,
      fontSize: 12,
    },
    signSummaryGrid: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
      overflow: "hidden" as const,
      backgroundColor: colors.surface,
    },
    signGridRow: {
      flexDirection: "row" as const,
    },
    signGridRowBorderTop: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    signGridCell: {
      flex: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    signGridCellHalf: {
      flex: 1,
    },
    signGridCellBorderLeft: {
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
    },
    signGridLabel: {
      fontSize: 9,
      fontWeight: "600" as any,
      color: colors.textLight,
      textTransform: "uppercase" as const,
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    signGridValue: {
      fontSize: 11,
      fontWeight: "600" as any,
      color: colors.text,
    },
    signGridTotalRow: {
      flexDirection: "row" as const,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
    },
    signGridTotalValue: {
      fontSize: 13,
      fontWeight: "700" as any,
      color: colors.text,
    },
    signLegalNotice: {
      flexDirection: "row" as const,
      gap: spacing.sm - 2,
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.primary + "30",
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md - 2,
      paddingVertical: spacing.sm + 2,
      marginBottom: spacing.md,
    },
    signLegalText: {
      flex: 1,
      fontSize: 11,
      color: colors.primaryDark,
      lineHeight: 17,
    },
    signSummary: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      gap: spacing.xs,
    },
    signSummaryRow: {
      ...typography.body,
      color: colors.text,
      fontSize: 12,
      lineHeight: 20,
    },
    signSummaryLabel: {
      fontWeight: "700" as any,
      color: colors.text,
    },
    inputLabel: {
      ...typography.caption,
      color: colors.text,
      fontWeight: "600" as any,
      marginBottom: spacing.xs,
      fontSize: 12,
    },
    signatureDisplay: {
      borderWidth: 2,
      borderColor: colors.primary + "50",
      borderRadius: borderRadius.md,
      backgroundColor: colors.primaryLight,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm + 2,
      paddingBottom: spacing.sm,
      marginBottom: spacing.lg,
    },
    signatureDisplayLabel: {
      fontSize: 9,
      fontWeight: "600" as any,
      color: colors.textLight,
      textTransform: "uppercase" as const,
      letterSpacing: 0.5,
      marginBottom: spacing.xs,
    },
    signatureDisplayName: {
      ...typography.body,
      color: colors.text,
      fontWeight: "700" as any,
      fontSize: 16,
      marginBottom: spacing.xs,
    },
    signatureFooter: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 4,
      borderTopWidth: 1,
      borderTopColor: colors.primary + "30",
      paddingTop: spacing.xs,
    },
    signatureFooterText: {
      fontSize: 10,
      color: colors.primaryDark,
    },
    signConfirmButton: {
      backgroundColor: colors.primary,
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
    timelineContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    timelineStep: {
      alignItems: "center",
      gap: 4,
    },
    timelineDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    timelineLabel: {
      fontSize: 10,
      textAlign: "center",
      maxWidth: 60,
    },
    timelineLine: {
      flex: 1,
      height: 2,
      marginBottom: 14,
      marginHorizontal: 2,
    },
    signBanner: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      padding: spacing.md,
      borderWidth: 1,
      borderRadius: borderRadius.md,
      gap: spacing.sm,
    },
    signBannerText: {
      flex: 1,
    },
    signBannerTitle: {
      fontSize: 14,
      fontWeight: "700" as any,
    },
    signBannerSub: {
      fontSize: 12,
      marginTop: 2,
    },
    pendingBanner: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      padding: spacing.md,
      borderWidth: 1,
      borderRadius: borderRadius.md,
      gap: spacing.sm,
    },
    pendingBannerText: {
      fontSize: 13,
      fontWeight: "600" as any,
    },
  });
