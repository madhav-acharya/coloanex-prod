import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Input, Button } from "@/components/ui";
import { Colors } from "@/constants/theme";
import { kycApi } from "@/api";

export default function KYCVerificationScreen() {
  const [loading, setLoading] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
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
    accountNumber: "",
    accountHolderName: "",
  });

  const [documents, setDocuments] = useState<{
    passportPhoto: any;
    citizenshipFront: any;
    citizenshipBack: any;
    selfie: any;
  }>({
    passportPhoto: null,
    citizenshipFront: null,
    citizenshipBack: null,
    selfie: null,
  });

  const pickDocument = async (type: keyof typeof documents) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setDocuments((prev) => ({ ...prev, [type]: result.assets[0] }));
    }
  };

  const takeSelfie = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setDocuments((prev) => ({ ...prev, selfie: result.assets[0] }));
    }
  };

  const handleSubmit = async () => {
    if (
      !personalInfo.firstName ||
      !personalInfo.lastName ||
      !personalInfo.dateOfBirth
    ) {
      Alert.alert("Error", "Please fill all required personal information");
      return;
    }

    if (
      !address.province ||
      !address.district ||
      !address.municipality ||
      !address.ward
    ) {
      Alert.alert("Error", "Please fill all required address information");
      return;
    }

    if (!financialInfo.occupation || !financialInfo.monthlyIncome) {
      Alert.alert("Error", "Please fill all required financial information");
      return;
    }

    if (
      !documents.passportPhoto ||
      !documents.citizenshipFront ||
      !documents.citizenshipBack ||
      !documents.selfie
    ) {
      Alert.alert("Error", "Please upload all required documents");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();

      Object.entries(personalInfo).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      Object.entries(address).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      Object.entries(financialInfo).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      Object.entries(documents).forEach(([key, value]) => {
        if (value) {
          formData.append(key, {
            uri: value.uri,
            name: `${key}.jpg`,
            type: "image/jpeg",
          } as any);
        }
      });

      await kycApi.submit(formData);
      Alert.alert(
        "Success",
        "KYC verification submitted successfully. We will review your information and notify you soon.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to submit KYC verification"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          Please provide accurate information for verification. All fields
          marked with * are required.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <Text style={styles.label}>First Name *</Text>
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

          <Text style={styles.label}>Last Name *</Text>
          <Input
            value={personalInfo.lastName}
            onChangeText={(text) =>
              setPersonalInfo({ ...personalInfo, lastName: text })
            }
            placeholder="Enter your last name"
          />

          <Text style={styles.label}>Date of Birth * (YYYY-MM-DD)</Text>
          <Input
            value={personalInfo.dateOfBirth}
            onChangeText={(text) =>
              setPersonalInfo({ ...personalInfo, dateOfBirth: text })
            }
            placeholder="YYYY-MM-DD"
          />

          <Text style={styles.label}>Gender</Text>
          <Input
            value={personalInfo.gender}
            onChangeText={(text) =>
              setPersonalInfo({ ...personalInfo, gender: text })
            }
            placeholder="Male/Female/Other"
          />

          <Text style={styles.label}>Marital Status</Text>
          <Input
            value={personalInfo.maritalStatus}
            onChangeText={(text) =>
              setPersonalInfo({ ...personalInfo, maritalStatus: text })
            }
            placeholder="Single/Married/Other"
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permanent Address</Text>
          <Text style={styles.label}>Province *</Text>
          <Input
            value={address.province}
            onChangeText={(text) => setAddress({ ...address, province: text })}
            placeholder="e.g., Bagmati"
          />

          <Text style={styles.label}>District *</Text>
          <Input
            value={address.district}
            onChangeText={(text) => setAddress({ ...address, district: text })}
            placeholder="e.g., Kathmandu"
          />

          <Text style={styles.label}>Municipality *</Text>
          <Input
            value={address.municipality}
            onChangeText={(text) =>
              setAddress({ ...address, municipality: text })
            }
            placeholder="Enter municipality"
          />

          <Text style={styles.label}>Ward Number *</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Information</Text>
          <Text style={styles.label}>Occupation *</Text>
          <Input
            value={financialInfo.occupation}
            onChangeText={(text) =>
              setFinancialInfo({ ...financialInfo, occupation: text })
            }
            placeholder="Your occupation"
          />

          <Text style={styles.label}>Monthly Income (NPR) *</Text>
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

          <Text style={styles.label}>Account Number</Text>
          <Input
            value={financialInfo.accountNumber}
            onChangeText={(text) =>
              setFinancialInfo({ ...financialInfo, accountNumber: text })
            }
            placeholder="Your account number"
          />

          <Text style={styles.label}>Account Holder Name</Text>
          <Input
            value={financialInfo.accountHolderName}
            onChangeText={(text) =>
              setFinancialInfo({ ...financialInfo, accountHolderName: text })
            }
            placeholder="Name as per bank account"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Document Uploads</Text>

          <Text style={styles.label}>Passport Size Photo *</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickDocument("passportPhoto")}
          >
            {documents.passportPhoto ? (
              <Image
                source={{ uri: documents.passportPhoto.uri }}
                style={styles.uploadedImage}
              />
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

          <Text style={styles.label}>Citizenship Front *</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickDocument("citizenshipFront")}
          >
            {documents.citizenshipFront ? (
              <Image
                source={{ uri: documents.citizenshipFront.uri }}
                style={styles.uploadedImage}
              />
            ) : (
              <>
                <Ionicons
                  name="cloud-upload-outline"
                  size={32}
                  color={Colors.primary}
                />
                <Text style={styles.uploadText}>Upload Citizenship Front</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Citizenship Back *</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickDocument("citizenshipBack")}
          >
            {documents.citizenshipBack ? (
              <Image
                source={{ uri: documents.citizenshipBack.uri }}
                style={styles.uploadedImage}
              />
            ) : (
              <>
                <Ionicons
                  name="cloud-upload-outline"
                  size={32}
                  color={Colors.primary}
                />
                <Text style={styles.uploadText}>Upload Citizenship Back</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Selfie with Citizenship *</Text>
          <View style={styles.selfieButtons}>
            <TouchableOpacity
              style={[styles.uploadButton, styles.halfButton]}
              onPress={takeSelfie}
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
              onPress={() => pickDocument("selfie")}
            >
              <Ionicons
                name="images-outline"
                size={24}
                color={Colors.primary}
              />
              <Text style={styles.uploadText}>From Gallery</Text>
            </TouchableOpacity>
          </View>
          {documents.selfie && (
            <Image
              source={{ uri: documents.selfie.uri }}
              style={styles.uploadedImage}
            />
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={loading ? "Submitting..." : "Submit for Verification"}
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
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
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
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
