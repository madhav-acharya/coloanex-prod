import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CurrencyIcon } from "../ui/CurrencyIcon";
import {
  blockchainVerificationService,
  type BlockchainRecord,
  type BlockchainVerificationResult,
} from "../../services/blockchainVerification";

interface Props {
  visible: boolean;
  onClose: () => void;
  record: BlockchainRecord | null;
}

export function BlockchainVerificationModal({
  visible,
  onClose,
  record,
}: Props) {
  const [verification, setVerification] =
    useState<BlockchainVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (visible && record) {
      verifyBlockchainRecord();
    }
  }, [visible, record?.transactionHash]);

  const verifyBlockchainRecord = async () => {
    if (!record) return;

    setIsVerifying(true);
    setVerification(null);

    try {
      const result = await blockchainVerificationService.verifyRecord(record);
      setVerification(result);
    } catch (error) {
      setVerification({
        isVerified: false,
        onChain: false,
        error: "Failed to connect to blockchain verification service",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const getVerificationIcon = () => {
    if (isVerifying) return { name: "reload", color: "#3b82f6", spin: true };
    if (!verification) return null;

    if (verification.isVerified && verification.onChain) {
      return { name: "checkmark-circle", color: "#10b981" };
    } else {
      return verification.error
        ? { name: "close-circle", color: "#ef4444" }
        : { name: "alert-circle", color: "#f59e0b" };
    }
  };

  const getVerificationStatus = () => {
    if (isVerifying) return "Verifying...";
    if (!verification) return "";

    if (verification.isVerified && verification.onChain) {
      return "Verified on Blockchain";
    } else if (verification.error) {
      return "Verification Failed";
    } else {
      return "Not on Blockchain";
    }
  };

  const getStatusBadgeStyle = () => {
    if (!record) return styles.badgeGray;

    switch (record.status.toLowerCase()) {
      case "completed":
      case "paid":
      case "active":
      case "approved":
        return styles.badgeGreen;
      case "pending":
      case "under_review":
      case "submitted":
        return styles.badgeAmber;
      case "rejected":
      case "cancelled":
      case "failed":
        return styles.badgeRed;
      case "draft":
        return styles.badgeGray;
      default:
        return styles.badgeBlue;
    }
  };

  const icon = getVerificationIcon();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Blockchain Verification</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {record && (
          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Type</Text>
                  <Text style={styles.infoValue}>{record.type}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <View style={[styles.badge, getStatusBadgeStyle()]}>
                    <Text style={styles.badgeText}>
                      {record.status.replace(/_/g, " ")}
                    </Text>
                  </View>
                </View>
                <View style={[styles.infoItem, styles.fullWidth]}>
                  <Text style={styles.infoLabel}>Blockchain TxID</Text>
                  <Text style={styles.infoValueMono}>
                    {record.transactionHash || "Not recorded on blockchain"}
                  </Text>
                </View>
                {record.amount && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Amount</Text>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <CurrencyIcon size={16} color="#16A34A" />
                      <Text style={[styles.infoValue, { marginLeft: 4 }]}>
                        {record.amount.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Blockchain Verification Status */}
            <View style={styles.section}>
              <View style={styles.verificationHeader}>
                <Text style={styles.sectionTitle}>Blockchain Verification</Text>
                <View style={styles.statusRow}>
                  {icon && (
                    <Ionicons
                      name={icon.name as any}
                      size={20}
                      color={icon.color}
                    />
                  )}
                  <Text style={styles.statusText}>
                    {getVerificationStatus()}
                  </Text>
                </View>
              </View>

              {verification && (
                <View style={styles.verificationDetails}>
                  {verification.isVerified && verification.onChain ? (
                    <View>
                      <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>
                            Transaction Hash
                          </Text>
                          <Text style={styles.detailValueMono}>
                            {verification.transactionHash}
                          </Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Block Number</Text>
                          <Text style={styles.detailValueMono}>
                            {verification.blockNumber}
                          </Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Confirmations</Text>
                          <Text style={styles.detailValueMono}>
                            {verification.confirmations}
                          </Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Timestamp</Text>
                          <Text style={styles.detailValue}>
                            {verification.timestamp
                              ? new Date(
                                  verification.timestamp,
                                ).toLocaleString()
                              : "N/A"}
                          </Text>
                        </View>
                      </View>

                      {verification.chainData && (
                        <View style={styles.chainDataSection}>
                          <Text style={styles.chainDataTitle}>
                            Hyperledger Fabric Details
                          </Text>
                          <View style={styles.chainDataGrid}>
                            <View style={styles.chainDataItem}>
                              <Text style={styles.chainDataLabel}>MSP ID:</Text>
                              <Text style={styles.chainDataValue}>
                                {verification.chainData.mspId}
                              </Text>
                            </View>
                            <View style={styles.chainDataItem}>
                              <Text style={styles.chainDataLabel}>
                                Channel:
                              </Text>
                              <Text style={styles.chainDataValue}>
                                {verification.chainData.channelName}
                              </Text>
                            </View>
                            <View style={styles.chainDataItem}>
                              <Text style={styles.chainDataLabel}>
                                Chaincode:
                              </Text>
                              <Text style={styles.chainDataValue}>
                                {verification.chainData.chaincodeName}
                              </Text>
                            </View>
                            <View style={styles.chainDataItem}>
                              <Text style={styles.chainDataLabel}>
                                Function:
                              </Text>
                              <Text style={styles.chainDataValue}>
                                {verification.chainData.functionName}
                              </Text>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  ) : verification.error ? (
                    <View style={styles.errorSection}>
                      <Text style={styles.errorText}>{verification.error}</Text>
                    </View>
                  ) : (
                    <View style={styles.warningSection}>
                      <Text style={styles.warningText}>
                        This record exists in the database but has not been
                        recorded on the blockchain yet.
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.outlineButton]}
                onPress={verifyBlockchainRecord}
                disabled={isVerifying}
              >
                {isVerifying && (
                  <ActivityIndicator
                    size="small"
                    color="#6b7280"
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text style={styles.outlineButtonText}>
                  {isVerifying ? "Verifying..." : "Verify Again"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={onClose}
              >
                <Text style={styles.primaryButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fullWidth: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  infoLabel: {
    fontSize: 14,
    color: "#6b7280",
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    flex: 1,
    textAlign: "right",
    textTransform: "capitalize",
  },
  infoValueMono: {
    fontSize: 12,
    fontFamily: "monospace",
    color: "#111827",
    flex: 1,
    textAlign: "right",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  badgeGreen: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  badgeAmber: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  badgeRed: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  badgeGray: {
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    borderColor: "rgba(107, 114, 128, 0.3)",
  },
  badgeBlue: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderColor: "rgba(59, 130, 246, 0.3)",
  },
  verificationHeader: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  spinning: {
    // Add rotation animation if needed
  },
  verificationDetails: {
    gap: 16,
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  detailValue: {
    fontSize: 14,
    color: "#111827",
  },
  detailValueMono: {
    fontSize: 12,
    fontFamily: "monospace",
    color: "#111827",
  },
  chainDataSection: {
    padding: 12,
    backgroundColor: "rgba(16, 185, 129, 0.05)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  chainDataTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#065f46",
    marginBottom: 8,
  },
  chainDataGrid: {
    gap: 8,
  },
  chainDataItem: {
    flexDirection: "row",
    gap: 8,
  },
  chainDataLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#065f46",
    minWidth: 80,
  },
  chainDataValue: {
    fontSize: 12,
    color: "#047857",
    flex: 1,
  },
  errorSection: {
    padding: 16,
    backgroundColor: "rgba(220, 38, 38, 0.15)",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(220, 38, 38, 0.4)",
  },
  errorText: {
    fontSize: 14,
    color: "#b91c1c",
    fontWeight: "600",
    lineHeight: 20,
  },
  warningSection: {
    padding: 16,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  warningText: {
    fontSize: 14,
    color: "#92400e",
    fontWeight: "500",
    lineHeight: 20,
  },
  benefitsGrid: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  benefitContent: {
    flex: 1,
    gap: 2,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  benefitDescription: {
    fontSize: 12,
    color: "#6b7280",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  outlineButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  primaryButton: {
    backgroundColor: "#3b82f6",
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ffffff",
  },
});
