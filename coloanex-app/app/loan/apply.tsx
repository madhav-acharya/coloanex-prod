import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Slider from "@react-native-community/slider";
import { Input, Button } from "@/components/ui";
import { Colors } from "@/constants/theme";
import { loansApi, lendersApi } from "@/api";
import { formatCurrency } from "@/utils/currency";

export default function LoanApplicationScreen() {
  const { lenderId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [lender, setLender] = useState<any>(null);
  const [loanAmount, setLoanAmount] = useState(50000);
  const [loanPurpose, setLoanPurpose] = useState("");
  const [collateralType, setCollateralType] = useState("");
  const [collateralDescription, setCollateralDescription] = useState("");
  const [collateralValue, setCollateralValue] = useState("");
  const [collateralImage, setCollateralImage] = useState<any>(null);
  const [termMonths, setTermMonths] = useState(12);

  useEffect(() => {
    loadLender();
  }, [lenderId]);

  const loadLender = async () => {
    try {
      const data = await lendersApi.getById(lenderId as string);
      setLender(data);
      setLoanAmount(data.minAmount || 50000);
    } catch (error) {
      Alert.alert("Error", "Failed to load lender information");
      router.back();
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCollateralImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (
      !loanPurpose ||
      !collateralType ||
      !collateralDescription ||
      !collateralValue
    ) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    if (!collateralImage) {
      Alert.alert("Error", "Please upload collateral image");
      return;
    }

    setLoading(true);
    try {
      const loanData = new FormData();
      loanData.append("tenantId", lenderId as string);
      loanData.append("expectedLoanAmount", loanAmount.toString());
      loanData.append("loanPurpose", loanPurpose);
      loanData.append("collateralType", collateralType);
      loanData.append("collateralDescription", collateralDescription);
      loanData.append("collateralValue", collateralValue);
      loanData.append("termMonths", termMonths.toString());

      if (collateralImage) {
        loanData.append("collateralImage", {
          uri: collateralImage.uri,
          name: "collateral.jpg",
          type: "image/jpeg",
        } as any);
      }

      await loansApi.applyForLoan(loanData);
      Alert.alert("Success", "Loan application submitted successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to submit loan application"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!lender) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const monthlyPayment =
    (((loanAmount * (lender.interestRate || 12)) / 100 / 12) *
      Math.pow(1 + (lender.interestRate || 12) / 100 / 12, termMonths)) /
    (Math.pow(1 + (lender.interestRate || 12) / 100 / 12, termMonths) - 1);
  const totalAmount = monthlyPayment * termMonths;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apply for Loan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.lenderInfo}>
          <Text style={styles.lenderName}>{lender.name}</Text>
          <Text style={styles.interestRate}>
            {lender.interestRate || 12}% Interest Rate
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loan Amount</Text>
          <Text style={styles.amount}>{formatCurrency(loanAmount)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={lender.minAmount || 10000}
            maximumValue={lender.maxAmount || 500000}
            step={5000}
            value={loanAmount}
            onValueChange={setLoanAmount}
            minimumTrackTintColor={Colors.primary}
            maximumTrackTintColor={Colors.border}
            thumbTintColor={Colors.primary}
          />
          <View style={styles.range}>
            <Text style={styles.rangeText}>
              {formatCurrency(lender.minAmount || 10000)}
            </Text>
            <Text style={styles.rangeText}>
              {formatCurrency(lender.maxAmount || 500000)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loan Term (Months)</Text>
          <Text style={styles.amount}>{termMonths} months</Text>
          <Slider
            style={styles.slider}
            minimumValue={6}
            maximumValue={60}
            step={6}
            value={termMonths}
            onValueChange={setTermMonths}
            minimumTrackTintColor={Colors.primary}
            maximumTrackTintColor={Colors.border}
            thumbTintColor={Colors.primary}
          />
          <View style={styles.range}>
            <Text style={styles.rangeText}>6 months</Text>
            <Text style={styles.rangeText}>60 months</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Loan Purpose *</Text>
          <Input
            value={loanPurpose}
            onChangeText={setLoanPurpose}
            placeholder="e.g., Business expansion, Home renovation"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collateral Information</Text>
          <Text style={styles.label}>Collateral Type *</Text>
          <Input
            value={collateralType}
            onChangeText={setCollateralType}
            placeholder="e.g., Property, Vehicle, Gold"
          />

          <Text style={styles.label}>Description *</Text>
          <Input
            value={collateralDescription}
            onChangeText={setCollateralDescription}
            placeholder="Describe your collateral"
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Estimated Value (NPR) *</Text>
          <Input
            value={collateralValue}
            onChangeText={setCollateralValue}
            placeholder="Enter estimated value"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Collateral Image *</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            {collateralImage ? (
              <Image
                source={{ uri: collateralImage.uri }}
                style={styles.uploadedImage}
              />
            ) : (
              <>
                <Ionicons
                  name="cloud-upload-outline"
                  size={32}
                  color={Colors.primary}
                />
                <Text style={styles.uploadText}>Upload Collateral Image</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Loan Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Loan Amount</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(loanAmount)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Interest Rate</Text>
            <Text style={styles.summaryValue}>
              {lender.interestRate || 12}%
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Term</Text>
            <Text style={styles.summaryValue}>{termMonths} months</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Monthly Payment</Text>
            <Text style={[styles.summaryValue, styles.highlight]}>
              {formatCurrency(monthlyPayment)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Repayment</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={loading ? "Submitting..." : "Submit Application"}
          onPress={handleSubmit}
          disabled={loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  lenderInfo: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  lenderName: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  interestRate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  amount: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 16,
    textAlign: "center",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  range: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  rangeText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  uploadedImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  uploadText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  summarySection: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  highlight: {
    color: Colors.primary,
  },
  totalRow: {
    borderBottomWidth: 0,
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
  },
  footer: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
