import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Text,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { spacing, typography, borderRadius } from "@/constants/theme";

interface SearchSuggestion {
  id: string;
  label: string;
  subtitle?: string;
}

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  getSuggestions?: (query: string) => Promise<SearchSuggestion[]>;
  debounceMs?: number;
}

export default function SearchBar({
  placeholder = "Search...",
  onSearch,
  onSuggestionSelect,
  getSuggestions,
  debounceMs = 300,
}: SearchBarProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<number | null>(null);

  useEffect(() => {
    if (query.trim() && getSuggestions) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(async () => {
        try {
          const results = await getSuggestions(query);
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        } catch (error) {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }, debounceMs);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, getSuggestions, debounceMs]);

  const handleSearch = () => {
    onSearch(query);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const handleSuggestionPress = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.label);
    onSearch(suggestion.label);
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    onSearch("");
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSuggestionPress(item)}
              >
                <Ionicons
                  name="search"
                  size={16}
                  color={colors.textSecondary}
                />
                <View style={styles.suggestionContent}>
                  <Text style={styles.suggestionLabel}>{item.label}</Text>
                  {item.subtitle && (
                    <Text style={styles.suggestionSubtitle}>
                      {item.subtitle}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      position: "relative",
      zIndex: 1000,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    input: {
      flex: 1,
      marginLeft: spacing.sm,
      ...typography.body,
      color: colors.text,
    },
    clearButton: {
      padding: spacing.xs,
    },
    suggestionsContainer: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      marginTop: spacing.xs,
      maxHeight: 250,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    suggestionItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    suggestionContent: {
      flex: 1,
      marginLeft: spacing.sm,
    },
    suggestionLabel: {
      ...typography.body,
      color: colors.text,
      fontWeight: "500",
    },
    suggestionSubtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });
