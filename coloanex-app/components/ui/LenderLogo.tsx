import { View, Image, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

interface LenderLogoProps {
  source?: any;
  logo?: string;
  name: string;
  size?: number;
  verified?: boolean;
}

export default function LenderLogo({
  source,
  logo,
  name,
  size = 56,
  verified,
}: LenderLogoProps) {
  const { colors } = useTheme();
  const imageSource = source || (logo ? { uri: logo } : null);

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        {imageSource ? (
          <Image source={imageSource} style={styles.image} />
        ) : (
          <View
            style={[
              styles.placeholder,
              { width: size, height: size, borderRadius: size / 2 },
            ]}
          >
            <Text
              style={[
                styles.placeholderText,
                { color: colors.buttonText || "#FFFFFF" },
              ]}
            >
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      {verified && (
        <View style={[styles.verifiedBadge, { backgroundColor: colors.card }]}>
          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
  },
  container: {
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: "600",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    borderRadius: 10,
  },
});
