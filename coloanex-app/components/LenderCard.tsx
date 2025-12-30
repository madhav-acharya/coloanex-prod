import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Card, LenderLogo, RatingStars, Button } from "./ui";
import { formatCurrencyShort } from "@/utils/currency";

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

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.lenderInfo}>
          <LenderLogo name={name} size={48} verified={verified} />
          <View style={styles.nameContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{name}</Text>
              {verified && <Text style={styles.verified}>✓</Text>}
            </View>
          </View>
        </View>
        <RatingStars rating={rating} />
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{interestRate}%</Text>
          <Text style={styles.statLabel}>Interest Rate</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {formatCurrencyShort(minAmount)}-{formatCurrencyShort(maxAmount)}
          </Text>
          <Text style={styles.statLabel}>Amount</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{successRate}%</Text>
          <Text style={styles.statLabel}>Success Rate</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.responseTime}>
          <Text style={styles.clockIcon}>🕐</Text>
          <Text style={styles.responseText}>{responseTime}</Text>
        </View>
        <Button
          title="View Details"
          onPress={() => router.push(`/lender/${id}`)}
          size="small"
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  lenderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  nameContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  verified: {
    fontSize: 16,
    color: "#10B981",
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 16,
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10B981",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  responseTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  clockIcon: {
    fontSize: 14,
  },
  responseText: {
    fontSize: 13,
    color: "#6B7280",
  },
});
