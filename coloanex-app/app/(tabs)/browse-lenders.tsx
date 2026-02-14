import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Card } from "@/components/ui";
import { spacing, typography, borderRadius } from "@/constants/theme";
import { lendersApi } from "@/api";
import type { Lender } from "@/types";
import { useTheme } from "@/hooks/useTheme";

const FILTERS = ["All", "Active", "Inactive"];

export default function BrowseScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchVisible, setSearchVisible] = useState(false);

  const loadLenders = async () => {
    try {
      const data = await lendersApi.getAll();
      setLenders(data);
    } catch (error) {
      console.error("Failed to load lenders:", error);
    }
  };

  useEffect(() => {
    loadLenders();
  }, []);

  const filteredLenders = lenders.filter((lender) => {
    if (selectedFilter === "All") return true;
    if (selectedFilter === "Active") return lender.isActive;
    if (selectedFilter === "Inactive") return !lender.isActive;
    return true;
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.surface }]}
    >
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Browse Lenders
        </Text>
        <TouchableOpacity onPress={() => setSearchVisible(!searchVisible)}>
          <Ionicons name="search" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterContainer, { backgroundColor: colors.background }]}
      >
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              { backgroundColor: colors.surface },
              selectedFilter === filter && [
                styles.filterChipActive,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                  shadowColor: colors.primary,
                },
              ],
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                { color: colors.text },
                selectedFilter === filter && [
                  styles.filterTextActive,
                  { color: colors.background },
                ],
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredLenders.map((lender) => (
          <TouchableOpacity
            key={lender.id}
            onPress={() =>
              router.push({
                pathname: "/lenders/lender-details",
                params: { id: lender.id },
              })
            }
          >
            <Card style={styles.lenderCard}>
              <View style={styles.lenderHeader}>
                <View
                  style={[
                    styles.lenderIcon,
                    {
                      backgroundColor: colors.primaryLight,
                      shadowColor: colors.primary,
                    },
                  ]}
                >
                  {lender.logo ? (
                    <Image
                      source={{ uri: lender.logo }}
                      style={styles.lenderLogoImage}
                    />
                  ) : (
                    <Ionicons
                      name="business"
                      size={32}
                      color={colors.primary}
                    />
                  )}
                </View>
                <View style={styles.lenderInfo}>
                  <Text style={[styles.lenderName, { color: colors.text }]}>
                    {lender.name}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: colors.surface },
                      lender.isActive && [
                        styles.statusBadgeActive,
                        { backgroundColor: colors.primaryLight },
                      ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: colors.textSecondary },
                        lender.isActive && [
                          styles.statusTextActive,
                          { color: colors.primary },
                        ],
                      ]}
                    >
                      {lender.isActive ? "Active" : "Inactive"}
                    </Text>
                  </View>
                </View>
              </View>

              {(lender.contactEmail ||
                lender.contactPhone ||
                lender.address) && (
                <View
                  style={[styles.contactInfo, { borderColor: colors.border }]}
                >
                  {lender.contactEmail && (
                    <View style={styles.contactRow}>
                      <Ionicons
                        name="mail-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.contactText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {lender.contactEmail}
                      </Text>
                    </View>
                  )}
                  {lender.contactPhone && (
                    <View style={styles.contactRow}>
                      <Ionicons
                        name="call-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.contactText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {lender.contactPhone}
                      </Text>
                    </View>
                  )}
                  {lender.address && (
                    <View style={styles.contactRow}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.contactText,
                          { color: colors.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {lender.address}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.viewButton,
                  {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                  },
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/lenders/lender-details",
                    params: { id: lender.id },
                  })
                }
              >
                <Text
                  style={[styles.viewButtonText, { color: colors.background }]}
                >
                  View Details
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={colors.background}
                />
              </TouchableOpacity>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    title: {
      ...typography.h2,
    },
    filterContainer: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      maxHeight: 60,
    },
    filterChip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: 10,
      borderRadius: borderRadius.full,
      marginRight: spacing.sm,
      borderWidth: 2,
      borderColor: "transparent",
    },
    filterChipActive: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    filterText: {
      ...typography.bodySmall,
      fontWeight: "600",
    },
    filterTextActive: {
      fontWeight: "700",
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    lenderCard: {
      marginBottom: spacing.md,
    },
    lenderHeader: {
      flexDirection: "row",
      marginBottom: spacing.md,
    },
    lenderIcon: {
      width: 56,
      height: 56,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
      overflow: "hidden",
    },
    lenderLogoImage: {
      width: "100%",
      height: "100%",
    },
    lenderInfo: {
      flex: 1,
      marginLeft: spacing.md,
      justifyContent: "center",
    },
    lenderName: {
      ...typography.h3,
      fontSize: 18,
      marginBottom: 4,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: "flex-start",
    },
    statusBadgeActive: {},
    statusText: {
      ...typography.caption,
      fontWeight: "600",
    },
    statusTextActive: {},
    viewButton: {
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    viewButtonText: {
      ...typography.bodySmall,
      fontWeight: "700",
      marginRight: spacing.xs,
    },
    contactInfo: {
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      marginBottom: spacing.sm,
    },
    contactRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    contactText: {
      ...typography.caption,
      marginLeft: spacing.xs,
      flex: 1,
    },
  });
