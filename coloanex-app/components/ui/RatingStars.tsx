import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface RatingStarsProps {
  rating: number;
  size?: number;
}

export default function RatingStars({ rating, size = 16 }: RatingStarsProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.star, { fontSize: size }]}>⭐</Text>
      <Text style={[styles.rating, { color: colors.text }]}>
        {rating.toFixed(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  star: {
    color: "#FCD34D",
  },
  rating: {
    fontSize: 14,
    fontWeight: "600",
  },
});
