import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { usersApi } from "@/api";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/authSlice";
import { Colors } from "@/constants/theme";
import { DatePickerInput, useToast } from "@/components/ui";
import { uploadToCloudinary } from "@/utils/upload";

export default function EditProfileScreen() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalData, setOriginalData] = useState({
    fullName: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    address: "",
  });
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    dateOfBirth: null as Date | null,
    address: "",
  });
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const isFormValid = useMemo(() => {
    return formData.fullName.trim() !== "";
  }, [formData.fullName]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const userData = await usersApi.getCurrentUser();
      const newFormData = {
        fullName: userData.fullName || "",
        phone: userData.phone || "",
        email: userData.email || "",
        dateOfBirth: userData.dateOfBirth
          ? new Date(userData.dateOfBirth)
          : null,
        address: userData.address || "",
      };
      setFormData(newFormData);
      setOriginalData(newFormData);
      setProfileImageUrl(userData.profileImage || null);
      dispatch(setUser(userData));
    } catch (error) {
      console.error("Failed to load user data:", error);
      showToast("Failed to load user data", "error");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images" as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadingImage(true);
      try {
        const uploaded = await uploadToCloudinary(
          result.assets[0].uri,
          "profile-image.jpg"
        );
        setProfileImageUrl(uploaded.url);
        showToast("Image uploaded successfully", "success");
      } catch (error: any) {
        showToast(error.message || "Failed to upload image", "error");
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleUpdate = async () => {
    if (!formData.fullName.trim()) {
      showToast("Please enter your full name", "error");
      return;
    }

    if (!user?.id) {
      showToast("User ID not found", "error");
      return;
    }

    setSaving(true);
    try {
      const updatePayload: any = {};

      // Check what changed
      if (formData.fullName !== originalData.fullName) {
        updatePayload.fullName = formData.fullName;
      }
      if (formData.phone !== originalData.phone) {
        updatePayload.phone = formData.phone;
      }
      if (formData.dateOfBirth !== originalData.dateOfBirth) {
        updatePayload.dateOfBirth =
          formData.dateOfBirth?.toISOString() || undefined;
      }
      if (formData.address !== originalData.address) {
        updatePayload.address = formData.address || undefined;
      }

      if (profileImageUrl && profileImageUrl !== user?.profileImage) {
        updatePayload.profileImage = profileImageUrl;
      }

      if (Object.keys(updatePayload).length > 0) {
        const updatedUser = await usersApi.updateUserById(
          user.id,
          updatePayload
        );
        dispatch(setUser(updatedUser));
      }
      showToast("Profile updated successfully", "success");
      router.back();
    } catch (error: any) {
      showToast(
        error.response?.data?.message || "Failed to update profile",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading && !formData.email) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileImageContainer}>
          <TouchableOpacity
            onPress={pickImage}
            style={styles.imageWrapper}
            disabled={uploadingImage}
          >
            {profileImageUrl ? (
              <Image
                source={{ uri: profileImageUrl }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons
                  name="person"
                  size={48}
                  color={Colors.textSecondary}
                />
              </View>
            )}
            {uploadingImage ? (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            ) : (
              <View style={styles.editImageBadge}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.imageHint}>Tap to change profile picture</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.fullName}
              onChangeText={(text) =>
                setFormData({ ...formData, fullName: text })
              }
              placeholder="Enter your full name"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={formData.email}
              editable={false}
              placeholderTextColor={Colors.textSecondary}
            />
            <Text style={styles.hint}>Email cannot be changed</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <DatePickerInput
            label="Date of Birth"
            value={formData.dateOfBirth}
            onChange={(date) => setFormData({ ...formData, dateOfBirth: date })}
            maximumDate={new Date()}
            placeholder="Select your date of birth"
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.address}
              onChangeText={(text) =>
                setFormData({ ...formData, address: text })
              }
              placeholder="Enter your address"
              multiline
              numberOfLines={3}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.button,
            (!isFormValid || saving) && styles.buttonDisabled,
          ]}
          onPress={handleUpdate}
          disabled={!isFormValid || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  },
  profileImageContainer: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  imageWrapper: {
    position: "relative",
    marginBottom: 8,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surface,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  editImageBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadingText: {
    color: "#fff",
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  imageHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
  },
  inputDisabled: {
    backgroundColor: Colors.background,
    color: Colors.textSecondary,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  footer: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});
