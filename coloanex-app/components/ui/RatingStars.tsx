import { View, Text, StyleSheet } from "react-native";

interface RatingStarsProps {
  rating: number;
  size?: number;
}

export default function RatingStars({ rating, size = 16 }: RatingStarsProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.star, { fontSize: size }]}>⭐</Text>
      <Text style={styles.rating}>{rating.toFixed(1)}</Text>
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
    color: "#111827",
  },
});
