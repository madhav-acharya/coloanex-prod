import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Slider from "@react-native-community/slider";
import {
  Input,
  Button,
  PickerInput,
  useToast,
  AppHeader,
  BlockchainProcessingModal,
} from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { loansApi, lendersApi } from "@/api";
import { formatCurrency } from "@/utils/currency";
import { CurrencyIcon } from "@/components/ui";
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
  const { colors } = useTheme();
  const styles = createStyles(colors);
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
  const [previousLoan, setPreviousLoan] = useState<any>(null);
  const [prefillModal, setPrefillModal] = useState(false);

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
    if (lenderId) {
      loadLender();
    }
  }, [lenderId]);

  const loadLender = async () => {
    try {
      const lenderData = await lendersApi.getById(lenderId as string);
      setLender(lenderData);
      setLoanAmount(lenderData.minAmount || 50000);
      const latest = await loansApi.getMyLatest().catch(() => null);
      if (latest) {
        setPreviousLoan(latest);
        setPrefillModal(true);
      }
    } catch (error) {
      showToast("Failed to load lender information", "error");
      router.back();
    }
  };

  const prefillFromLoan = (loan: any) => {
    if (!loan) return;
    if (loan.purpose) setLoanPurpose(loan.purpose);
    const collateral = loan.collateralDetails || {};
    if (collateral.type) setCollateralType(collateral.type);
    if (collateral.description)
      setCollateralDescription(collateral.description);
    if (collateral.value) setCollateralValue(String(collateral.value));
    if (collateral.imageUrl) setCollateralImage(collateral.imageUrl);
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
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(`/lenders/lender-details?id=${lenderId}` as any);
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const loanData: any = {
        tenantId: lenderId as string,
        requestedAmount: Number(loanAmount),
        purpose: loanPurpose,
        collateralDetails: {
          type: collateralType,
          description: collateralDescription,
          value: Number(collateralValue),
          imageUrl: collateralImage,
        },
        requestedTermMonths: Number(termMonths),
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
      <View
        style={[
          styles.container,
          styles.loadingContainer,
          { backgroundColor: colors.surface },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
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
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <AppHeader
        title="Apply for Loan"
        onBackPress={handleBack}
        showThemeToggle={false}
      />

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map((step) => (
          <View key={step} style={styles.progressStepContainer}>
            <View
              style={[
                styles.progressStep,
                {
                  backgroundColor:
                    currentStep >= step ? colors.primary : colors.border,
                },
              ]}
            >
              {currentStep > step ? (
                <Ionicons name="checkmark" size={16} color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.progressStepText,
                    {
                      color:
                        currentStep >= step ? "#fff" : colors.textSecondary,
                    },
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
                  {
                    backgroundColor:
                      currentStep > step ? colors.primary : colors.border,
                  },
                ]}
              />
            )}
          </View>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.lenderInfo}>
          <Text style={[styles.lenderName, { color: colors.text }]}>
            {lender.name}
          </Text>
          <Text style={[styles.lenderContact, { color: colors.textSecondary }]}>
            {lender.contactEmail}
          </Text>
        </View>

        {/* Step 1: Loan Amount & Term */}
        {currentStep === 1 && (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Loan Amount
              </Text>
              <Text style={[styles.amount, { color: colors.primary }]}>
                {formatCurrency(loanAmount)}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={10000}
                maximumValue={500000}
                step={5000}
                value={loanAmount}
                onValueChange={setLoanAmount}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
              <View style={styles.range}>
                <Text
                  style={[styles.rangeText, { color: colors.textSecondary }]}
                >
                  {formatCurrency(10000)}
                </Text>
                <Text
                  style={[styles.rangeText, { color: colors.textSecondary }]}
                >
                  {formatCurrency(500000)}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Loan Term (Months)
              </Text>
              <Text style={[styles.amount, { color: colors.primary }]}>
                {termMonths} months
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={6}
                maximumValue={60}
                step={6}
                value={termMonths}
                onValueChange={setTermMonths}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
              <View style={styles.range}>
                <Text
                  style={[styles.rangeText, { color: colors.textSecondary }]}
                >
                  6 months
                </Text>
                <Text
                  style={[styles.rangeText, { color: colors.textSecondary }]}
                >
                  60 months
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Step 2: Loan Purpose */}
        {currentStep === 2 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Loan Purpose
            </Text>
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

        {currentStep === 3 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Collateral Information
            </Text>

            <PickerInput
              label="Collateral Type"
              value={collateralType}
              onChange={setCollateralType}
              options={COLLATERAL_TYPE_OPTIONS}
              required
              placeholder="Select collateral type"
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Description{" "}
              <Text style={[styles.required, { color: colors.error }]}>*</Text>
            </Text>
            <Input
              value={collateralDescription}
              onChangeText={setCollateralDescription}
              placeholder="Describe your collateral"
              multiline
              numberOfLines={3}
            />

            <View
              style={[
                styles.label,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                  marginTop: 12,
                },
              ]}
            >
              <Text
                style={[
                  { fontSize: 14, fontWeight: "600" },
                  { color: colors.text },
                ]}
              >
                Estimated Value{" "}
              </Text>
              <CurrencyIcon size={16} color={colors.text} />
              <Text
                style={[
                  styles.required,
                  { color: colors.error, marginLeft: 4 },
                ]}
              >
                *
              </Text>
            </View>
            <Input
              value={collateralValue}
              onChangeText={setCollateralValue}
              placeholder="Enter estimated value"
              keyboardType="numeric"
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Collateral Image{" "}
              <Text style={[styles.required, { color: colors.error }]}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.uploadButton, { borderColor: colors.border }]}
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
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text
                    style={[styles.uploadText, { color: colors.textSecondary }]}
                  >
                    Uploading...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={32}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.uploadText, { color: colors.textSecondary }]}
                  >
                    Upload Collateral Image
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Step 4: Summary */}
        {currentStep === 4 && (
          <>
            <View style={styles.summarySection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Application Summary
              </Text>

              <View
                style={[
                  styles.summaryRow,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Text
                  style={[styles.summaryLabel, { color: colors.textSecondary }]}
                >
                  Lender
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {lender.name}
                </Text>
              </View>

              <View
                style={[
                  styles.summaryRow,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Text
                  style={[styles.summaryLabel, { color: colors.textSecondary }]}
                >
                  Loan Amount
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {formatCurrency(loanAmount)}
                </Text>
              </View>

              <View
                style={[
                  styles.summaryRow,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Text
                  style={[styles.summaryLabel, { color: colors.textSecondary }]}
                >
                  Term
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {termMonths} months
                </Text>
              </View>

              <View
                style={[
                  styles.summaryRow,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Text
                  style={[styles.summaryLabel, { color: colors.textSecondary }]}
                >
                  Purpose
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {loanPurpose}
                </Text>
              </View>

              <View
                style={[
                  styles.summaryRow,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Text
                  style={[styles.summaryLabel, { color: colors.textSecondary }]}
                >
                  Collateral Type
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {collateralType}
                </Text>
              </View>

              <View
                style={[
                  styles.summaryRow,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Text
                  style={[styles.summaryLabel, { color: colors.textSecondary }]}
                >
                  Collateral Value
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {formatCurrency(parseFloat(collateralValue || "0"))}
                </Text>
              </View>

              <View
                style={[
                  styles.summaryRow,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Text
                  style={[styles.summaryLabel, { color: colors.textSecondary }]}
                >
                  Monthly Payment
                </Text>
                <Text
                  style={[
                    styles.summaryValue,
                    styles.highlight,
                    { color: colors.primary },
                  ]}
                >
                  {formatCurrency(monthlyPayment)}
                </Text>
              </View>

              <View
                style={[
                  styles.summaryRow,
                  styles.totalRow,
                  { borderTopColor: colors.border },
                ]}
              >
                <Text style={[styles.totalLabel, { color: colors.text }]}>
                  Total Repayment
                </Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>
                  {formatCurrency(totalAmount)}
                </Text>
              </View>
            </View>

            {collateralImage && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Collateral Image
                </Text>
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

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
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
            color={colors.primary}
            style={{ marginTop: 10 }}
          />
        )}
      </View>

      <Modal
        visible={prefillModal}
        transparent
        animationType="fade"
        onRequestClose={() => setPrefillModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Ionicons
              name="document-outline"
              size={40}
              color={colors.primary}
              style={{ marginBottom: 12 }}
            />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Pre-fill from Previous Application?
            </Text>
            <Text style={[styles.modalBody, { color: colors.textSecondary }]}>
              We found a previous loan application. Would you like to pre-fill
              this form with your previous details?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: colors.border }]}
                onPress={() => setPrefillModal(false)}
              >
                <Text
                  style={[styles.modalBtnText, { color: colors.textSecondary }]}
                >
                  Start Fresh
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  styles.modalBtnPrimary,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  setPrefillModal(false);
                  prefillFromLoan(previousLoan);
                }}
              >
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>
                  Yes, Pre-fill
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BlockchainProcessingModal
        visible={loading}
        message="Recording your loan application on the blockchain and updating the database. Please wait..."
      />
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      alignItems: "center",
      justifyContent: "center",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    modalCard: {
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
      width: "100%",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 8,
      textAlign: "center",
    },
    modalBody: {
      fontSize: 14,
      textAlign: "center",
      marginBottom: 24,
      lineHeight: 20,
    },
    modalButtons: {
      flexDirection: "row",
      gap: 12,
      width: "100%",
    },
    modalBtn: {
      flex: 1,
      padding: 14,
      borderRadius: 10,
      alignItems: "center",
      borderWidth: 1,
    },
    modalBtnPrimary: {
      borderWidth: 0,
    },
    modalBtnText: {
      fontSize: 15,
      fontWeight: "600",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 20,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
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
    },
    progressContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 20,
      backgroundColor: colors.card,
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
      alignItems: "center",
      justifyContent: "center",
    },
    progressStepActive: {},
    progressStepText: {
      fontSize: 14,
      fontWeight: "600",
    },
    progressStepTextActive: {
      color: "#fff",
    },
    progressLine: {
      flex: 1,
      height: 2,
      marginHorizontal: 4,
    },
    progressLineActive: {},
    content: {
      flex: 1,
      padding: 20,
    },
    lenderInfo: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
    },
    lenderName: {
      fontSize: 20,
      fontWeight: "600",
      marginBottom: 4,
    },
    lenderContact: {
      fontSize: 14,
    },
    section: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 12,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 8,
      marginTop: 12,
    },
    required: {},
    amount: {
      fontSize: 24,
      fontWeight: "700",
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
    },
    uploadButton: {
      borderWidth: 2,
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
      marginTop: 8,
    },
    previewImage: {
      width: "100%",
      height: 250,
      borderRadius: 8,
    },
    summarySection: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    summaryLabel: {
      fontSize: 14,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: "600",
      textAlign: "right",
      flex: 1,
      marginLeft: 12,
    },
    highlight: {},
    totalRow: {
      borderBottomWidth: 0,
      paddingTop: 16,
      marginTop: 8,
      borderTopWidth: 2,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: "600",
    },
    totalValue: {
      fontSize: 18,
      fontWeight: "700",
    },
    footer: {
      padding: 20,
      backgroundColor: colors.background,
      borderTopWidth: 1,
    },
  });
