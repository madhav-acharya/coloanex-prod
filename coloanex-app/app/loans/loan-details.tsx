import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { spacing, typography, borderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { loansApi, contractsApi, paymentSchedulesApi } from "@/api";
import { useToast, AppHeader, CurrencyIcon } from "@/components/ui";
import type { Loan } from "@/types";
import type { Contract } from "@/api/contractsApi";
import type { PaymentSchedule } from "@/api/paymentSchedulesApi";
import { LoanStatus } from "@/types/loan";
import { formatCurrency } from "@/utils/currency";

function DetailRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: Record<string, string>;
}) {
  return (
    <View style={[detailRowStyle.row, { borderBottomColor: colors.border }]}>
      <Text style={[detailRowStyle.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[detailRowStyle.value, { color: colors.text }]}>
        {value}
      </Text>
    </View>
  );
}

function CurrencyDetailRow({
  label,
  amount,
  colors,
}: {
  label: string;
  amount: number | null | undefined;
  colors: Record<string, string>;
}) {
  const safeAmount = amount ?? 0;

  return (
    <View style={[detailRowStyle.row, { borderBottomColor: colors.border }]}>
      <Text style={[detailRowStyle.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <View style={{ alignItems: "flex-end" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <CurrencyIcon size={14} color="#16A34A" />
          <Text
            style={[
              detailRowStyle.value,
              { color: colors.text, marginLeft: 4 },
            ]}
          >
            {safeAmount.toLocaleString("en-NP")}
          </Text>
        </View>
      </View>
    </View>
  );
}

const detailRowStyle = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  label: { fontSize: 13, fontWeight: "500", flex: 1 },
  value: { fontSize: 13, fontWeight: "600", flex: 1, textAlign: "right" },
});

function SectionCard({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: Record<string, string>;
}) {
  return (
    <View style={[sectionCardStyle.card, { backgroundColor: colors.card }]}>
      <Text style={[sectionCardStyle.title, { color: colors.text }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const sectionCardStyle = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
});

function getLoanStatusConfig(status: string) {
  const map: Record<
    string,
    {
      label: string;
      color: string;
      bg: string;
      icon: keyof typeof Ionicons.glyphMap;
    }
  > = {
    DRAFT: {
      label: "Draft",
      color: "#6B7280",
      bg: "#F3F4F6",
      icon: "document-outline",
    },
    SUBMITTED: {
      label: "Submitted",
      color: "#6366F1",
      bg: "#EEF2FF",
      icon: "paper-plane-outline",
    },
    UNDER_REVIEW: {
      label: "Under Review",
      color: "#F59E0B",
      bg: "#FEF3C7",
      icon: "time-outline",
    },
    APPROVED: {
      label: "Approved",
      color: "#16A34A",
      bg: "#D1FAE5",
      icon: "checkmark-circle-outline",
    },
    REJECTED: {
      label: "Rejected",
      color: "#DC2626",
      bg: "#FEF2F2",
      icon: "close-circle-outline",
    },
    CONTRACT_GENERATED: {
      label: "Contract Ready",
      color: "#6366F1",
      bg: "#EEF2FF",
      icon: "document-text-outline",
    },
    CONTRACT_SIGNED: {
      label: "Contract Signed",
      color: "#16A34A",
      bg: "#D1FAE5",
      icon: "shield-checkmark-outline",
    },
    LOAN_PROVIDED: {
      label: "Loan Provided",
      color: "#16A34A",
      bg: "#D1FAE5",
      icon: "trending-up-outline",
    },
    PARTIALLY_PAID: {
      label: "Partially Paid",
      color: "#F59E0B",
      bg: "#FEF3C7",
      icon: "time-outline",
    },
    PAID: {
      label: "Paid",
      color: "#16A34A",
      bg: "#D1FAE5",
      icon: "checkmark-circle-outline",
    },
  };
  return (
    map[status] ?? {
      label: status,
      color: "#6B7280",
      bg: "#F3F4F6",
      icon: "ellipse-outline",
    }
  );
}

function getScheduleStatusConfig(status: string) {
  if (status === "PAID")
    return { label: "Paid", color: "#16A34A", bg: "#D1FAE5" };
  if (status === "OVERDUE")
    return { label: "Overdue", color: "#DC2626", bg: "#FEF2F2" };
  if (status === "PARTIALLY_PAID")
    return { label: "Partially Paid", color: "#F59E0B", bg: "#FEF3C7" };
  return { label: "Pending", color: "#6B7280", bg: "#F3F4F6" };
}

export default function LoanDetailsScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [schedule, setSchedule] = useState<PaymentSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const formatCurrencyWithIcon = (
    value: number | null | undefined,
    isPositive: boolean = true,
    size: number = 16,
  ) => {
    const safeValue = value ?? 0;
    const color = isPositive ? "#16A34A" : "#DC2626";
    // Format number without currency symbol
    const formattedValue = safeValue.toLocaleString("en-NP");
    return (
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <CurrencyIcon size={size} color={color} />
        <Text
          style={[
            { fontSize: size, fontWeight: "700" },
            { color, marginLeft: 4 },
          ]}
        >
          {formattedValue}
        </Text>
      </View>
    );
  };

  const formatCurrencyInline = (value: number | null | undefined) => {
    const safeValue = value ?? 0;
    return safeValue.toLocaleString("en-NP");
  };

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const loanData = await loansApi.getById(id);
      setLoan(loanData);

      // Try multiple strategies to find the contract for this loan
      let matched: Contract | null = null;

      // Strategy 1: query param filter
      try {
        matched = await contractsApi.getByLoanId(id);
      } catch {}

      // Strategy 2: fetch all borrower contracts and find by loanId
      if (!matched) {
        try {
          const contracts = await contractsApi.getAll();
          const list: Contract[] = Array.isArray(contracts)
            ? contracts
            : ((contracts as any)?.data ?? []);
          matched =
            list.find((c) => c.loanId === id || c.loan?.id === id) ?? null;
        } catch {}
      }

      setContract(matched);

      if (matched) {
        try {
          const scheduleData = await paymentSchedulesApi.getByContract(
            matched.id,
          );
          setSchedule(Array.isArray(scheduleData) ? scheduleData : []);
        } catch {}
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!loan) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={{ color: colors.textSecondary }}>Loan not found</Text>
      </View>
    );
  }

  const statusConfig = getLoanStatusConfig(loan.status);
  const lenderName = loan.borrower?.tenant?.name ?? "Lender";
  const amount = loan.approvedAmount ?? loan.requestedAmount;
  const canMakePayment =
    loan.status === LoanStatus.LOAN_PROVIDED ||
    loan.status === LoanStatus.PARTIALLY_PAID;
  const canSignContract = loan.status === LoanStatus.CONTRACT_GENERATED;

  const statusInfo: Record<
    string,
    {
      icon: keyof typeof Ionicons.glyphMap;
      color: string;
      bg: string;
      title: string;
      body: string;
    } | null
  > = {
    DRAFT: {
      icon: "document-outline",
      color: "#6B7280",
      bg: "#F3F4F6",
      title: "Application in Draft",
      body: "Your loan application is saved as a draft. Submit it to the lender to start the review process.",
    },
    SUBMITTED: {
      icon: "paper-plane-outline",
      color: "#6366F1",
      bg: "#EEF2FF",
      title: "Application Submitted",
      body: "Your application has been submitted and is awaiting review by the lender.",
    },
    UNDER_REVIEW: {
      icon: "time-outline",
      color: "#F59E0B",
      bg: "#FEF3C7",
      title: "Under Review",
      body: "The lender is currently reviewing your application. You will be notified once a decision is made.",
    },
    APPROVED: {
      icon: "checkmark-circle-outline",
      color: "#16A34A",
      bg: "#D1FAE5",
      title: "Loan Approved",
      body: "Congratulations! Your loan has been approved. The lender will now generate a contract for you to review and sign.",
    },
    REJECTED: {
      icon: "close-circle-outline",
      color: "#DC2626",
      bg: "#FEF2F2",
      title: "Application Rejected",
      body: loan.rejectionReason
        ? `Your application was rejected. Reason: ${loan.rejectionReason}`
        : "Your application was rejected by the lender. Please contact them for more information.",
    },
    CONTRACT_GENERATED: {
      icon: "document-text-outline",
      color: "#6366F1",
      bg: "#EEF2FF",
      title: "Contract Ready to Sign",
      body: "Your loan contract is ready. Please review and sign it so the lender can proceed to disburse your funds.",
    },
    CONTRACT_SIGNED: {
      icon: "shield-checkmark-outline",
      color: "#16A34A",
      bg: "#D1FAE5",
      title: "Contract Signed",
      body: "You have signed the contract. The lender will now verify and disburse the loan amount to you.",
    },
    LOAN_PROVIDED: {
      icon: "trending-up-outline",
      color: "#16A34A",
      bg: "#D1FAE5",
      title: "Loan Disbursed",
      body: "Your loan has been disbursed. Make timely repayments according to your payment schedule below.",
    },
    PARTIALLY_PAID: {
      icon: "time-outline",
      color: "#F59E0B",
      bg: "#FEF3C7",
      title: "Repayment In Progress",
      body: "You have made partial repayments. Continue making payments to clear the outstanding balance.",
    },
    PAID: {
      icon: "checkmark-circle-outline",
      color: "#16A34A",
      bg: "#D1FAE5",
      title: "Loan Fully Repaid",
      body: "Congratulations! You have fully repaid this loan. Thank you for your timely payments.",
    },
  };

  const currentInfo = statusInfo[loan.status] ?? null;

  const collateral = loan.collateralDetails as Record<string, unknown> | null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Loan Details" showThemeToggle={false} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.heroCard, { backgroundColor: colors.card }]}>
          <View style={styles.heroTop}>
            <View
              style={[
                styles.lenderBadge,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Text style={[styles.lenderInitial, { color: colors.primary }]}>
                {lenderName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.heroMeta}>
              <Text style={[styles.heroLender, { color: colors.text }]}>
                {lenderName}
              </Text>
              <Text style={[styles.heroId, { color: colors.textLight }]}>
                #{loan.id.slice(0, 12).toUpperCase()}
              </Text>
            </View>
            <View
              style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}
            >
              <Ionicons
                name={statusConfig.icon}
                size={13}
                color={statusConfig.color}
              />
              <Text
                style={[styles.statusPillText, { color: statusConfig.color }]}
              >
                {statusConfig.label}
              </Text>
            </View>
          </View>

          <View
            style={[styles.heroDivider, { backgroundColor: colors.border }]}
          />

          <Text
            style={[styles.heroAmountLabel, { color: colors.textSecondary }]}
          >
            {loan.approvedAmount ? "Approved Amount" : "Requested Amount"}
          </Text>
          <View style={{ alignItems: "center" }}>
            {formatCurrencyWithIcon(amount, true)}
          </View>

          <View style={styles.heroStats}>
            <View
              style={[styles.heroStat, { backgroundColor: colors.surface }]}
            >
              <Ionicons
                name="time-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={[styles.heroStatVal, { color: colors.text }]}>
                {(loan as any).approvedTermMonths ?? loan.requestedTermMonths}{" "}
                months
              </Text>
              <Text
                style={[styles.heroStatLbl, { color: colors.textSecondary }]}
              >
                Term
              </Text>
            </View>
            <View
              style={[styles.heroStat, { backgroundColor: colors.surface }]}
            >
              <Ionicons
                name="calendar-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={[styles.heroStatVal, { color: colors.text }]}>
                {new Date(loan.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
              <Text
                style={[styles.heroStatLbl, { color: colors.textSecondary }]}
              >
                Applied
              </Text>
            </View>
            {loan.approvedAmount && (
              <View
                style={[styles.heroStat, { backgroundColor: colors.surface }]}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color={colors.success}
                />
                <View style={{ alignItems: "center" }}>
                  {formatCurrencyWithIcon(loan.approvedAmount ?? 0, true)}
                </View>
                <Text
                  style={[styles.heroStatLbl, { color: colors.textSecondary }]}
                >
                  Approved
                </Text>
              </View>
            )}
          </View>
        </View>

        <SectionCard title="Loan Information" colors={colors}>
          <DetailRow label="Purpose" value={loan.purpose} colors={colors} />
          <CurrencyDetailRow
            label="Requested Amount"
            amount={loan.requestedAmount}
            colors={colors}
          />
          {loan.approvedAmount !== undefined && (
            <CurrencyDetailRow
              label="Approved Amount"
              amount={loan.approvedAmount}
              colors={colors}
            />
          )}
          <DetailRow
            label="Requested Term"
            value={`${loan.requestedTermMonths} months`}
            colors={colors}
          />
          {(loan as any).approvedTermMonths !== undefined && (
            <DetailRow
              label="Approved Term"
              value={`${(loan as any).approvedTermMonths} months`}
              colors={colors}
            />
          )}
          <DetailRow
            label="Status"
            value={statusConfig.label}
            colors={colors}
          />
          <DetailRow
            label="Applied On"
            value={new Date(loan.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            colors={colors}
          />
          <DetailRow
            label="Last Updated"
            value={new Date(loan.updatedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            colors={colors}
          />
          {loan.borrower?.user && (
            <DetailRow
              label="Borrower"
              value={loan.borrower.user.fullName}
              colors={colors}
            />
          )}
        </SectionCard>

        {currentInfo && (
          <View
            style={[
              styles.alertCard,
              {
                backgroundColor: currentInfo.bg,
                borderColor: currentInfo.color + "30",
              },
            ]}
          >
            <Ionicons
              name={currentInfo.icon}
              size={20}
              color={currentInfo.color}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertTitle, { color: currentInfo.color }]}>
                {currentInfo.title}
              </Text>
              <Text style={[styles.alertBody, { color: currentInfo.color }]}>
                {currentInfo.body}
              </Text>
            </View>
          </View>
        )}

        {collateral && Object.keys(collateral).length > 0 && (
          <SectionCard title="Collateral Details" colors={colors}>
            {Object.entries(collateral).map(([key, val]) => {
              const strVal = String(val);
              const label = key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (s) => s.toUpperCase());
              if (
                strVal.startsWith("http") &&
                (strVal.includes(".jpg") ||
                  strVal.includes(".jpeg") ||
                  strVal.includes(".png") ||
                  strVal.includes(".webp") ||
                  strVal.includes("cloudinary") ||
                  strVal.includes("/image/"))
              ) {
                return (
                  <View
                    key={key}
                    style={[
                      styles.collateralImageRow,
                      { borderBottomColor: colors.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.collateralImageLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {label}
                    </Text>
                    <Image
                      source={{ uri: strVal }}
                      style={[
                        styles.collateralImage,
                        { borderColor: colors.border },
                      ]}
                      resizeMode="cover"
                    />
                  </View>
                );
              }
              return (
                <DetailRow
                  key={key}
                  label={label}
                  value={strVal}
                  colors={colors}
                />
              );
            })}
          </SectionCard>
        )}

        {contract && (
          <SectionCard title="Contract" colors={colors}>
            <DetailRow
              label="Contract No."
              value={contract.contractNumber}
              colors={colors}
            />
            <DetailRow label="Status" value={contract.status} colors={colors} />
            <CurrencyDetailRow
              label="Loan Amount"
              amount={contract.loanAmount}
              colors={colors}
            />
            <DetailRow
              label="Interest Rate"
              value={`${contract.interestRate}% p.a.`}
              colors={colors}
            />
            <DetailRow
              label="Term"
              value={`${contract.termMonths} months`}
              colors={colors}
            />
            <DetailRow
              label="Payment Frequency"
              value={contract.paymentFrequency}
              colors={colors}
            />
            {contract.installmentAmount !== undefined && (
              <CurrencyDetailRow
                label="Installment Amount"
                amount={contract.installmentAmount}
                colors={colors}
              />
            )}
            {contract.totalInstallments !== undefined && (
              <DetailRow
                label="Total Installments"
                value={String(contract.totalInstallments)}
                colors={colors}
              />
            )}
            {contract.totalAmountDue !== undefined && (
              <CurrencyDetailRow
                label="Total Amount Due"
                amount={contract.totalAmountDue}
                colors={colors}
              />
            )}
            {contract.totalAmountPaid !== undefined && (
              <CurrencyDetailRow
                label="Amount Paid"
                amount={contract.totalAmountPaid}
                colors={colors}
              />
            )}
            <CurrencyDetailRow
              label="Outstanding Balance"
              amount={contract.outstandingBalance}
              colors={colors}
            />
            <DetailRow
              label="Start Date"
              value={new Date(contract.startDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              colors={colors}
            />
            {contract.endDate && (
              <DetailRow
                label="End Date"
                value={new Date(contract.endDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                colors={colors}
              />
            )}
            {contract.signedAt && (
              <DetailRow
                label="Signed On"
                value={new Date(contract.signedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                colors={colors}
              />
            )}
          </SectionCard>
        )}

        {contract && schedule.length > 0 && (
          <View
            style={[
              sectionCardStyle.card,
              { backgroundColor: colors.card, marginBottom: spacing.md },
            ]}
          >
            <Text style={[sectionCardStyle.title, { color: colors.text }]}>
              Payment Schedule
            </Text>
            {schedule.map((item, idx) => {
              const sConfig = getScheduleStatusConfig(item.status);
              const isLast = idx === schedule.length - 1;
              const isPaid = item.status === "PAID";
              const isPartial = item.status === "PARTIALLY_PAID";
              const amtPaid = Number(item.amountPaid ?? 0);
              const canRepay = canMakePayment && !isPaid;
              return (
                <View
                  key={item.id}
                  style={[
                    styles.scheduleItem,
                    !isLast && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.scheduleInstNum,
                      { backgroundColor: sConfig.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.scheduleInstNumText,
                        { color: sConfig.color },
                      ]}
                    >
                      {item.installmentNumber}
                    </Text>
                  </View>
                  <View style={styles.scheduleMid}>
                    <Text style={[styles.scheduleDue, { color: colors.text }]}>
                      {new Date(item.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                    <View style={styles.scheduleBreakdown}>
                      <Text
                        style={[
                          styles.scheduleBreakdownText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        P: {formatCurrencyInline(item.principalAmount)}
                      </Text>
                      <Text
                        style={[
                          styles.scheduleBreakdownDot,
                          { color: colors.border },
                        ]}
                      >
                        •
                      </Text>
                      <Text
                        style={[
                          styles.scheduleBreakdownText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        I: {formatCurrencyInline(item.interestAmount)}
                      </Text>
                    </View>
                    {isPartial && amtPaid > 0 && (
                      <Text
                        style={[
                          styles.schedulePartialHint,
                          { color: "#F59E0B" },
                        ]}
                      >
                        Paid {formatCurrencyInline(amtPaid)} of{" "}
                        {formatCurrencyInline(item.totalAmount)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.scheduleRight}>
                    <Text
                      style={[styles.scheduleAmount, { color: colors.text }]}
                    >
                      {formatCurrencyInline(item.totalAmount)}
                    </Text>
                    <View
                      style={[
                        styles.scheduleBadge,
                        { backgroundColor: sConfig.bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.scheduleBadgeText,
                          { color: sConfig.color },
                        ]}
                      >
                        {sConfig.label}
                      </Text>
                    </View>
                    {canRepay && (
                      <TouchableOpacity
                        style={[
                          styles.repayBtn,
                          { backgroundColor: colors.primary },
                        ]}
                        onPress={() => {
                          if (!contract) {
                            showToast(
                              "No active contract found for this loan. Please contact your lender.",
                              "error",
                            );
                            return;
                          }
                          router.push({
                            pathname: "/repayment/make-repayment",
                            params: {
                              loanId: loan.id,
                              contractId: contract.id,
                              scheduleId: item.id,
                              amount: String(Number(item.totalAmount) || 0),
                              outstandingBalance: String(Number(contract.outstandingBalance) || 0),
                              gateway: "ESEWA",
                            },
                          });
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.repayBtnText,
                            { color: colors.buttonText },
                          ]}
                        >
                          Repay
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Sticky Make Payment button — always visible when payment is possible */}
      {canMakePayment && (
        <View
          style={[
            styles.stickyFooter,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.payBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            onPress={() => {
              if (!contract) {
                showToast(
                  "No active contract found for this loan. Please contact your lender.",
                  "error",
                );
                return;
              }
              const unpaid = schedule.find((s) => s.status !== "PAID");
              const scheduleItem: any = unpaid ?? {
                id: "",
                installmentNumber: 0,
                totalAmount: contract.installmentAmount,
                status: "PENDING",
              };
              router.push({
                pathname: "/repayment/make-repayment",
                params: {
                  loanId: loan.id,
                  contractId: contract.id,
                  scheduleId: scheduleItem.id,
                  amount: String(Number(scheduleItem.totalAmount) || 0),
                  outstandingBalance: String(Number(contract.outstandingBalance) || 0),
                  gateway: "ESEWA",
                },
              });
            }}
          >
            <Ionicons name="card-outline" size={20} color={colors.buttonText} />
            <Text style={[styles.payBtnText, { color: colors.buttonText }]}>
              Make Payment
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sticky Sign Contract button — shown when contract is generated but not yet signed */}
      {canSignContract && contract && (
        <View
          style={[
            styles.stickyFooter,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.payBtn, { backgroundColor: "#6366F1" }]}
            activeOpacity={0.85}
            onPress={() => router.push(`/contracts/${contract.id}` as any)}
          >
            <Ionicons name="document-text-outline" size={20} color="#FFFFFF" />
            <Text style={[styles.payBtnText, { color: "#FFFFFF" }]}>
              View & Sign Contract
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
    },
    backBtn: { padding: 6, borderRadius: borderRadius.sm },
    topBarTitle: { ...typography.h3, fontWeight: "700" },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
    heroCard: {
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 6,
      elevation: 3,
    },
    heroTop: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    lenderBadge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    lenderInitial: { fontSize: 20, fontWeight: "700" },
    heroMeta: { flex: 1 },
    heroLender: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
    heroId: { fontSize: 11, fontWeight: "500" },
    statusPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    },
    statusPillText: { fontSize: 11, fontWeight: "600" },
    heroDivider: { height: 1, marginBottom: spacing.md },
    heroAmountLabel: {
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    heroAmount: { fontSize: 34, fontWeight: "800", marginBottom: spacing.md },
    heroStats: { flexDirection: "row", gap: spacing.sm },
    heroStat: {
      flex: 1,
      borderRadius: borderRadius.md,
      padding: 10,
      alignItems: "center",
      gap: 4,
    },
    heroStatVal: { fontSize: 12, fontWeight: "700", textAlign: "center" },
    heroStatLbl: { fontSize: 10, fontWeight: "500", textAlign: "center" },
    alertCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
    },
    alertTitle: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
    alertBody: { fontSize: 12, fontWeight: "500", lineHeight: 18 },
    scheduleItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      gap: spacing.sm,
    },
    scheduleInstNum: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    scheduleInstNumText: { fontSize: 11, fontWeight: "700" },
    scheduleMid: { flex: 1 },
    scheduleDue: { fontSize: 13, fontWeight: "600", marginBottom: 2 },
    scheduleBreakdown: { flexDirection: "row", alignItems: "center", gap: 4 },
    scheduleBreakdownText: { fontSize: 11, fontWeight: "500" },
    scheduleBreakdownDot: { fontSize: 11 },
    scheduleRight: { alignItems: "flex-end", gap: 4 },
    scheduleAmount: { fontSize: 13, fontWeight: "700" },
    scheduleBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    scheduleBadgeText: { fontSize: 10, fontWeight: "600" },
    schedulePartialHint: { fontSize: 10, fontWeight: "600", marginTop: 3 },
    repayBtn: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
      marginTop: 4,
    },
    repayBtnText: { fontSize: 10, fontWeight: "700" },
    stickyFooter: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
      borderTopWidth: 1,
    },
    payBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingVertical: 16,
      borderRadius: borderRadius.lg,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    payBtnText: { fontSize: 16, fontWeight: "700" },
    collateralImageRow: {
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    collateralImageLabel: {
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 10,
    },
    collateralImage: {
      width: "100%",
      height: 180,
      borderRadius: borderRadius.md,
      borderWidth: 1,
    },
  });
