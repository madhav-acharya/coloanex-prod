import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { Card, Button, useToast } from "@/components/ui";
import { colors, spacing, typography, borderRadius } from "@/constants/theme";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout, setUser } from "@/store/slices/authSlice";
import { authApi, usersApi } from "@/api";

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { showToast } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, []),
  );

  const loadUserData = async () => {
    try {
      const userData = await usersApi.getCurrentUser();
      dispatch(setUser(userData));
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authApi.logout();
      showToast("Logged out successfully", "success");
      dispatch(logout());
      router.replace("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      showToast("Logout failed, clearing session", "warning");
      dispatch(logout());
      router.replace("/auth/login");
    } finally {
      setLoggingOut(false);
    }
  };

  const menuItems = [
    {
      icon: "person-outline",
      title: "Edit Profile",
      route: "/profile/edit-profile",
    },
    {
      icon: "lock-closed-outline",
      title: "Change Password",
      route: "/profile/change-password",
    },
    {
      icon: "notifications-outline",
      title: "Notifications",
      route: "/profile/notifications",
    },
    {
      icon: "help-circle-outline",
      title: "Help & Support",
      route: "/profile/support",
    },
    {
      icon: "information-circle-outline",
      title: "About",
      route: "/profile/about",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              {user?.profileImage ? (
                <View />
              ) : (
                <Ionicons name="person" size={48} color={colors.primary} />
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.fullName || "User"}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
        </Card>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.lastMenuItem,
              ]}
              onPress={() => item.route && router.push(item.route as any)}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={colors.textSecondary}
                />
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textLight}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title={loggingOut ? "Logging out..." : "Logout"}
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
          loading={loggingOut}
        />

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    fontWeight: "800",
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  profileCard: {
    marginBottom: spacing.lg,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  userName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 6,
    fontWeight: "700",
    fontSize: 20,
  },
  userEmail: {
    ...typography.body,
    color: colors.textSecondary,
  },
  menuSection: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.md,
    fontWeight: "600",
  },
  logoutButton: {
    marginBottom: spacing.lg,
  },
  version: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
});
