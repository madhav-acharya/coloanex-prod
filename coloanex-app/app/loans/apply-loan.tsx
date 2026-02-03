import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Slider from "@react-native-community/slider";
import { Input, Button, PickerInput, useToast } from "@/components/ui";
import { Colors } from "@/constants/theme";
import { loansApi, lendersApi } from "@/api";
import { formatCurrency } from "@/utils/currency";
import { uploadToCloudinary } from "@/utils/upload";

const COLLATERAL_TYPE_OPTIONS = [
  { label: "Property/Land", value: "Property" },
  { label: "Vehicle", value: "Vehicle" },
  { label: "Gold", value: "Gold" },
  { label: "Machinery", value: "Machinery" },
  { label: "Stock/Inventory", value: "Stock" },
  { label: "Other", value: "Other" },
];

const LOAN_PURPOSE_OPTIONS = [
  { label: "Business Expansion", value: "Business Expansion" },
  { label: "Home Renovation", value: "Home Renovation" },
  { label: "Education", value: "Education" },
  { label: "Medical Emergency", value: "Medical Emergency" },
  { label: "Vehicle Purchase", value: "Vehicle Purchase" },
  { label: "Debt Consolidation", value: "Debt Consolidation" },
  { label: "Working Capital", value: "Working Capital" },
  { label: "Other", value: "Other" },
];

