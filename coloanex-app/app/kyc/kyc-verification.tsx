import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  Input,
  Button,
  DatePickerInput,
  PickerInput,
  useToast,
} from "@/components/ui";
import { Colors } from "@/constants/theme";
import { kycApi } from "@/api";
import { uploadToCloudinary, uploadMultipleToCloudinary } from "@/utils/upload";

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

const getDocumentNumberLabel = (docTypes: string[]): string => {
  if (docTypes.length === 0) return "Document Number";
  if (docTypes.length === 1) {
    const doc = DOCUMENT_TYPE_OPTIONS.find((o) => o.value === docTypes[0]);
    return doc?.numberLabel || "Document Number";
  }
  return "Document Number";
};

export default function KYCVerificationScreen() {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
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
    []
  );
  const [uploadingImage, setUploadingImage] = useState(false);

  // Per-document-type information
  type DocumentInfo = {
    documentNumber: string;
    issueDate: Date | null;
    expiryDate: Date | null;
    issueDistrict: string;
  };
  const [documentDetails, setDocumentDetails] = useState<
    Record<string, DocumentInfo>
  >({});

  const [documents, setDocuments] = useState({
    passportPhoto: "",
    documentImages: [] as string[],
    selfie: "",
  });

  // Helper to get/set document details for a specific type
  const getDocumentDetail = (docType: string): DocumentInfo => {
    return (
      documentDetails[docType] || {
        documentNumber: "",
        issueDate: null,
        expiryDate: null,
        issueDistrict: "",
      }
    );
  };

  const updateDocumentDetail = (
    docType: string,
    field: keyof DocumentInfo,
    value: any
  ) => {
    setDocumentDetails((prev) => ({
      ...prev,
      [docType]: {
        ...getDocumentDetail(docType),
        [field]: value,
      },
    }));
  };

  // Form validation for each step
  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 1:
        return (
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
          selectedDocumentTypes.every(
            (docType) => getDocumentDetail(docType).documentNumber.trim() !== ""
          )
        );
      case 5:
        return (
          documents.passportPhoto !== "" &&
          documents.documentImages.length > 0 &&
          documents.selfie !== ""
        );
      default:
        return false;
    }
  }, [
    currentStep,
    personalInfo,
    address,
    financialInfo,
    selectedDocumentTypes,
    documents,
    documentDetails,
  ]);

  const pickDocument = async (isMultiple: boolean = false) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images" as any,
      allowsEditing: !isMultiple,
      allowsMultipleSelection: isMultiple,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setUploadingImage(true);
      try {
        if (isMultiple) {
          const uploadPromises = result.assets.map((asset) =>
            uploadToCloudinary(asset.uri, `document-${Date.now()}.jpg`)
          );
          const uploadedUrls = await Promise.all(uploadPromises);
          setDocuments((prev) => ({
            ...prev,
            documentImages: [
              ...prev.documentImages,
              ...uploadedUrls.map((u) => u.url),
            ],
          }));
        } else {
          const uploaded = await uploadToCloudinary(
            result.assets[0].uri,
            "passport-photo.jpg"
          );
          setDocuments((prev) => ({ ...prev, passportPhoto: uploaded.url }));
        }
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
          "selfie.jpg"
        );
        setDocuments((prev) => ({ ...prev, selfie: uploaded.url }));
      } catch (error: any) {
        showToast(error.message || "Failed to upload selfie", "error");
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const removeDocumentImage = (index: number) => {
    setDocuments((prev) => ({
      ...prev,
      documentImages: prev.documentImages.filter((_, i) => i !== index),
    }));
  };

  const pickSelfieFromGallery = async () => {
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
          "selfie.jpg"
        );
        setDocuments((prev) => ({ ...prev, selfie: uploaded.url }));
      } catch (error: any) {
        showToast(error.message || "Failed to upload selfie", "error");
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (
          !personalInfo.firstName ||
          !personalInfo.lastName ||
          !personalInfo.dateOfBirth
        ) {
          showToast(
            "Please fill all required personal information fields",
            "error"
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
            "error"
          );
          return false;
        }
        return true;

      case 4:
        if (selectedDocumentTypes.length === 0) {
          showToast("Please select at least one document type", "error");
          return false;
        }
        const missingDocNumber = selectedDocumentTypes.find(
          (docType) => !getDocumentDetail(docType).documentNumber.trim()
        );
        if (missingDocNumber) {
          const docLabel = DOCUMENT_TYPE_OPTIONS.find(
            (o) => o.value === missingDocNumber
          )?.label;
          showToast(`Please enter document number for ${docLabel}`, "error");
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
    if (!documents.passportPhoto) {
      showToast("Please upload your passport size photo", "error");
      return;
    }

    if (documents.documentImages.length === 0) {
      showToast("Please upload at least one document image", "error");
      return;
    }

    if (!documents.selfie) {
      showToast("Please upload a selfie with your document", "error");
      return;
    }

    setLoading(true);
    try {
      // Build files array with each document type's information
      const files: any[] = [];

      // For each selected document type, add the document images with that type's details
      selectedDocumentTypes.forEach((docType, typeIndex) => {
        const detail = getDocumentDetail(docType);
        // Add document images (front/back) - distribute images across document types
        // For simplicity, we'll associate all images with the primary document type
        if (typeIndex === 0) {
          documents.documentImages.forEach((url, imgIndex) => {
            files.push({
              fileType: imgIndex === 0 ? `${docType}_FRONT` : `${docType}_BACK`,
              documentType: docType,
              fileUrl: url,
              documentNumber: detail.documentNumber,
              issueDate: detail.issueDate?.toISOString(),
              expiryDate: detail.expiryDate?.toISOString(),
              issueDistrict: detail.issueDistrict || undefined,
            });
          });
        }
      });

      // Add selfie with primary document type
      const primaryDocType = selectedDocumentTypes[0];
      const primaryDetail = getDocumentDetail(primaryDocType);
      files.push({
        fileType: "SELFIE",
        documentType: primaryDocType,
        fileUrl: documents.selfie,
        documentNumber: primaryDetail.documentNumber,
        issueDate: primaryDetail.issueDate?.toISOString(),
        expiryDate: primaryDetail.expiryDate?.toISOString(),
        issueDistrict: primaryDetail.issueDistrict || undefined,
      });

      // Build document details array for all selected types
      const allDocumentDetails = selectedDocumentTypes.map((docType) => {
        const detail = getDocumentDetail(docType);
        return {
          documentType: docType,
          documentNumber: detail.documentNumber,
          issueDate: detail.issueDate?.toISOString(),
          expiryDate: detail.expiryDate?.toISOString(),
          issueDistrict: detail.issueDistrict || undefined,
        };
      });

      const kycData = {
        firstName: personalInfo.firstName,
        middleName: personalInfo.middleName || undefined,
        lastName: personalInfo.lastName,
        dateOfBirth: personalInfo.dateOfBirth?.toISOString(),
        gender: personalInfo.gender,
        maritalStatus: personalInfo.maritalStatus,
        fatherName: personalInfo.fatherName,
        motherName: personalInfo.motherName,
        grandfatherName: personalInfo.grandfatherName,
        permanentProvince: address.province,
        permanentDistrict: address.district,
        permanentMunicipality: address.municipality,
        permanentWard: address.ward,
        permanentTole: address.tole,
        occupation: financialInfo.occupation,
        monthlyIncome: parseFloat(financialInfo.monthlyIncome),
        bankName: financialInfo.bankName,
        bankAccountNumber: financialInfo.bankAccountNumber,
        bankBranch: financialInfo.bankBranch,
        documentTypes: selectedDocumentTypes,
        documentDetails: allDocumentDetails,
        passportSizePhotoUrl: documents.passportPhoto,
        files,
      };

      await kycApi.submit(kycData);
      showToast(
        "KYC verification submitted successfully. We will review your information and notify you soon.",
        "success"
      );
      router.back();
    } catch (error: any) {
      showToast(error.message || "Failed to submit KYC verification", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4, 5].map((step) => (
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
            {step < 5 && (
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
        <Text style={styles.description}>
          Step {currentStep} of 5 - Please provide accurate information.{" "}
          <Text style={styles.required}>*</Text> = required
        </Text>

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <Text style={styles.label}>
              First Name <Text style={styles.required}>*</Text>
            </Text>
            <Input
              value={personalInfo.firstName}
              onChangeText={(text) =>
                setPersonalInfo({ ...personalInfo, firstName: text })
              }
              placeholder="Enter your first name"
            />

            <Text style={styles.label}>Middle Name</Text>
            <Input
              value={personalInfo.middleName}
              onChangeText={(text) =>
                setPersonalInfo({ ...personalInfo, middleName: text })
              }
              placeholder="Enter your middle name"
            />

            <Text style={styles.label}>
              Last Name <Text style={styles.required}>*</Text>
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

            <Text style={styles.label}>Father's Name</Text>
            <Input
              value={personalInfo.fatherName}
              onChangeText={(text) =>
                setPersonalInfo({ ...personalInfo, fatherName: text })
              }
              placeholder="Enter father's name"
            />

            <Text style={styles.label}>Mother's Name</Text>
            <Input
              value={personalInfo.motherName}
              onChangeText={(text) =>
                setPersonalInfo({ ...personalInfo, motherName: text })
              }
              placeholder="Enter mother's name"
            />

            <Text style={styles.label}>Grandfather's Name</Text>
            <Input
              value={personalInfo.grandfatherName}
              onChangeText={(text) =>
                setPersonalInfo({ ...personalInfo, grandfatherName: text })
              }
              placeholder="Enter grandfather's name"
            />
          </View>
        )}

        {/* Step 2: Address */}
        {currentStep === 2 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Permanent Address</Text>

            <Text style={styles.label}>
              Province <Text style={styles.required}>*</Text>
            </Text>
            <Input
              value={address.province}
              onChangeText={(text) =>
                setAddress({ ...address, province: text })
              }
              placeholder="e.g., Bagmati"
            />

            <Text style={styles.label}>
              District <Text style={styles.required}>*</Text>
            </Text>
            <Input
              value={address.district}
              onChangeText={(text) =>
                setAddress({ ...address, district: text })
              }
              placeholder="e.g., Kathmandu"
            />

            <Text style={styles.label}>
              Municipality <Text style={styles.required}>*</Text>
            </Text>
            <Input
              value={address.municipality}
              onChangeText={(text) =>
                setAddress({ ...address, municipality: text })
              }
              placeholder="Enter municipality"
            />

            <Text style={styles.label}>
              Ward Number <Text style={styles.required}>*</Text>
            </Text>
            <Input
              value={address.ward}
              onChangeText={(text) => setAddress({ ...address, ward: text })}
              placeholder="Enter ward number"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Tole/Street</Text>
            <Input
              value={address.tole}
              onChangeText={(text) => setAddress({ ...address, tole: text })}
              placeholder="Enter tole or street name"
            />
          </View>
        )}

        {/* Step 3: Financial Information */}
        {currentStep === 3 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Financial Information</Text>

            <Text style={styles.label}>
              Occupation <Text style={styles.required}>*</Text>
            </Text>
            <Input
              value={financialInfo.occupation}
              onChangeText={(text) =>
                setFinancialInfo({ ...financialInfo, occupation: text })
              }
              placeholder="Your occupation"
            />

            <Text style={styles.label}>
              Monthly Income (NPR) <Text style={styles.required}>*</Text>
            </Text>
            <Input
              value={financialInfo.monthlyIncome}
              onChangeText={(text) =>
                setFinancialInfo({ ...financialInfo, monthlyIncome: text })
              }
              placeholder="Enter monthly income"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Bank Name</Text>
            <Input
              value={financialInfo.bankName}
              onChangeText={(text) =>
                setFinancialInfo({ ...financialInfo, bankName: text })
              }
              placeholder="Your bank name"
            />

            <Text style={styles.label}>Bank Account Number</Text>
            <Input
              value={financialInfo.bankAccountNumber}
              onChangeText={(text) =>
                setFinancialInfo({ ...financialInfo, bankAccountNumber: text })
              }
              placeholder="Your account number"
            />

            <Text style={styles.label}>Bank Branch</Text>
            <Input
              value={financialInfo.bankBranch}
              onChangeText={(text) =>
                setFinancialInfo({ ...financialInfo, bankBranch: text })
              }
              placeholder="Bank branch name"
            />
          </View>
        )}

        {/* Step 4: Document Selection & Details */}
        {currentStep === 4 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Document Information</Text>

            <Text style={styles.label}>
              Select Document Type(s) <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.helperText}>
              You can select multiple document types
            </Text>
            <View style={styles.documentTypesContainer}>
              {DOCUMENT_TYPE_OPTIONS.map((option) => {
                const isSelected = selectedDocumentTypes.includes(option.value);
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.documentTypeChip,
                      isSelected && styles.documentTypeChipSelected,
                    ]}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedDocumentTypes((prev) =>
                          prev.filter((v) => v !== option.value)
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
                        isSelected && styles.documentTypeTextSelected,
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

            {selectedDocumentTypes.length > 0 && (
              <>
                {selectedDocumentTypes.map((docType) => {
                  const option = DOCUMENT_TYPE_OPTIONS.find(
                    (o) => o.value === docType
                  );
                  const detail = getDocumentDetail(docType);
                  return (
                    <View key={docType} style={styles.documentDetailSection}>
                      <Text style={styles.documentDetailTitle}>
                        {option?.label} Details
                      </Text>

                      <Text style={styles.label}>
                        {option?.numberLabel || "Document Number"}{" "}
                        <Text style={styles.required}>*</Text>
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

                      <Text style={styles.label}>Issue District</Text>
                      <Input
                        value={detail.issueDistrict}
                        onChangeText={(text) =>
                          updateDocumentDetail(docType, "issueDistrict", text)
                        }
                        placeholder="Enter issue district"
                      />
                    </View>
                  );
                })}
              </>
            )}
          </View>
        )}

        {/* Step 5: Document Uploads */}
        {currentStep === 5 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upload Documents</Text>

              {selectedDocumentTypes.length > 0 && (
                <View style={styles.selectedDocsInfo}>
                  <Text style={styles.selectedDocsTitle}>
                    Selected Documents:
                  </Text>
                  {selectedDocumentTypes.map((docType) => {
                    const option = DOCUMENT_TYPE_OPTIONS.find(
                      (o) => o.value === docType
                    );
                    const detail = getDocumentDetail(docType);
                    return (
                      <View key={docType} style={styles.selectedDocItem}>
                        <Text style={styles.selectedDocLabel}>
                          {option?.label}
                        </Text>
                        <Text style={styles.selectedDocValue}>
                          {option?.numberLabel}: {detail.documentNumber}
                        </Text>
                        {detail.issueDate && (
                          <Text style={styles.selectedDocValue}>
                            Issue Date: {detail.issueDate.toLocaleDateString()}
                          </Text>
                        )}
                        {detail.expiryDate && (
                          <Text style={styles.selectedDocValue}>
                            Expiry Date:{" "}
                            {detail.expiryDate.toLocaleDateString()}
                          </Text>
                        )}
                        {detail.issueDistrict && (
                          <Text style={styles.selectedDocValue}>
                            Issue District: {detail.issueDistrict}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              <Text style={styles.label}>
                Passport Size Photo <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => pickDocument(false)}
                disabled={uploadingImage}
              >
                {documents.passportPhoto ? (
                  <Image
                    source={{ uri: documents.passportPhoto }}
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
                    <Text style={styles.uploadText}>Upload Passport Photo</Text>
                  </>
                )}
              </TouchableOpacity>

              {selectedDocumentTypes.length > 0 && (
                <>
                  <Text style={styles.label}>
                    {selectedDocumentTypes
                      .map(
                        (dt) =>
                          DOCUMENT_TYPE_OPTIONS.find((o) => o.value === dt)
                            ?.label
                      )
                      .join(" / ")}{" "}
                    Images <Text style={styles.required}>*</Text>
                  </Text>
                  <Text style={styles.helperText}>
                    Upload front and back images (if applicable)
                  </Text>

                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => pickDocument(true)}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <>
                        <ActivityIndicator
                          size="large"
                          color={Colors.primary}
                        />
                        <Text style={styles.uploadText}>Uploading...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons
                          name="cloud-upload-outline"
                          size={32}
                          color={Colors.primary}
                        />
                        <Text style={styles.uploadText}>
                          Upload Document Images
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {documents.documentImages.length > 0 && (
                    <View style={styles.imageGrid}>
                      {documents.documentImages.map((url, index) => (
                        <View key={index} style={styles.imageContainer}>
                          <Image
                            source={{ uri: url }}
                            style={styles.gridImage}
                          />
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => removeDocumentImage(index)}
                          >
                            <Ionicons
                              name="close-circle"
                              size={24}
                              color={Colors.error}
                            />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}

              <Text style={styles.label}>
                Selfie with Document <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.selfieButtons}>
                <TouchableOpacity
                  style={[styles.uploadButton, styles.halfButton]}
                  onPress={takeSelfie}
                  disabled={uploadingImage}
                >
                  <Ionicons
                    name="camera-outline"
                    size={24}
                    color={Colors.primary}
                  />
                  <Text style={styles.uploadText}>Take Selfie</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.uploadButton, styles.halfButton]}
                  onPress={pickSelfieFromGallery}
                  disabled={uploadingImage}
                >
                  <Ionicons
                    name="images-outline"
                    size={24}
                    color={Colors.primary}
                  />
                  <Text style={styles.uploadText}>From Gallery</Text>
                </TouchableOpacity>
              </View>
              {uploadingImage && !documents.selfie && (
                <ActivityIndicator
                  size="small"
                  color={Colors.primary}
                  style={{ marginTop: 10 }}
                />
              )}
              {documents.selfie && (
                <Image
                  source={{ uri: documents.selfie }}
                  style={styles.uploadedImage}
                />
              )}
            </View>
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={styles.footer}>
        {currentStep < 5 ? (
          <Button title="Next" onPress={handleNext} disabled={!isStepValid} />
        ) : (
          <Button
            title={loading ? "Submitting..." : "Submit for Verification"}
            onPress={handleSubmit}
            disabled={loading || !isStepValid}
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
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  required: {
    color: Colors.error,
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
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
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
    borderColor: Colors.border,
    backgroundColor: "#fff",
  },
  documentTypeChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  documentTypeText: {
    fontSize: 14,
    color: Colors.text,
  },
  documentTypeTextSelected: {
    color: "#fff",
  },
  documentDetailSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  documentDetailTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 12,
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
    marginBottom: 16,
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
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  imageContainer: {
    width: "48%",
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  selfieButtons: {
    flexDirection: "row",
    gap: 12,
  },
  halfButton: {
    flex: 1,
    padding: 16,
  },
  selectedDocsInfo: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedDocsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  selectedDocItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectedDocLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 4,
  },
  selectedDocValue: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
