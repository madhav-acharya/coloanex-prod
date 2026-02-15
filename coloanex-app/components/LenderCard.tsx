import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Card, LenderLogo, RatingStars, Button } from "./ui";
import { formatCurrencyShort } from "@/utils/currency";
import { useTheme } from "@/hooks/useTheme";

interface LenderCardProps {
  id: string;
  name: string;
  interestRate: number;
  minAmount: number;
  maxAmount: number;
  successRate: number;
  rating: number;
  responseTime: string;
  verified?: boolean;
}

export default function LenderCard({
  id,
  name,
  interestRate,
  minAmount,
  maxAmount,
  successRate,
  rating,
  responseTime,
  verified = false,
}: LenderCardProps) {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.lenderInfo}>
          <LenderLogo name={name} size={48} verified={verified} />
          <View style={styles.nameContainer}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
              {verified && (
                <Text style={[styles.verified, { color: colors.primary }]}>
                  ✓
                </Text>
              )}
            </View>
          </View>
        </View>
        <RatingStars rating={rating} />
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {interestRate}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Interest Rate
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {formatCurrencyShort(minAmount)}-{formatCurrencyShort(maxAmount)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Amount
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {successRate}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Success Rate
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.responseTime}>
          <Text style={styles.clockIcon}>🕐</Text>
          <Text style={[styles.responseText, { color: colors.textSecondary }]}>
            {responseTime}
          </Text>
        </View>
        <Button
          title="View Details"
          onPress={() => router.push(`/lenders/lender-details?id=${id}`)}
          size="small"
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  lenderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  nameContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontSize: 19,
    fontWeight: "700",
  },
  verified: {
    fontSize: 18,
    fontWeight: "700",
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 16,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  responseTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  clockIcon: {
    fontSize: 16,
  },
  responseText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