export default function LoanApplicationScreen() {
  const { lenderId } = useLocalSearchParams();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [lender, setLender] = useState<any>(null);
  const [loanAmount, setLoanAmount] = useState(50000);
  const [loanPurpose, setLoanPurpose] = useState("");
  const [collateralType, setCollateralType] = useState("");
  const [collateralDescription, setCollateralDescription] = useState("");
  const [collateralValue, setCollateralValue] = useState("");
  const [collateralImage, setCollateralImage] = useState<string>("");
  const [termMonths, setTermMonths] = useState(12);

  // Form validation for each step
  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 1:
        return loanAmount > 0;
      case 2:
        return loanPurpose !== "";
      case 3:
        return (
          collateralType !== "" &&
          collateralDescription.trim() !== "" &&
          collateralValue !== "" &&
          collateralImage !== ""
        );
      case 4:
        return true;
      default:
        return false;
    }
  }, [
    currentStep,
    loanAmount,
    loanPurpose,
    collateralType,
    collateralDescription,
    collateralValue,
    collateralImage,
  ]);

  useEffect(() => {
    loadLender();
  }, [lenderId]);

  const loadLender = async () => {
    try {
      const data = await lendersApi.getById(lenderId as string);
      setLender(data);
      setLoanAmount(data.minAmount || 50000);
    } catch (error) {
      showToast("Failed to load lender information", "error");
      router.back();
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images" as any,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadingImage(true);
      try {
        const uploaded = await uploadToCloudinary(
          result.assets[0].uri,
          "collateral.jpg",
        );
        setCollateralImage(uploaded.url);
        showToast("Image uploaded successfully", "success");
      } catch (error: any) {
        showToast(error.message || "Failed to upload image", "error");
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 2:
        if (!loanPurpose) {
          showToast("Please select a loan purpose", "error");
          return false;
        }
        return true;

      case 3:
        if (!collateralType || !collateralDescription || !collateralValue) {
          showToast("Please fill all collateral fields", "error");
          return false;
        }
        if (!collateralImage) {
          showToast("Please upload collateral image", "error");
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const loanData = {
        tenantId: lenderId as string,
        requestedAmount: parseFloat(loanAmount.toString()) || 0,
        purpose: loanPurpose || "",
        collateralDetails: {
          type: collateralType || "",
          description: collateralDescription || "",
          value: parseFloat(collateralValue) || 0,
          imageUrl: collateralImage || "",
        },
        requestedTermMonths: parseInt(termMonths.toString()) || 1,
      };

      await loansApi.applyForLoan(loanData);
      showToast("Loan application submitted successfully", "success");
      router.replace(`/lenders/lender-details?id=${lenderId}` as any);
    } catch (error: any) {
      showToast(error.message || "Failed to submit loan application", "error");
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

  const interestRate = lender?.interestRate || 12;
  const monthlyPayment =
    (((loanAmount * interestRate) / 100 / 12) *
      Math.pow(1 + interestRate / 100 / 12, termMonths)) /
    (Math.pow(1 + interestRate / 100 / 12, termMonths) - 1);
  const totalAmount = monthlyPayment * termMonths;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apply for Loan</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map((step) => (
          <View key={step} style={styles.progressStepContainer}>
            <View
              style={[
                styles.progressStep,
                currentStep >= step && styles.progressStepActive,
              ]}
            >
              {currentStep > step ? (
                <Ionicons name="checkmark" size={16} color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.progressStepText,
                    currentStep >= step && styles.progressStepTextActive,
                  ]}
                >
                  {step}
                </Text>
              )}
            </View>
            {step < 4 && (
              <View
                style={[
                  styles.progressLine,
                  currentStep > step && styles.progressLineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.lenderInfo}>
          <Text style={styles.lenderName}>{lender.name}</Text>
          <Text style={styles.lenderContact}>{lender.contactEmail}</Text>
        </View>

        {/* Step 1: Loan Amount & Term */}
        {currentStep === 1 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Loan Amount</Text>
              <Text style={styles.amount}>{formatCurrency(loanAmount)}</Text>
              <Slider
                style={styles.slider}
                minimumValue={10000}
                maximumValue={500000}
                step={5000}
                value={loanAmount}
                onValueChange={setLoanAmount}
                minimumTrackTintColor={Colors.primary}
                maximumTrackTintColor={Colors.border}
                thumbTintColor={Colors.primary}
              />
              <View style={styles.range}>
                <Text style={styles.rangeText}>{formatCurrency(10000)}</Text>
                <Text style={styles.rangeText}>{formatCurrency(500000)}</Text>
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
          </>
        )}

        {/* Step 2: Loan Purpose */}
        {currentStep === 2 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Loan Purpose</Text>
            <PickerInput
              label="Purpose"
              value={loanPurpose}
              onChange={setLoanPurpose}
              options={LOAN_PURPOSE_OPTIONS}
              required
              placeholder="Select loan purpose"
            />
          </View>
        )}

        {/* Step 3: Collateral Information */}
        {currentStep === 3 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Collateral Information</Text>

            <PickerInput
              label="Collateral Type"
              value={collateralType}
              onChange={setCollateralType}
              options={COLLATERAL_TYPE_OPTIONS}
              required
              placeholder="Select collateral type"
            />

            <Text style={styles.label}>
              Description <Text style={styles.required}>*</Text>
            </Text>
            <Input
              value={collateralDescription}
              onChangeText={setCollateralDescription}
              placeholder="Describe your collateral"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>
              Estimated Value (NPR) <Text style={styles.required}>*</Text>
            </Text>
            <Input
              value={collateralValue}
              onChangeText={setCollateralValue}
              placeholder="Enter estimated value"
              keyboardType="numeric"
            />

            <Text style={styles.label}>
              Collateral Image <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={pickImage}
              disabled={uploadingImage}
            >
              {collateralImage ? (
                <Image
                  source={{ uri: collateralImage }}
                  style={styles.uploadedImage}
                />
              ) : uploadingImage ? (
                <>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.uploadText}>Uploading...</Text>
                </>
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
        )}

        {/* Step 4: Summary */}
        {currentStep === 4 && (
          <>
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Application Summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Lender</Text>
                <Text style={styles.summaryValue}>{lender.name}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Loan Amount</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(loanAmount)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Term</Text>
                <Text style={styles.summaryValue}>{termMonths} months</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Purpose</Text>
                <Text style={styles.summaryValue}>{loanPurpose}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Collateral Type</Text>
                <Text style={styles.summaryValue}>{collateralType}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Collateral Value</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(parseFloat(collateralValue || "0"))}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Monthly Payment</Text>
                <Text style={[styles.summaryValue, styles.highlight]}>
                  {formatCurrency(monthlyPayment)}
                </Text>
              </View>

              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Repayment</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(totalAmount)}
                </Text>
              </View>
            </View>

            {collateralImage && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Collateral Image</Text>
                <Image
                  source={{ uri: collateralImage }}
                  style={styles.previewImage}
                />
              </View>
            )}
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={styles.footer}>
        {currentStep < 4 ? (
          <Button title="Next" onPress={handleNext} disabled={!isStepValid} />
        ) : (
          <Button
            title={loading ? "Submitting..." : "Submit Application"}
            onPress={handleSubmit}
            disabled={loading}
          />
        )}
        {loading && (
          <ActivityIndicator
            size="small"
            color={Colors.primary}
            style={{ marginTop: 10 }}
          />
        )}
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
    alignItems: "center",
    justifyContent: "center",
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
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#fff",
  },
  progressStepContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  progressStepActive: {
    backgroundColor: Colors.primary,
  },
  progressStepText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  progressStepTextActive: {
    color: "#fff",
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: Colors.primary,
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
  },
  lenderName: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  lenderContact: {
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
  required: {
    color: Colors.error,
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
  previewImage: {
    width: "100%",
    height: 250,
    borderRadius: 8,
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
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
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
