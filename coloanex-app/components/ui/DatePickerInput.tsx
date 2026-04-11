import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Modal,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

interface DatePickerInputProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  required?: boolean;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

export default function DatePickerInput({
  label,
  value,
  onChange,
  required = false,
  placeholder = "Select date",
  minimumDate,
  maximumDate,
}: DatePickerInputProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [show, setShow] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return placeholder;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleWebDateChange = (e: any) => {
    const dateStr = e.target.value;
    if (dateStr) {
      const selectedDate = new Date(dateStr);
      onChange(selectedDate);
    }
  };

  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        <View style={styles.webInputWrapper}>
          <input
            type="date"
            value={formatDateForInput(value)}
            onChange={handleWebDateChange}
            min={minimumDate ? formatDateForInput(minimumDate) : undefined}
            max={maximumDate ? formatDateForInput(maximumDate) : undefined}
            style={{
              width: "100%",
              padding: 12,
              fontSize: 15,
              fontWeight: "400",
              border: `2px solid ${colors.border}`,
              borderRadius: 12,
              backgroundColor: colors.card,
              color: colors.text,
              fontFamily:
                "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          />
        </View>
      </View>
    );
  }

  // Dynamic require keeps web bundle behavior unchanged while using native picker on mobile.
  const DateTimePicker =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@react-native-community/datetimepicker").default;

  const handleChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShow(false);
    }
    if (event.type === "set" && selectedDate) {
      onChange(selectedDate);
      if (Platform.OS === "ios") {
        setShow(false);
      }
    } else if (event.type === "dismissed") {
      setShow(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TouchableOpacity style={styles.input} onPress={() => setShow(true)}>
        <Text style={[styles.text, !value && styles.placeholder]}>
          {formatDate(value)}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={colors.text} />
      </TouchableOpacity>

      {Platform.OS === "ios" ? (
        <Modal visible={show} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => {
                    setShow(false);
                  }}
                >
                  <Text style={styles.modalButton}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={value || new Date()}
                mode="date"
                display="spinner"
                onChange={handleChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
              />
            </View>
          </View>
        </Modal>
      ) : (
        show && (
          <DateTimePicker
            value={value || new Date()}
            mode="date"
            display="default"
            onChange={handleChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
          />
        )
      )}
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      marginBottom: 20,
      width: "92%",
    },
    label: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 10,
    },
    required: {
      color: colors.error,
    },
    input: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      backgroundColor: colors.card,
    },
    text: {
      fontSize: 15,
      fontWeight: "400",
      color: colors.text,
    },
    placeholder: {
      color: colors.textLight,
    },
    webInputWrapper: {
      width: "100%",
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 20,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "flex-end",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalButton: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.primary,
    },
  });
