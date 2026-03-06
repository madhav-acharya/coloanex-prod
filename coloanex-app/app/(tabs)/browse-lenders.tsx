import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { spacing, borderRadius } from "@/constants/theme";
import { lendersApi } from "@/api";
import type { Lender } from "@/types";
import { useTheme } from "@/hooks/useTheme";

const FILTERS = [
  { key: "All", label: "All" },
  { key: "Active", label: "Active" },
  { key: "Inactive", label: "Inactive" },
];

const LIMIT = 12;

export default function BrowseScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLenders = useCallback(
    async (reset: boolean, query: string, filter: string) => {
      if (loading && !reset) return;
      setLoading(true);
      try {
        const currentOffset = reset ? 0 : offset;
        const params: {
          limit: number;
          offset: number;
          search?: string;
          isActive?: boolean;
        } = { limit: LIMIT, offset: currentOffset };
        if (query.trim()) params.search = query.trim();
        if (filter === "Active") params.isActive = true;
        if (filter === "Inactive") params.isActive = false;
        const result = await lendersApi.getAll(params);
        setLenders((prev) => (reset ? result.data : [...prev, ...result.data]));
        setOffset(reset ? LIMIT : currentOffset + LIMIT);
        setHasMore(result.hasMore);
        if (result.total !== undefined) setTotalCount(result.total);
      } catch {
      } finally {
        setLoading(false);
      }
    },
    [loading, offset],
  );

  useEffect(() => {
    setOffset(0);
    setLenders([]);
    fetchLenders(true, searchQuery, selectedFilter);
  }, [selectedFilter]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setOffset(0);
      setLenders([]);
      fetchLenders(true, text, selectedFilter);
    }, 400);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) fetchLenders(false, searchQuery, selectedFilter);
  };

  const renderLenderCard = ({ item }: { item: Lender }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: "/lenders/lender-details",
          params: { id: item.id },
        })
      }
    >
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
          {item.logo ? (
            <Image source={{ uri: item.logo }} style={styles.avatarImg} />
          ) : (
            <Text style={[styles.avatarInitial, { color: colors.primary }]}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.cardInfo}>
          <Text
            style={[styles.cardName, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: item.isActive ? "#D1FAE5" : colors.surface },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: item.isActive ? "#16A34A" : colors.textLight,
                },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: item.isActive ? "#16A34A" : colors.textSecondary },
              ]}
            >
              {item.isActive ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
      </View>

      {(item.contactEmail || item.contactPhone || item.address) && (
        <View style={[styles.cardMeta, { borderTopColor: colors.border }]}>
          {item.contactEmail && (
            <View style={styles.metaRow}>
              <Ionicons
                name="mail-outline"
                size={12}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.metaText, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.contactEmail}
              </Text>
            </View>
          )}
          {item.contactPhone && (
            <View style={styles.metaRow}>
              <Ionicons
                name="call-outline"
                size={12}
                color={colors.textSecondary}
              />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {item.contactPhone}
              </Text>
            </View>
          )}
          {item.address && (
            <View style={styles.metaRow}>
              <Ionicons
                name="location-outline"
                size={12}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.metaText, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.address}
              </Text>
            </View>
          )}
        </View>
      )}

      <View
        style={[styles.cardFooter, { backgroundColor: colors.primaryLight }]}
      >
        <Text style={[styles.cardFooterText, { color: colors.primary }]}>
          View Details & Apply
        </Text>
        <Ionicons name="arrow-forward" size={14} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!hasMore && lenders.length > 0) {
      return (
        <View style={styles.endRow}>
          <Text style={[styles.endText, { color: colors.textLight }]}>
            All {lenders.length} lenders loaded
          </Text>
        </View>
      );
    }
    if (hasMore && lenders.length > 0) {
      return (
        <TouchableOpacity
          style={[
            styles.loadMoreBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={handleLoadMore}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                Load More
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.primary} />
            </>
          )}
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
          <Ionicons
            name="business-outline"
            size={40}
            color={colors.textLight}
          />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No Lenders Found
        </Text>
        <Text style={[styles.emptyMsg, { color: colors.textSecondary }]}>
          {searchQuery
            ? `No results for "${searchQuery}"`
            : "Try adjusting your filters"}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Browse Lenders
            </Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              {totalCount > 0
                ? `${totalCount} lenders available`
                : "Find the right lender for you"}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by name..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={handleSearchChange}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearchChange("")}>
              <Ionicons
                name="close-circle"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filtersRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                { backgroundColor: colors.surface, borderColor: colors.border },
                selectedFilter === f.key && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setSelectedFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: colors.textSecondary },
                  selectedFilter === f.key && { color: colors.buttonText },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading && lenders.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={lenders}
          keyExtractor={(item) => item.id}
          renderItem={renderLenderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
    },
    headerTop: { marginBottom: spacing.sm },
    headerTitle: { fontSize: 24, fontWeight: "800" },
    headerSub: { fontSize: 12, fontWeight: "500", marginTop: 2 },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderWidth: 1,
      marginBottom: spacing.sm,
    },
    searchInput: { flex: 1, fontSize: 14, fontWeight: "500", padding: 0 },
    filtersRow: { flexDirection: "row", gap: spacing.xs, paddingBottom: 4 },
    filterChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: borderRadius.full,
      borderWidth: 1,
    },
    filterChipText: { fontSize: 12, fontWeight: "600" },
    listContent: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xl,
    },
    card: {
      borderRadius: borderRadius.lg,
      marginBottom: spacing.sm,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.md,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    avatarImg: { width: "100%", height: "100%" },
    avatarInitial: { fontSize: 20, fontWeight: "800" },
    cardInfo: { flex: 1 },
    cardName: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      alignSelf: "flex-start",
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 11, fontWeight: "600" },
    cardMeta: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
      borderTopWidth: 1,
      paddingTop: spacing.sm,
      gap: 4,
    },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    metaText: { fontSize: 12, fontWeight: "500", flex: 1 },
    cardFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
    },
    cardFooterText: { fontSize: 13, fontWeight: "700" },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    loadMoreBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      marginHorizontal: spacing.md,
      marginBottom: spacing.lg,
    },
    loadMoreText: { fontSize: 14, fontWeight: "600" },
    endRow: { alignItems: "center", paddingVertical: spacing.md },
    endText: { fontSize: 12, fontWeight: "500" },
    emptyState: {
      alignItems: "center",
      paddingTop: 80,
      paddingHorizontal: spacing.xl,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
    },
    emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
    emptyMsg: {
      fontSize: 13,
      fontWeight: "500",
      textAlign: "center",
      lineHeight: 20,
    },
  });
