import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  Input,
  Button,
  DatePickerInput,
  PickerInput,
  useToast,
  AppHeader,
  CurrencyIcon,
  BlockchainProcessingModal,
  SubscriptionBlockingOverlay,
  GasModeWarningBanner,
  GasModeBlockingOverlay,
} from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { kycApi } from "@/api";
import { uploadToCloudinary } from "@/utils/upload";
import { ensureActiveSubscription } from "@/utils/subscriptionGuard";

const GENDER_OPTIONS = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];

const MARITAL_STATUS_OPTIONS = [
  { label: "Single", value: "Single" },
  { label: "Married", value: "Married" },
  { label: "Divorced", value: "Divorced" },
  { label: "Widowed", value: "Widowed" },
];

const DOCUMENT_TYPE_OPTIONS = [
  {
    label: "Citizenship",
    value: "CITIZENSHIP",
    numberLabel: "Citizenship Number",
  },
  { label: "Passport", value: "PASSPORT", numberLabel: "Passport Number" },
  {
    label: "Driving License",
    value: "DRIVING_LICENSE",
    numberLabel: "License Number",
  },
  { label: "PAN", value: "PAN", numberLabel: "PAN Number" },
];

type DocumentInfo = {
  documentNumber: string;
  issueDate: Date | null;
  expiryDate: Date | null;
  issueDistrict: string;
  frontImage: string;
  backImage: string;
};

