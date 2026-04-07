import React from "react";
import {
  View,
  Text,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

const { width } = Dimensions.get("window");

interface BlockchainProcessingModalProps {
  visible: boolean;
  message?: string;
  currentStep?: "blockchain" | "database" | "complete";
  onClose?: () => void;
}

export const BlockchainProcessingModal: React.FC<
  BlockchainProcessingModalProps
> = ({ 
  visible, 
  message = "Processing blockchain transaction...", 
  currentStep = "blockchain" 
}) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${colors.primary}20` },
            ]}
          >
            <Ionicons name="cube-outline" size={40} color={colors.primary} />
          </View>

          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loader}
          />

          <Text style={[styles.title, { color: colors.text }]}>
            Processing Transaction
          </Text>

          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>

          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              {currentStep === "blockchain" ? (
                <View
                  style={[styles.infoDot, { backgroundColor: colors.success }]}
                />
              ) : (
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              )}
              <Text style={[
                styles.infoText, 
                { 
                  color: currentStep === "blockchain" ? colors.success : colors.textSecondary,
                  fontWeight: currentStep === "blockchain" ? "600" : "400"
                }
              ]}>
                {currentStep === "blockchain" ? "Recording on blockchain..." : "Recorded on blockchain ✓"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              {currentStep === "database" ? (
                <View
                  style={[styles.infoDot, { backgroundColor: colors.primary }]}
                />
              ) : currentStep === "complete" ? (
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              ) : (
                <View
                  style={[styles.infoDot, { backgroundColor: colors.border }]}
                />
              )}
              <Text style={[
                styles.infoText, 
                { 
                  color: currentStep === "database" ? colors.primary :
                         currentStep === "complete" ? colors.textSecondary : colors.border,
                  fontWeight: currentStep === "database" ? "600" : "400"
                }
              ]}>
                {currentStep === "database" ? "Updating database..." :
                 currentStep === "complete" ? "Database updated ✓" : "Updating database"}
              </Text>
            </View>
          </View>

          <Text style={[styles.waitText, { color: colors.textSecondary }]}>
            Please wait, this may take a few seconds...
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: width - 60,
    maxWidth: 400,
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  loader: {
    marginVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  infoContainer: {
    width: "100%",
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  infoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  infoText: {
    fontSize: 13,
  },
  waitText: {
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
  },
});
