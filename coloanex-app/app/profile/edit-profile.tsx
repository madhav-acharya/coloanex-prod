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
import { useTheme } from "@/hooks/useTheme";
import { DatePickerInput, AppHeader, useToast } from "@/components/ui";
import { uploadToCloudinary } from "@/utils/upload";

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalData, setOriginalData] = useState({
    fullName: "",
    phone: "",
    email: "",
    dateOfBirth: null as Date | null,
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

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    loadUserData();
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

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
    } catch {
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
          "profile-image.jpg",
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
          updatePayload,
        );
        dispatch(setUser(updatedUser));
      }
      showToast("Profile updated successfully", "success");
      router.back();
    } catch (error: any) {
      showToast(
        error.response?.data?.message || "Failed to update profile",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading && !formData.email) {
    return (
      <View
        style={[
          styles.container,
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Edit Profile" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.profileImageContainer,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
        >
          <TouchableOpacity
            onPress={pickImage}
            style={styles.imageWrapper}
            disabled={uploadingImage}
          >
            {profileImageUrl ? (
              <Image
                source={{ uri: profileImageUrl }}
                style={[
                  styles.profileImage,
                  { backgroundColor: colors.surface },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.placeholderImage,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="person"
                  size={48}
                  color={colors.textSecondary}
                />
              </View>
            )}
            {uploadingImage ? (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            ) : (
              <View
                style={[
                  styles.editImageBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={[styles.imageHint, { color: colors.textSecondary }]}>
            Tap to change profile picture
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Full Name *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={formData.fullName}
              onChangeText={(text) =>
                setFormData({ ...formData, fullName: text })
              }
              placeholder="Enter your full name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Email *</Text>
            <TextInput
              style={[
                styles.input,
                styles.inputDisabled,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.textSecondary,
                },
              ]}
              value={formData.email}
              editable={false}
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Email cannot be changed
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Phone Number
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              placeholderTextColor={colors.textSecondary}
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
            <Text style={[styles.label, { color: colors.text }]}>Address</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={formData.address}
              onChangeText={(text) =>
                setFormData({ ...formData, address: text })
              }
              placeholder="Enter your address"
              multiline
              numberOfLines={3}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
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

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
    },
    profileImageContainer: {
      alignItems: "center",
      paddingVertical: 24,
      borderBottomWidth: 1,
    },
    imageWrapper: {
      position: "relative",
      marginBottom: 8,
    },
    profileImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
    },
    placeholderImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderStyle: "dashed",
    },
    editImageBadge: {
      position: "absolute",
      bottom: 0,
      right: 0,
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
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
    },
    inputDisabled: {},
    textArea: {
      height: 100,
      textAlignVertical: "top",
    },
    hint: {
      fontSize: 12,
      marginTop: 4,
    },
    footer: {
      padding: 20,
      borderTopWidth: 1,
    },
    button: {
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
