import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { spacing, typography, borderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { loansApi, contractsApi, paymentSchedulesApi } from "@/api";
import { useToast } from "@/components/ui";
import type { Loan } from "@/types";
import type { Contract } from "@/api/contractsApi";
import type { PaymentSchedule } from "@/api/paymentSchedulesApi";
import type { PaymentGateway } from "@/api/paymentsApi";
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
  const [gatewayModalSchedule, setGatewayModalSchedule] =
    useState<PaymentSchedule | null>(null);

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

  const collateral = loan.collateralDetails as Record<string, unknown> | null;

  const handleGatewaySelect = (gateway: PaymentGateway) => {
    if (!gatewayModalSchedule) return;
    if (!contract) {
      setGatewayModalSchedule(null);
      showToast(
        "No active contract found for this loan. Please contact your lender.",
        "error",
      );
      return;
    }
    setGatewayModalSchedule(null);
    router.push({
      pathname: "/repayment/make-repayment",
      params: {
        loanId: loan.id,
        contractId: contract.id,
        scheduleId: gatewayModalSchedule.id,
        amount: String(gatewayModalSchedule.totalAmount),
        gateway,
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.text }]}>
          Loan Details
        </Text>
        <View style={{ width: 38 }} />
      </View>

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
          <Text style={[styles.heroAmount, { color: colors.text }]}>
            {formatCurrency(amount)}
          </Text>

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
                <Text style={[styles.heroStatVal, { color: colors.text }]}>
                  {formatCurrency(loan.approvedAmount)}
                </Text>
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
          <DetailRow
            label="Requested Amount"
            value={formatCurrency(loan.requestedAmount)}
            colors={colors}
          />
          {loan.approvedAmount !== undefined && (
            <DetailRow
              label="Approved Amount"
              value={formatCurrency(loan.approvedAmount)}
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

        {loan.rejectionReason && (
          <View
            style={[
              styles.alertCard,
              {
                backgroundColor: colors.errorLight,
                borderColor: colors.error + "30",
              },
            ]}
          >
            <Ionicons name="close-circle" size={18} color={colors.error} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertTitle, { color: colors.error }]}>
                Rejection Reason
              </Text>
              <Text style={[styles.alertBody, { color: colors.error }]}>
                {loan.rejectionReason}
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
            <DetailRow
              label="Loan Amount"
              value={formatCurrency(contract.loanAmount)}
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
              <DetailRow
                label="Installment Amount"
                value={formatCurrency(contract.installmentAmount)}
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
              <DetailRow
                label="Total Amount Due"
                value={formatCurrency(contract.totalAmountDue)}
                colors={colors}
              />
            )}
            {contract.totalAmountPaid !== undefined && (
              <DetailRow
                label="Amount Paid"
                value={formatCurrency(contract.totalAmountPaid)}
                colors={colors}
              />
            )}
            <DetailRow
              label="Outstanding Balance"
              value={formatCurrency(contract.outstandingBalance)}
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
                        P: {formatCurrency(item.principalAmount)}
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
                        I: {formatCurrency(item.interestAmount)}
                      </Text>
                    </View>
                    {isPartial && amtPaid > 0 && (
                      <Text
                        style={[
                          styles.schedulePartialHint,
                          { color: "#F59E0B" },
                        ]}
                      >
                        Paid {formatCurrency(amtPaid)} of{" "}
                        {formatCurrency(item.totalAmount)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.scheduleRight}>
                    <Text
                      style={[styles.scheduleAmount, { color: colors.text }]}
                    >
                      {formatCurrency(item.totalAmount)}
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
                        onPress={() => setGatewayModalSchedule(item)}
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
              // Use first unpaid schedule item, or fallback to contract amount
              const unpaid = schedule.find((s) => s.status !== "PAID");
              const fallbackSchedule: any = unpaid ?? {
                id: "",
                installmentNumber: 0,
                totalAmount: contract.installmentAmount,
                status: "PENDING",
              };
              setGatewayModalSchedule(fallbackSchedule);
            }}
          >
            <Ionicons name="card-outline" size={20} color={colors.buttonText} />
            <Text style={[styles.payBtnText, { color: colors.buttonText }]}>
              Make Payment
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Gateway Selection Modal */}
      <Modal
        visible={!!gatewayModalSchedule}
        transparent
        animationType="slide"
        onRequestClose={() => setGatewayModalSchedule(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setGatewayModalSchedule(null)}
        >
          <Pressable
            style={[styles.modalSheet, { backgroundColor: colors.card }]}
          >
            <View
              style={[styles.modalHandle, { backgroundColor: colors.border }]}
            />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select Payment Method
            </Text>
            {gatewayModalSchedule && (
              <Text
                style={[styles.modalSubtitle, { color: colors.textSecondary }]}
              >
                Installment #{gatewayModalSchedule.installmentNumber} ·{" "}
                {formatCurrency(gatewayModalSchedule.totalAmount)}
              </Text>
            )}
            <View style={styles.gatewayRow}>
              <TouchableOpacity
                style={[styles.gatewayCard, { backgroundColor: "#60BB46" }]}
                activeOpacity={0.85}
                onPress={() => handleGatewaySelect("ESEWA")}
              >
                <View style={styles.gatewayIconCircle}>
                  <Text style={styles.gatewayIconText}>e</Text>
                </View>
                <Text style={styles.gatewayName}>eSewa</Text>
                <Text style={styles.gatewayTag}>Nepal's #1 wallet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.gatewayCard, { backgroundColor: "#5C2D91" }]}
                activeOpacity={0.85}
                onPress={() => handleGatewaySelect("KHALTI")}
              >
                <View style={styles.gatewayIconCircle}>
                  <Text style={styles.gatewayIconText}>k</Text>
                </View>
                <Text style={styles.gatewayName}>Khalti</Text>
                <Text style={styles.gatewayTag}>Fast & secure</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.modalCancelBtn, { borderColor: colors.border }]}
              onPress={() => setGatewayModalSchedule(null)}
            >
              <Text
                style={[
                  styles.modalCancelText,
                  { color: colors.textSecondary },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    modalSheet: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    modalHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: spacing.md,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "800",
      textAlign: "center",
      marginBottom: 4,
    },
    modalSubtitle: {
      fontSize: 13,
      fontWeight: "500",
      textAlign: "center",
      marginBottom: spacing.lg,
    },
    gatewayRow: {
      flexDirection: "row",
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    gatewayCard: {
      flex: 1,
      borderRadius: borderRadius.lg,
      alignItems: "center",
      paddingVertical: spacing.lg,
      gap: spacing.sm,
    },
    gatewayIconCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: "rgba(255,255,255,0.25)",
      alignItems: "center",
      justifyContent: "center",
    },
    gatewayIconText: { fontSize: 24, fontWeight: "900", color: "#fff" },
    gatewayName: { fontSize: 16, fontWeight: "800", color: "#fff" },
    gatewayTag: {
      fontSize: 11,
      fontWeight: "500",
      color: "rgba(255,255,255,0.8)",
    },
    modalCancelBtn: {
      paddingVertical: 14,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      alignItems: "center",
    },
    modalCancelText: { fontSize: 15, fontWeight: "600" },
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
