import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Card, SearchBar } from "@/components/ui";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 10;

  const loadLenders = async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const currentOffset = reset ? 0 : offset;
      const params: any = {
        limit: LIMIT,
        offset: currentOffset,
      };

      if (searchQuery.trim()) {
        params.search = searchQuery;
      }

      if (selectedFilter === "Active") {
        params.isActive = true;
      } else if (selectedFilter === "Inactive") {
        params.isActive = false;
      }

      const result = await lendersApi.getAll(params);

      if (reset) {
        setLenders(result.data);
        setOffset(LIMIT);
      } else {
        setLenders([...lenders, ...result.data]);
        setOffset(currentOffset + LIMIT);
      }

      setHasMore(result.hasMore);
    } catch (error) {
      console.error("Failed to load lenders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    setLenders([]);
    loadLenders(true);
  }, [selectedFilter, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadLenders(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.surface }]}
    >
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Browse Lenders</Text>
          <TouchableOpacity
            style={styles.searchIconButton}
            onPress={() => setShowSearch(true)}
          >
            <Ionicons name="search" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.filtersRow}>
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                { backgroundColor: colors.surface },
                selectedFilter === filter && {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: colors.text },
                  selectedFilter === filter && {
                    color: colors.background,
                  },
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Modal
        visible={showSearch}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSearch(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Search Lenders
              </Text>
              <TouchableOpacity onPress={() => setShowSearch(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
            <SearchBar
              placeholder="Search by name..."
              onSearch={(query) => {
                handleSearch(query);
                setShowSearch(false);
              }}
              debounceMs={500}
            />
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {lenders.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="search-outline"
              size={64}
              color={colors.textLight}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Lenders Found
            </Text>
            <Text
              style={[styles.emptyMessage, { color: colors.textSecondary }]}
            >
              {searchQuery
                ? `No lenders match "${searchQuery}"`
                : selectedFilter === "Active"
                  ? "No active lenders available"
                  : selectedFilter === "Inactive"
                    ? "No inactive lenders available"
                    : "No lenders available at the moment"}
            </Text>
          </View>
        ) : (
          <>
            {lenders.map((lender) => (
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
                      style={[
                        styles.contactInfo,
                        { borderColor: colors.border },
                      ]}
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
                      style={[
                        styles.viewButtonText,
                        { color: colors.background },
                      ]}
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

            {hasMore && (
              <TouchableOpacity
                style={[
                  styles.loadMoreButton,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={handleLoadMore}
                disabled={loading}
              >
                {loading ? (
                  <Text
                    style={[
                      styles.loadMoreText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Loading...
                  </Text>
                ) : (
                  <>
                    <Text
                      style={[styles.loadMoreText, { color: colors.primary }]}
                    >
                      Show More
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={colors.primary}
                    />
                  </>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
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
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    title: {
      ...typography.h2,
      color: colors.text,
      fontWeight: "800",
    },
    searchIconButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-start",
      paddingTop: 100,
    },
    modalContent: {
      margin: spacing.lg,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 10,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.lg,
    },
    modalTitle: {
      ...typography.h2,
      fontWeight: "700",
    },
    searchWrapper: {
      marginBottom: spacing.md,
    },
    filtersRow: {
      flexDirection: "row",
      gap: spacing.xs,
    },
    filterChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
    },
    filterChipText: {
      ...typography.bodySmall,
      fontWeight: "600",
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
      color: colors.text,
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
      color: colors.text,
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
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.xxl * 2,
      paddingHorizontal: spacing.xl,
    },
    emptyTitle: {
      ...typography.h2,
      fontWeight: "700",
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
      textAlign: "center",
    },
    emptyMessage: {
      ...typography.body,
      textAlign: "center",
      lineHeight: 22,
    },
    loadMoreButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.md,
      marginHorizontal: spacing.lg,
      marginVertical: spacing.md,
      borderWidth: 1,
    },
    loadMoreText: {
      ...typography.bodySmall,
      fontWeight: "600",
      marginRight: spacing.xs,
    },
  });
