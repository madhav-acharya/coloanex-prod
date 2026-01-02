import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link, router } from "expo-router";
import { Button, Input, useToast } from "@/components/ui";
import { colors, spacing, typography } from "@/constants/theme";
import { authApi } from "@/api";
import { useAppDispatch } from "@/store/hooks";
import { setAuth } from "@/store/slices/authSlice";

export default function SignupScreen() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const isFormValid = useMemo(() => {
    return (
      fullName.trim() !== "" &&
      email.trim() !== "" &&
      /\S+@\S+\.\S+/.test(email) &&
      password.length >= 6 &&
      password === confirmPassword
    );
  }, [fullName, email, password, confirmPassword]);

  const validateForm = () => {
    const newErrors: any = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await authApi.signup({
        fullName,
        email,
        phone: phone || undefined,
        password,
      });
      dispatch(setAuth({ token: response.accessToken, user: response.user }));
      showToast("Account created successfully!", "success");
      router.replace("/");
    } catch (error: any) {
      showToast(
        error.response?.data?.message || "Signup failed. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join CoLoanex to get started</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
            icon="person-outline"
            error={errors.fullName}
          />

          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail-outline"
            error={errors.email}
          />

          <Input
            label="Phone (Optional)"
            placeholder="Enter your phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            icon="call-outline"
            error={errors.phone}
          />

          <Input
            label="Password"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            isPassword
            icon="lock-closed-outline"
            error={errors.password}
          />

          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
            icon="lock-closed-outline"
            error={errors.confirmPassword}
          />

          <Button
            title="Sign Up"
            onPress={handleSignup}
            loading={loading}
            disabled={!isFormValid}
            style={styles.button}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/login" asChild>
              <Text style={styles.link}>Sign In</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  logo: {
    width: 100,
    height: 100,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  form: {
    flex: 1,
  },
  button: {
    marginTop: spacing.lg,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  link: {
    ...typography.body,
    color: colors.primary,
    fontWeight: "600",
  },
});
