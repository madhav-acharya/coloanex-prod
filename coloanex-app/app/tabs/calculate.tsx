import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import Slider from "@react-native-community/slider";
import { Card, Button } from "@/components/ui";
import { colors, spacing, typography, borderRadius } from "@/constants/theme";
import { loansApi } from "@/api";
import { formatCurrency } from "@/utils/currency";

export default function CalculateScreen() {
  const [amount, setAmount] = useState(20000);
  const [interestRate, setInterestRate] = useState(5.9);
  const [term, setTerm] = useState(24);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  const calculateLoan = async () => {
    const payment = await loansApi.calculatePayment(amount, interestRate, term);
    setMonthlyPayment(payment);
    setTotalAmount(payment * term);
  };

  React.useEffect(() => {
    calculateLoan();
  }, [amount, interestRate, term]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Loan Calculator</Text>
        <Text style={styles.subtitle}>Calculate your monthly payment</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.section}>
          <Text style={styles.label}>Loan Amount</Text>
          <Text style={styles.value}>{formatCurrency(amount)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={5000}
            maximumValue={50000}
            step={1000}
            value={amount}
            onValueChange={setAmount}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
          <View style={styles.range}>
            <Text style={styles.rangeText}>Rs 5,000</Text>
            <Text style={styles.rangeText}>Rs 50,000</Text>
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.label}>Interest Rate (%)</Text>
          <Text style={styles.value}>{interestRate.toFixed(1)}%</Text>
          <Slider
            style={styles.slider}
            minimumValue={3}
            maximumValue={15}
            step={0.1}
            value={interestRate}
            onValueChange={setInterestRate}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
          <View style={styles.range}>
            <Text style={styles.rangeText}>3.0%</Text>
            <Text style={styles.rangeText}>15.0%</Text>
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.label}>Loan Term (months)</Text>
          <Text style={styles.value}>{term} months</Text>
          <Slider
            style={styles.slider}
            minimumValue={6}
            maximumValue={60}
            step={6}
            value={term}
            onValueChange={setTerm}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
          <View style={styles.range}>
            <Text style={styles.rangeText}>6 months</Text>
            <Text style={styles.rangeText}>60 months</Text>
          </View>
        </Card>

        <Card style={[styles.section, styles.resultCard]}>
          <Text style={styles.resultTitle}>Estimated Monthly Payment</Text>
          <Text style={styles.resultAmount}>
            {formatCurrency(monthlyPayment)}
          </Text>
          <View style={styles.resultDetails}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Interest Rate</Text>
              <Text style={styles.resultValue}>{interestRate.toFixed(1)}%</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Total Amount</Text>
              <Text style={styles.resultValue}>
                {formatCurrency(totalAmount)}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Duration</Text>
              <Text style={styles.resultValue}>{term} months</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  section: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  range: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rangeText: {
    ...typography.caption,
    color: colors.textLight,
  },
  resultCard: {
    backgroundColor: colors.primary,
  },
  resultTitle: {
    ...typography.body,
    color: colors.background,
    marginBottom: spacing.sm,
  },
  resultAmount: {
    ...typography.h1,
    fontSize: 40,
    color: colors.background,
    marginBottom: spacing.lg,
  },
  resultDetails: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  resultLabel: {
    ...typography.bodySmall,
    color: colors.background,
    opacity: 0.8,
  },
  resultValue: {
    ...typography.bodySmall,
    fontWeight: "600",
    color: colors.background,
  },
});
