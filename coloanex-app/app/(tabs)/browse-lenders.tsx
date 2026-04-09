import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
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
  Animated,
  Pressable,
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<TextInput | null>(null);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const searchScale = useRef(new Animated.Value(0.98)).current;
  const searchTranslate = useRef(new Animated.Value(-8)).current;

  const suggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    const seen = new Set<string>();
    return lenders
      .filter((item) => item.name.toLowerCase().includes(query))
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .slice(0, 6);
  }, [lenders, searchQuery]);

  const fetchLenders = useCallback(
    async (query: string, filter: string, page: number = 1) => {
      if (loading) return;
      setLoading(true);
      try {
        const currentOffset = (page - 1) * LIMIT;
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
        setLenders(result.data);
        if (result.total !== undefined) setTotalCount(result.total);
      } catch {
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  useEffect(() => {
    setCurrentPage(1);
    fetchLenders(searchQuery, selectedFilter, 1);
  }, [selectedFilter]);

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  const openSearchOverlay = () => {
    setSearchActive(true);
    setShowSuggestions(searchQuery.trim().length > 0);
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(searchScale, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(searchTranslate, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      searchInputRef.current?.focus();
    });
  };

  const closeSearchOverlay = () => {
    setShowSuggestions(false);
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(searchScale, {
        toValue: 0.98,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(searchTranslate, {
        toValue: -8,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => setSearchActive(false));
  };

  const executeSearch = (value = searchQuery, shouldClose = false) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    const query = value.trim();
    setSearchQuery(value);
    setShowSuggestions(false);
    setCurrentPage(1);
    fetchLenders(query, selectedFilter, 1);
    if (shouldClose) closeSearchOverlay();
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setShowSuggestions(text.trim().length > 0);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      executeSearch(text, false);
    }, 2000);
  };

  const handleSuggestionPress = (name: string) => {
    executeSearch(name, true);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT));

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    fetchLenders(searchQuery, selectedFilter, page);
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
        style={[
          styles.cardFooter,
          {
            backgroundColor: colors.primaryLight,
            borderTopColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.cardFooterText, { color: colors.primary }]}>
          View Details
        </Text>
        <Ionicons name="arrow-forward" size={14} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (lenders.length === 0) return null;

    return (
      <View style={styles.paginationRow}>
        <TouchableOpacity
          style={[
            styles.pageButton,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: currentPage === 1 ? 0.5 : 1,
            },
          ]}
          disabled={currentPage === 1}
          onPress={() => handlePageChange(currentPage - 1)}
        >
          <Text style={[styles.pageButtonText, { color: colors.text }]}>
            Previous
          </Text>
        </TouchableOpacity>

        <Text style={[styles.pageInfo, { color: colors.textSecondary }]}>
          Page {currentPage} / {totalPages}
        </Text>

        <TouchableOpacity
          style={[
            styles.pageButton,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: currentPage === totalPages ? 0.5 : 1,
            },
          ]}
          disabled={currentPage === totalPages}
          onPress={() => handlePageChange(currentPage + 1)}
        >
          <Text style={[styles.pageButtonText, { color: colors.text }]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    );
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

        <TouchableOpacity
          activeOpacity={0.9}
          style={[
            styles.searchTrigger,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={openSearchOverlay}
        >
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <Text
            style={[
              styles.searchTriggerText,
              { color: searchQuery ? colors.text : colors.textLight },
            ]}
            numberOfLines={1}
          >
            {searchQuery || "Search tenants by name"}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
        </TouchableOpacity>

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
        />
      )}

      {searchActive && (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.searchOverlay, { opacity: overlayOpacity }]}
        >
          <Pressable
            style={styles.backdropPressArea}
            onPress={closeSearchOverlay}
          />
          <Animated.View
            style={[
              styles.searchFloatingCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                transform: [
                  { translateY: searchTranslate },
                  { scale: searchScale },
                ],
              },
            ]}
          >
            <View
              style={[
                styles.searchBox,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <TextInput
                ref={searchInputRef}
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search tenants"
                placeholderTextColor={colors.textLight}
                value={searchQuery}
                onChangeText={handleSearchChange}
                onFocus={() =>
                  setShowSuggestions(searchQuery.trim().length > 0)
                }
                returnKeyType="search"
                onSubmitEditing={() => executeSearch(searchQuery, true)}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    if (searchTimeout.current)
                      clearTimeout(searchTimeout.current);
                    setSearchQuery("");
                    executeSearch("", false);
                  }}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.searchActionBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => executeSearch(searchQuery, true)}
              >
                <Ionicons name="search" size={16} color={colors.buttonText} />
              </TouchableOpacity>
            </View>

            {showSuggestions && suggestions.length > 0 && (
              <View
                style={[
                  styles.suggestionsCard,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                {suggestions.map((item, idx) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.suggestionItem,
                      idx < suggestions.length - 1 && {
                        borderBottomColor: colors.border,
                      },
                    ]}
                    onPress={() => handleSuggestionPress(item.name)}
                  >
                    <Ionicons
                      name="business-outline"
                      size={14}
                      color={colors.primary}
                    />
                    <Text
                      style={[styles.suggestionText, { color: colors.text }]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Animated.View>
        </Animated.View>
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
    },
    searchTrigger: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: 11,
      borderWidth: 1,
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    searchTriggerText: { flex: 1, fontSize: 14, fontWeight: "500" },
    searchInput: { flex: 1, fontSize: 14, fontWeight: "500", padding: 0 },
    searchActionBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    suggestionsCard: {
      borderRadius: borderRadius.md,
      borderWidth: 1,
      marginTop: spacing.sm,
      overflow: "hidden",
    },
    suggestionItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderBottomWidth: 1,
    },
    suggestionText: { fontSize: 13, fontWeight: "500" },
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
    searchOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 100,
      justifyContent: "flex-start",
      paddingHorizontal: spacing.md,
      paddingTop: 86,
      backgroundColor: "rgba(2, 6, 23, 0.58)",
    },
    backdropPressArea: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    searchFloatingCard: {
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      padding: spacing.sm,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 14,
      elevation: 8,
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    paginationRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginHorizontal: spacing.md,
      marginBottom: spacing.lg,
      marginTop: spacing.sm,
      gap: spacing.sm,
    },
    pageButton: {
      borderWidth: 1,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    pageButtonText: {
      fontSize: 12,
      fontWeight: "600",
    },
    pageInfo: {
      fontSize: 12,
      fontWeight: "600",
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
