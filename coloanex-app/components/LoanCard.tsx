import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Card, LenderLogo, Button } from "./ui";
import { formatCurrency as formatNPR } from "@/utils/currency";
import { useTheme } from "@/hooks/useTheme";

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
  const { colors } = useTheme();

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
              <Text style={[styles.lenderName, { color: colors.text }]}>
                {lenderName}
              </Text>
              <Text style={styles.verified}>✓</Text>
            </View>
            <Text style={[styles.loanType, { color: colors.textSecondary }]}>
              {loanType}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.amounts}>
        <View style={styles.amountItem}>
          <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
            Loan Amount
          </Text>
          <Text style={[styles.amountValue, { color: colors.text }]}>
            {formatCurrency(amount)}
          </Text>
        </View>
        <View style={styles.amountItem}>
          <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
            Interest Rate
          </Text>
          <Text style={[styles.amountValue, { color: colors.text }]}>
            {interestRate}%
          </Text>
        </View>
      </View>

      <View style={styles.amounts}>
        <View style={styles.amountItem}>
          <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
            Remaining Balance
          </Text>
          <Text style={[styles.remainingBalance, { color: colors.error }]}>
            {formatCurrency(remainingBalance)}
          </Text>
        </View>
        <View style={styles.amountItem}>
          <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
            Monthly Payment
          </Text>
          <Text style={[styles.amountValue, { color: colors.text }]}>
            {formatCurrency(monthlyPayment)}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${percentagePaid}%`, backgroundColor: colors.primary },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          {percentagePaid}% paid
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.dueDate, { color: colors.textSecondary }]}>
          Due Date: {formatDate(dueDate)}
        </Text>
        <Button
          title="Make Payment"
          onPress={() => router.push(`/repayment/make-repayment?id=${id}`)}
          size="small"
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  header: {
    marginBottom: 20,
  },
  lenderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lenderName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  verified: {
    fontSize: 16,
    color: "#16A34A",
    fontWeight: "700",
  },
  loanType: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500",
  },
  amounts: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  amountItem: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  remainingBalance: {
    fontSize: 16,
    fontWeight: "700",
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 10,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
  },
  progressText: {
    fontSize: 13,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
  },
  dueDate: {
    fontSize: 13,
    fontWeight: "600",
  },
  viewButton: {
    fontSize: 13,
    fontWeight: "500",
  },
});
