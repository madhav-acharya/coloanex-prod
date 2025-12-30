import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Card, Button } from "@/components/ui";
import { colors, spacing, typography, borderRadius } from "@/constants/theme";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { authApi } from "@/api";

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await authApi.logout();
          } catch (error) {
            console.error("Logout error:", error);
          } finally {
            dispatch(logout());
            router.replace("/login");
          }
        },
      },
    ]);
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
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
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
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text,
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
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 4,
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
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
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
