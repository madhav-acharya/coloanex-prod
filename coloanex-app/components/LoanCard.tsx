import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Card, LenderLogo, Button } from "./ui";
import { formatCurrency as formatNPR } from "@/utils/currency";

interface LoanCardProps {
  id: string;
  lenderName: string;
  loanType: string;
  amount: number;
  remainingBalance: number;
  monthlyPayment: number;
  interestRate: number;
  dueDate: string;
  percentagePaid: number;
}

export default function LoanCard({
  id,
  lenderName,
  loanType,
  amount,
  remainingBalance,
  monthlyPayment,
  interestRate,
  dueDate,
  percentagePaid,
}: LoanCardProps) {
  const router = useRouter();

  const formatCurrency = (value: number) => {
    return formatNPR(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.lenderInfo}>
          <LenderLogo name={lenderName} size={40} />
          <View>
            <View style={styles.nameRow}>
              <Text style={styles.lenderName}>{lenderName}</Text>
              <Text style={styles.verified}>✓</Text>
            </View>
            <Text style={styles.loanType}>{loanType}</Text>
          </View>
        </View>
      </View>

      <View style={styles.amounts}>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Loan Amount</Text>
          <Text style={styles.amountValue}>{formatCurrency(amount)}</Text>
        </View>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Interest Rate</Text>
          <Text style={styles.amountValue}>{interestRate}%</Text>
        </View>
      </View>

      <View style={styles.amounts}>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Remaining Balance</Text>
          <Text style={styles.remainingBalance}>
            {formatCurrency(remainingBalance)}
          </Text>
        </View>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Monthly Payment</Text>
          <Text style={styles.amountValue}>
            {formatCurrency(monthlyPayment)}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${percentagePaid}%` }]}
          />
        </View>
        <Text style={styles.progressText}>{percentagePaid}% paid</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.dueDate}>Due Date: {formatDate(dueDate)}</Text>
        <Button
          title="Make Payment"
          onPress={() => router.push(`/repayment/${id}`)}
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
    marginBottom: 16,
  },
  lenderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  lenderName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  verified: {
    fontSize: 14,
    color: "#10B981",
  },
  loanType: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  amounts: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  amountItem: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  remainingBalance: {
    fontSize: 15,
    fontWeight: "700",
    color: "#10B981",
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10B981",
  },
  progressText: {
    fontSize: 12,
    color: "#6B7280",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  dueDate: {
    fontSize: 13,
    fontWeight: "500",
    color: "#111827",
  },
});