export default function KYCVerificationScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const params = useLocalSearchParams<{ tenantId: string }>();
  const tenantId = Array.isArray(params.tenantId)
    ? params.tenantId[0]
    : params.tenantId;
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [prefillModal, setPrefillModal] = useState(false);
  const [blockchainProcessing, setBlockchainProcessing] = useState(false);
  const [blockchainStep, setBlockchainStep] = useState<
    "blockchain" | "database" | "complete"
  >("blockchain");

  const [personalInfo, setPersonalInfo] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: null as Date | null,
    gender: "",
    maritalStatus: "",
    fatherName: "",
    motherName: "",
    grandfatherName: "",
  });

  const [address, setAddress] = useState({
    province: "",
    district: "",
    municipality: "",
    ward: "",
    tole: "",
  });

  const [financialInfo, setFinancialInfo] = useState({
    occupation: "",
    monthlyIncome: "",
    bankName: "",
    bankAccountNumber: "",
    bankBranch: "",
  });

  const [selectedDocumentTypes, setSelectedDocumentTypes] = useState<string[]>(
    [],
  );

  const [documentDetails, setDocumentDetails] = useState<
    Record<string, DocumentInfo>
  >({});

  const [passportPhoto, setPassportPhoto] = useState("");
  const [selfie, setSelfie] = useState("");

  useEffect(() => {
    if (!tenantId) {
      showToast("Invalid request. Please select a lender first.", "error");
      router.back();
      return;
    }
    kycApi
      .getStatus(tenantId)
      .then(async (status: any) => {
        if (status?.hasKyc) {
          setPrefillModal(true);
        } else {
          try {
            const globalStatus = await kycApi.getStatus();
            if (globalStatus?.hasKyc) {
              setPrefillModal(true);
            }
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => {});
  }, [showToast, tenantId]);

  const prefillFromKyc = async () => {
    try {
      const kyc = await kycApi.getMyLatest();
      if (!kyc) return;
      const pd = kyc.personalDetails || {};
      setPersonalInfo({
        firstName: pd.firstName || "",
        middleName: pd.middleName || "",
        lastName: pd.lastName || "",
        dateOfBirth: kyc.dateOfBirth ? new Date(kyc.dateOfBirth) : null,
        gender: pd.gender || "",
        maritalStatus: pd.maritalStatus || "",
        fatherName: pd.fatherName || "",
        motherName: pd.motherName || "",
        grandfatherName: pd.grandfatherName || "",
      });
      const pa = kyc.permanentAddress || {};
      setAddress({
        province: pa.province || "",
        district: pa.district || "",
        municipality: pa.municipality || "",
        ward: pa.ward || "",
        tole: pa.tole || "",
      });
      const bd = kyc.bankDetails || {};
      setFinancialInfo({
        occupation: kyc.occupation || "",
        monthlyIncome: kyc.monthlyIncome ? String(kyc.monthlyIncome) : "",
        bankName: bd.bankName || "",
        bankAccountNumber: bd.bankAccountNumber || "",
        bankBranch: bd.bankBranch || "",
      });
      if (kyc.photoUrl) setPassportPhoto(kyc.photoUrl);
      if (kyc.files && Array.isArray(kyc.files)) {
        const selfieFile = kyc.files.find((f: any) => f.fileType === "SELFIE");
        if (selfieFile) setSelfie(selfieFile.fileUrl);
        const docTypes: string[] = [];
        const details: Record<string, DocumentInfo> = {};
        kyc.files.forEach((f: any) => {
          const meta = f.documentMetadata || {};
          if (!meta.documentType) return;
          const dt: string = meta.documentType;
          if (!docTypes.includes(dt)) docTypes.push(dt);
          if (!details[dt]) {
            details[dt] = {
              documentNumber: meta.documentNumber || "",
              issueDate: meta.issueDate ? new Date(meta.issueDate) : null,
              expiryDate: meta.expiryDate ? new Date(meta.expiryDate) : null,
              issueDistrict: meta.issueDistrict || "",
              frontImage: "",
              backImage: "",
            };
          }
          if (
            f.fileType.endsWith("_FRONT") ||
            f.fileType === "PASSPORT" ||
            f.fileType === "PAN" ||
            f.fileType === "LICENSE_FRONT" ||
            f.fileType === "CITIZENSHIP_FRONT" ||
            f.fileType === "SUPPORTING_DOCUMENT"
          ) {
            if (!details[dt].frontImage) details[dt].frontImage = f.fileUrl;
          } else if (f.fileType.endsWith("_BACK")) {
            details[dt].backImage = f.fileUrl;
          }
        });
        setSelectedDocumentTypes(docTypes);
        setDocumentDetails(details);
      }
    } catch {
      showToast("Could not load previous KYC data.", "error");
    }
  };

  const getDocumentDetail = useCallback(
    (docType: string): DocumentInfo => {
      return (
        documentDetails[docType] || {
          documentNumber: "",
          issueDate: null,
          expiryDate: null,
          issueDistrict: "",
          frontImage: "",
          backImage: "",
        }
      );
    },
    [documentDetails],
  );

  const updateDocumentDetail = (
    docType: string,
    field: keyof DocumentInfo,
    value: any,
  ) => {
    setDocumentDetails((prev) => ({
      ...prev,
      [docType]: {
        ...getDocumentDetail(docType),
        [field]: value,
      },
    }));
  };

  const pickImage = async (
    docType: string,
    side: "front" | "back" | "passport" | "selfie",
  ) => {
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
          `${side}-${Date.now()}.jpg`,
        );

        if (side === "passport") {
          setPassportPhoto(uploaded.url);
        } else if (side === "selfie") {
          setSelfie(uploaded.url);
        } else {
          updateDocumentDetail(docType, `${side}Image`, uploaded.url);
        }
        showToast("Image uploaded successfully", "success");
      } catch (error: any) {
        showToast(error.message || "Failed to upload image", "error");
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const takeSelfie = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadingImage(true);
      try {
        const uploaded = await uploadToCloudinary(
          result.assets[0].uri,
          "selfie.jpg",
        );
        setSelfie(uploaded.url);
        showToast("Selfie uploaded successfully", "success");
      } catch (error: any) {
        showToast(error.message || "Failed to upload selfie", "error");
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 1:
        return (
          tenantId !== undefined &&
          personalInfo.firstName.trim() !== "" &&
          personalInfo.lastName.trim() !== "" &&
          personalInfo.dateOfBirth !== null
        );
      case 2:
        return (
          address.province.trim() !== "" &&
          address.district.trim() !== "" &&
          address.municipality.trim() !== "" &&
          address.ward.trim() !== ""
        );
      case 3:
        return (
          financialInfo.occupation.trim() !== "" &&
          financialInfo.monthlyIncome.trim() !== ""
        );
      case 4:
        return (
          selectedDocumentTypes.length > 0 &&
          selectedDocumentTypes.every((docType) => {
            const detail = getDocumentDetail(docType);
            return (
              detail.documentNumber.trim() !== "" &&
              detail.frontImage !== "" &&
              (docType === "PAN" || detail.backImage !== "")
            );
          }) &&
          passportPhoto !== "" &&
          selfie !== ""
        );
      default:
        return false;
    }
  }, [
    currentStep,
    tenantId,
    personalInfo,
    address,
    financialInfo,
    selectedDocumentTypes,
    getDocumentDetail,
    passportPhoto,
    selfie,
  ]);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!tenantId) {
          showToast("Invalid request. Tenant information missing.", "error");
          return false;
        }
        if (
          !personalInfo.firstName ||
          !personalInfo.lastName ||
          !personalInfo.dateOfBirth
        ) {
          showToast(
            "Please fill all required personal information fields",
            "error",
          );
          return false;
        }
        return true;

      case 2:
        if (
          !address.province ||
          !address.district ||
          !address.municipality ||
          !address.ward
        ) {
          showToast("Please fill all required address fields", "error");
          return false;
        }
        return true;

      case 3:
        if (!financialInfo.occupation || !financialInfo.monthlyIncome) {
          showToast(
            "Please fill all required financial information fields",
            "error",
          );
          return false;
        }
        return true;

      case 4:
        if (selectedDocumentTypes.length === 0) {
          showToast("Please select at least one document type", "error");
          return false;
        }

        const invalidDoc = selectedDocumentTypes.find((docType) => {
          const detail = getDocumentDetail(docType);
          if (!detail.documentNumber.trim()) return true;
          if (!detail.frontImage) return true;
          if (docType !== "PAN" && !detail.backImage) return true;
          return false;
        });

        if (invalidDoc) {
          const docLabel = DOCUMENT_TYPE_OPTIONS.find(
            (o) => o.value === invalidDoc,
          )?.label;
          showToast(
            `Please complete all required fields and upload images for ${docLabel}`,
            "error",
          );
          return false;
        }

        if (!passportPhoto) {
          showToast("Please upload your passport size photo", "error");
          return false;
        }

        if (!selfie) {
          showToast("Please upload a selfie with your document", "error");
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
        router.replace("/(tabs)/browse-lenders" as any);
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      return;
    }

    const hasSubscription = await ensureActiveSubscription(showToast);
    if (!hasSubscription) {
      return;
    }

    if (!tenantId) {
      showToast("Tenant ID is missing. Please try again.", "error");
      return;
    }

    setLoading(true);
    setBlockchainProcessing(true);
    setBlockchainStep("blockchain");
    try {
      const files: any[] = [];

      files.push({
        fileType: "SELFIE",
        fileUrl: selfie,
      });

      selectedDocumentTypes.forEach((docType) => {
        const detail = getDocumentDetail(docType);

        let frontFileType = "SUPPORTING_DOCUMENT";
        let backFileType = "SUPPORTING_DOCUMENT";

        if (docType === "CITIZENSHIP") {
          frontFileType = "CITIZENSHIP_FRONT";
          backFileType = "CITIZENSHIP_BACK";
        } else if (docType === "PASSPORT") {
          frontFileType = "PASSPORT";
        } else if (docType === "DRIVING_LICENSE") {
          frontFileType = "LICENSE_FRONT";
          backFileType = "LICENSE_BACK";
        } else if (docType === "PAN") {
          frontFileType = "PAN";
        }

        files.push({
          fileType: frontFileType,
          fileUrl: detail.frontImage,
          documentMetadata: {
            documentType: docType,
            documentNumber: detail.documentNumber,
            issueDate: detail.issueDate?.toISOString(),
            expiryDate: detail.expiryDate?.toISOString(),
            issueDistrict: detail.issueDistrict || undefined,
          },
        });

        if (detail.backImage) {
          files.push({
            fileType: backFileType,
            fileUrl: detail.backImage,
            documentMetadata: {
              documentType: docType,
              documentNumber: detail.documentNumber,
              issueDate: detail.issueDate?.toISOString(),
              expiryDate: detail.expiryDate?.toISOString(),
              issueDistrict: detail.issueDistrict || undefined,
            },
          });
        }
      });

      const fullName = [
        personalInfo.firstName,
        personalInfo.middleName,
        personalInfo.lastName,
      ]
        .filter(Boolean)
        .join(" ");

      const kycData = {
        tenantId: tenantId || "",
        fullName: fullName,
        dateOfBirth: personalInfo.dateOfBirth?.toISOString() || "",
        photoUrl: passportPhoto,
        personalDetails: {
          firstName: personalInfo.firstName || "",
          middleName: personalInfo.middleName || "",
          lastName: personalInfo.lastName || "",
          gender: personalInfo.gender || "",
          maritalStatus: personalInfo.maritalStatus || "",
          fatherName: personalInfo.fatherName || "",
          motherName: personalInfo.motherName || "",
          grandfatherName: personalInfo.grandfatherName || "",
        },
        permanentAddress: {
          province: address.province || "",
          district: address.district || "",
          municipality: address.municipality || "",
          ward: address.ward || "",
          tole: address.tole || "",
        },
        occupation: financialInfo.occupation || "",
        monthlyIncome: parseFloat(financialInfo.monthlyIncome) || 0,
        bankDetails: {
          bankName: financialInfo.bankName || "",
          bankAccountNumber: financialInfo.bankAccountNumber || "",
          bankBranch: financialInfo.bankBranch || "",
        },
        files,
      };

      setBlockchainStep("database");
      await kycApi.submit(kycData);

      setBlockchainStep("complete");
      await new Promise((resolve) => setTimeout(resolve, 600));

      setBlockchainProcessing(false);
      showToast(
        "KYC verification submitted successfully. We will review your information and notify you soon.",
        "success",
      );
      router.replace(`/lenders/lender-details?id=${tenantId}` as any);
    } catch (error: any) {
      setBlockchainProcessing(false);
      showToast(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit KYC verification",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <SubscriptionBlockingOverlay />
      <GasModeBlockingOverlay />
      <AppHeader
        title="KYC Verification"
        onBackPress={handleBack}
        showThemeToggle={false}
      />

      <GasModeWarningBanner />

      <View
        style={[styles.progressContainer, { backgroundColor: colors.card }]}
      >
        {[1, 2, 3, 4].map((step) => (
          <View
            key={step}
            style={[styles.progressStepContainer, step < 4 && { flex: 1 }]}
          >
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
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Step {currentStep} of 4 - Please provide accurate information.{" "}
          <Text style={[styles.required, { color: colors.error }]}>*</Text> =
          required
        </Text>

        {currentStep === 1 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Personal Information
            </Text>

            <Text style={[styles.label, { color: colors.text }]}>
              First Name{" "}
              <Text style={[styles.required, { color: colors.error }]}>*</Text>
            </Text>
            <Input
              value={personalInfo.firstName}
              onChangeText={(text) =>
                setPersonalInfo({ ...personalInfo, firstName: text })
              }
              placeholder="Enter your first name"
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Middle Name
            </Text>
            <Input
              value={personalInfo.middleName}
              onChangeText={(text) =>
                setPersonalInfo({ ...personalInfo, middleName: text })
              }
              placeholder="Enter your middle name"
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Last Name{" "}
              <Text style={[styles.required, { color: colors.error }]}>*</Text>
            </Text>
            <Input
              value={personalInfo.lastName}
              onChangeText={(text) =>
                setPersonalInfo({ ...personalInfo, lastName: text })
              }
              placeholder="Enter your last name"
            />

            <DatePickerInput
              label="Date of Birth"
              value={personalInfo.dateOfBirth}
              onChange={(date) =>
                setPersonalInfo({ ...personalInfo, dateOfBirth: date })
              }
              required
              maximumDate={new Date()}
              placeholder="Select your date of birth"
            />

            <PickerInput
              label="Gender"
              value={personalInfo.gender}
              onChange={(value) =>
                setPersonalInfo({ ...personalInfo, gender: value })
              }
              options={GENDER_OPTIONS}
              placeholder="Select your gender"
            />

            <PickerInput
              label="Marital Status"
              value={personalInfo.maritalStatus}
              onChange={(value) =>
                setPersonalInfo({ ...personalInfo, maritalStatus: value })
              }
              options={MARITAL_STATUS_OPTIONS}
              placeholder="Select marital status"
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Father&apos;s Name
            </Text>
            <Input
              value={personalInfo.fatherName}
              onChangeText={(text) =>
                setPersonalInfo({ ...personalInfo, fatherName: text })
              }
              placeholder="Enter father's name"
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Mother&apos;s Name
            </Text>
            <Input
              value={personalInfo.motherName}
              onChangeText={(text) =>
                setPersonalInfo({ ...personalInfo, motherName: text })
              }
              placeholder="Enter mother's name"
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Grandfather&apos;s Name
            </Text>
            <Input
              value={personalInfo.grandfatherName}
              onChangeText={(text) =>
                setPersonalInfo({ ...personalInfo, grandfatherName: text })
              }
              placeholder="Enter grandfather's name"
            />
          </View>
        )}

        {currentStep === 2 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Permanent Address
            </Text>

            <Text style={[styles.label, { color: colors.text }]}>
              Province{" "}
              <Text style={[styles.required, { color: colors.error }]}>*</Text>
            </Text>
            <Input
              value={address.province}
              onChangeText={(text) =>
                setAddress({ ...address, province: text })
              }
              placeholder="e.g., Bagmati"
            />

            <Text style={[styles.label, { color: colors.text }]}>
              District{" "}
              <Text style={[styles.required, { color: colors.error }]}>*</Text>
            </Text>
            <Input
              value={address.district}
              onChangeText={(text) =>
                setAddress({ ...address, district: text })
              }
              placeholder="e.g., Kathmandu"
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Municipality{" "}
              <Text style={[styles.required, { color: colors.error }]}>*</Text>
            </Text>
            <Input
              value={address.municipality}
              onChangeText={(text) =>
                setAddress({ ...address, municipality: text })
              }
              placeholder="Enter municipality"
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Ward Number{" "}
              <Text style={[styles.required, { color: colors.error }]}>*</Text>
            </Text>
            <Input
              value={address.ward}
              onChangeText={(text) => setAddress({ ...address, ward: text })}
              placeholder="Enter ward number"
              keyboardType="numeric"
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Tole/Street
            </Text>
            <Input
              value={address.tole}
              onChangeText={(text) => setAddress({ ...address, tole: text })}
              placeholder="Enter tole or street name"
            />
          </View>
        )}

        {currentStep === 3 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Financial Information
            </Text>

            <Text style={[styles.label, { color: colors.text }]}>
              Occupation{" "}
              <Text style={[styles.required, { color: colors.error }]}>*</Text>
            </Text>
            <Input
              value={financialInfo.occupation}
              onChangeText={(text) =>
                setFinancialInfo({ ...financialInfo, occupation: text })
              }
              placeholder="Your occupation"
            />

            <View
              style={[
                styles.label,
                { flexDirection: "row", alignItems: "center" },
              ]}
            >
              <Text
                style={[
                  { fontSize: 14, fontWeight: "600" },
                  { color: colors.text },
                ]}
              >
                Monthly Income{" "}
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
              value={financialInfo.monthlyIncome}
              onChangeText={(text) =>
                setFinancialInfo({ ...financialInfo, monthlyIncome: text })
              }
              placeholder="Enter monthly income"
              keyboardType="numeric"
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Bank Name
            </Text>
            <Input
              value={financialInfo.bankName}
              onChangeText={(text) =>
                setFinancialInfo({ ...financialInfo, bankName: text })
              }
              placeholder="Your bank name"
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Bank Account Number
            </Text>
            <Input
              value={financialInfo.bankAccountNumber}
              onChangeText={(text) =>
                setFinancialInfo({ ...financialInfo, bankAccountNumber: text })
              }
              placeholder="Your account number"
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Bank Branch
            </Text>
            <Input
              value={financialInfo.bankBranch}
              onChangeText={(text) =>
                setFinancialInfo({ ...financialInfo, bankBranch: text })
              }
              placeholder="Bank branch name"
            />
          </View>
        )}

        {currentStep === 4 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Document Upload
            </Text>

            <Text style={[styles.label, { color: colors.text }]}>
              Passport Size Photo{" "}
              <Text style={[styles.required, { color: colors.error }]}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.uploadButton, { borderColor: colors.border }]}
              onPress={() => pickImage("", "passport")}
              disabled={uploadingImage}
            >
              {passportPhoto ? (
                <Image
                  source={{ uri: passportPhoto }}
                  style={styles.uploadedImage}
                />
              ) : uploadingImage ? (
                <ActivityIndicator size="large" color={colors.primary} />
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
                    Upload Passport Photo
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={[styles.label, { color: colors.text }]}>
              Select Document Type(s){" "}
              <Text style={[styles.required, { color: colors.error }]}>*</Text>
            </Text>
            <View style={styles.documentTypesContainer}>
              {DOCUMENT_TYPE_OPTIONS.map((option) => {
                const isSelected = selectedDocumentTypes.includes(option.value);
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.documentTypeChip,
                      {
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border,
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.card,
                      },
                    ]}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedDocumentTypes((prev) =>
                          prev.filter((v) => v !== option.value),
                        );
                      } else {
                        setSelectedDocumentTypes((prev) => [
                          ...prev,
                          option.value,
                        ]);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.documentTypeText,
                        { color: isSelected ? "#fff" : colors.text },
                      ]}
                    >
                      {option.label}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#fff"
                        style={{ marginLeft: 4 }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedDocumentTypes.map((docType) => {
              const option = DOCUMENT_TYPE_OPTIONS.find(
                (o) => o.value === docType,
              );
              const detail = getDocumentDetail(docType);

              return (
                <View
                  key={docType}
                  style={[
                    styles.documentDetailSection,
                    { borderTopColor: colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.documentDetailTitle,
                      { color: colors.primary },
                    ]}
                  >
                    {option?.label} Details
                  </Text>

                  <Text style={[styles.label, { color: colors.text }]}>
                    {option?.numberLabel}{" "}
                    <Text style={[styles.required, { color: colors.error }]}>
                      *
                    </Text>
                  </Text>
                  <Input
                    value={detail.documentNumber}
                    onChangeText={(text) =>
                      updateDocumentDetail(docType, "documentNumber", text)
                    }
                    placeholder={`Enter ${option?.label?.toLowerCase()} number`}
                  />

                  <DatePickerInput
                    label="Issue Date"
                    value={detail.issueDate}
                    onChange={(date) =>
                      updateDocumentDetail(docType, "issueDate", date)
                    }
                    maximumDate={new Date()}
                    placeholder="Select issue date"
                  />

                  <DatePickerInput
                    label="Expiry Date"
                    value={detail.expiryDate}
                    onChange={(date) =>
                      updateDocumentDetail(docType, "expiryDate", date)
                    }
                    minimumDate={new Date()}
                    placeholder="Select expiry date"
                  />

                  <Text style={[styles.label, { color: colors.text }]}>
                    Issue District
                  </Text>
                  <Input
                    value={detail.issueDistrict}
                    onChangeText={(text) =>
                      updateDocumentDetail(docType, "issueDistrict", text)
                    }
                    placeholder="Enter issue district"
                  />

                  <Text style={[styles.label, { color: colors.text }]}>
                    Front Image{" "}
                    <Text style={[styles.required, { color: colors.error }]}>
                      *
                    </Text>
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.uploadButton,
                      { borderColor: colors.border },
                    ]}
                    onPress={() => pickImage(docType, "front")}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : detail.frontImage ? (
                      <Image
                        source={{ uri: detail.frontImage }}
                        style={styles.uploadedSmallImage}
                      />
                    ) : (
                      <>
                        <Ionicons
                          name="cloud-upload-outline"
                          size={24}
                          color={colors.primary}
                        />
                        <Text
                          style={[
                            styles.uploadText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Upload Front Image
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {docType !== "PAN" && (
                    <>
                      <Text style={[styles.label, { color: colors.text }]}>
                        Back Image{" "}
                        <Text
                          style={[styles.required, { color: colors.error }]}
                        >
                          *
                        </Text>
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.uploadButton,
                          { borderColor: colors.border },
                        ]}
                        onPress={() => pickImage(docType, "back")}
                        disabled={uploadingImage}
                      >
                        {uploadingImage ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : detail.backImage ? (
                          <Image
                            source={{ uri: detail.backImage }}
                            style={styles.uploadedSmallImage}
                          />
                        ) : (
                          <>
                            <Ionicons
                              name="cloud-upload-outline"
                              size={24}
                              color={colors.primary}
                            />
                            <Text
                              style={[
                                styles.uploadText,
                                { color: colors.textSecondary },
                              ]}
                            >
                              Upload Back Image
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              );
            })}

            {selectedDocumentTypes.length > 0 && (
              <>
                <Text style={[styles.label, { color: colors.text }]}>
                  Selfie with Document{" "}
                  <Text style={[styles.required, { color: colors.error }]}>
                    *
                  </Text>
                </Text>
                <View style={styles.selfieButtons}>
                  <TouchableOpacity
                    style={[
                      styles.uploadButton,
                      styles.halfButton,
                      { borderColor: colors.border },
                    ]}
                    onPress={takeSelfie}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Ionicons
                        name="camera-outline"
                        size={24}
                        color={colors.primary}
                      />
                    )}
                    <Text
                      style={[
                        styles.uploadText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {uploadingImage ? "Uploading..." : "Take Selfie"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.uploadButton,
                      styles.halfButton,
                      { borderColor: colors.border },
                    ]}
                    onPress={() => pickImage("", "selfie")}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Ionicons
                        name="images-outline"
                        size={24}
                        color={colors.primary}
                      />
                    )}
                    <Text
                      style={[
                        styles.uploadText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {uploadingImage ? "Uploading..." : "From Gallery"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {selfie && (
                  <Image
                    source={{ uri: selfie }}
                    style={styles.uploadedImage}
                  />
                )}
              </>
            )}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        {currentStep < 4 ? (
          <Button title="Next" onPress={handleNext} disabled={!isStepValid} />
        ) : (
          <Button
            title={loading ? "Submitting..." : "Submit for Verification"}
            onPress={handleSubmit}
            disabled={loading || !isStepValid}
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
              name="document-text-outline"
              size={40}
              color={colors.primary}
              style={{ marginBottom: 12 }}
            />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Pre-fill from Previous KYC?
            </Text>
            <Text style={[styles.modalBody, { color: colors.textSecondary }]}>
              We found a previous KYC submission. Would you like to pre-fill the
              form with your existing data?
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
                  prefillFromKyc();
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
        visible={blockchainProcessing}
        currentStep={blockchainStep}
        message="Recording your KYC verification on the blockchain and updating the database. Please wait..."
      />

      <BlockchainProcessingModal
        visible={uploadingImage}
        message="Uploading document image. Please wait..."
      />
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
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
    },
    progressStepContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    progressStep: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    progressStepText: {
      fontSize: 16,
      fontWeight: "700",
    },
    progressLine: {
      flex: 1,
      height: 2,
      marginHorizontal: 8,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    description: {
      fontSize: 14,
      marginBottom: 20,
      lineHeight: 20,
    },
    required: {},
    section: {
      backgroundColor: colors.background,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 8,
      marginTop: 12,
    },
    documentTypesContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 16,
    },
    documentTypeChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
    },
    documentTypeText: {
      fontSize: 14,
    },
    documentDetailSection: {
      marginTop: 20,
      paddingTop: 16,
      borderTopWidth: 1,
    },
    documentDetailTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 12,
    },
    uploadButton: {
      borderWidth: 2,
      borderStyle: "dashed",
      borderRadius: 12,
      padding: 24,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
      marginBottom: 16,
    },
    uploadedImage: {
      width: "100%",
      height: 200,
      borderRadius: 8,
    },
    uploadedSmallImage: {
      width: "100%",
      height: 150,
      borderRadius: 8,
    },
    uploadText: {
      fontSize: 14,
      marginTop: 8,
    },
    selfieButtons: {
      flexDirection: "row",
      gap: 12,
    },
    halfButton: {
      flex: 1,
      padding: 16,
    },
    footer: {
      padding: 20,
      borderTopWidth: 1,
    },
  });
