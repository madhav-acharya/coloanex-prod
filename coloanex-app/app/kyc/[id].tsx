import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  AppHeader,
  Input,
  Button,
  useToast,
  CurrencyIcon,
} from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { spacing, borderRadius } from "@/constants/theme";
import { kycApi } from "@/api";

type FormState = {
  fullName: string;
  dateOfBirth: string;
  occupation: string;
  monthlyIncome: string;
  notes: string;
  province: string;
  district: string;
  municipality: string;
  ward: string;
  tole: string;
};

export default function KycDetailByIdScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [kyc, setKyc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<FormState>({
    fullName: "",
    dateOfBirth: "",
    occupation: "",
    monthlyIncome: "",
    notes: "",
    province: "",
    district: "",
    municipality: "",
    ward: "",
    tole: "",
  });

  const loadKyc = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await kycApi.getById(id);
      setKyc(data || null);
      const addr = (data?.permanentAddress || {}) as Record<string, string>;
      setForm({
        fullName: data?.fullName || "",
        dateOfBirth: data?.dateOfBirth
          ? new Date(data.dateOfBirth).toISOString().split("T")[0]
          : "",
        occupation: data?.occupation || "",
        monthlyIncome: data?.monthlyIncome ? String(data.monthlyIncome) : "",
        notes: data?.notes || "",
        province: addr.province || "",
        district: addr.district || "",
        municipality: addr.municipality || "",
        ward: addr.ward || "",
        tole: addr.tole || "",
      });
    } catch {
      setKyc(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadKyc();
  }, [loadKyc]);

  const statusColor = useMemo(() => {
    if (!kyc) return colors.textSecondary;
    if (kyc.status === "VERIFIED") return colors.success;
    if (kyc.status === "REJECTED") return colors.error;
    return colors.warning;
  }, [kyc, colors]);

  const handleSave = async () => {
    if (!id || !kyc) return;
    if (!form.fullName.trim()) {
      showToast("Full name is required", "error");
      return;
    }
    if (!form.dateOfBirth.trim()) {
      showToast("Date of birth is required", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        dateOfBirth: new Date(form.dateOfBirth).toISOString(),
        occupation: form.occupation,
        monthlyIncome: Number(form.monthlyIncome) || 0,
        notes: form.notes,
        photoUrl: kyc.photoUrl,
        personalDetails: kyc.personalDetails || {},
        permanentAddress: {
          province: form.province,
          district: form.district,
          municipality: form.municipality,
          ward: form.ward,
          tole: form.tole,
        },
        bankDetails: kyc.bankDetails || {},
      };

      await kycApi.update(id, payload);
      showToast("KYC updated successfully", "success");
      setIsEditing(false);
      await loadKyc();
    } catch (error: any) {
      showToast(
        error?.response?.data?.message || "Failed to update KYC",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const renderDetailRow = (label: string, value: string) => (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text
        style={[styles.detailValue, { color: colors.text }]}
        numberOfLines={1}
      >
        {value || "-"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader
        title="KYC Details"
        onBackPress={() => router.back()}
        showThemeToggle={false}
        rightComponent={
          kyc ? (
            <TouchableOpacity
              style={[styles.editBtn, { backgroundColor: colors.primaryLight }]}
              onPress={() => setIsEditing((prev) => !prev)}
            >
              <Text style={[styles.editBtnText, { color: colors.primary }]}>
                {isEditing ? "Cancel" : "Edit"}
              </Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !kyc ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            KYC details are not available.
          </Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/kyc")}
          >
            <Text style={[styles.btnText, { color: colors.buttonText }]}>
              Open KYC Overview
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={styles.summaryTop}>
              <Text
                style={[styles.name, { color: colors.text }]}
                numberOfLines={1}
              >
                {kyc.fullName}
              </Text>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: `${statusColor}20` },
                ]}
              >
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {kyc.status}
                </Text>
              </View>
            </View>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              Submitted: {new Date(kyc.createdAt).toLocaleDateString()}
            </Text>
            {kyc.blockchainTxHash ? (
              <Text
                style={[styles.meta, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                Tx: {kyc.blockchainTxHash}
              </Text>
            ) : null}
          </View>

          {isEditing ? (
            <View
              style={[styles.sectionCard, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Edit KYC
              </Text>
              <Input
                value={form.fullName}
                onChangeText={(v) => setForm((p) => ({ ...p, fullName: v }))}
                placeholder="Full name"
              />
              <Input
                value={form.dateOfBirth}
                onChangeText={(v) => setForm((p) => ({ ...p, dateOfBirth: v }))}
                placeholder="Date of Birth (YYYY-MM-DD)"
              />
              <Input
                value={form.occupation}
                onChangeText={(v) => setForm((p) => ({ ...p, occupation: v }))}
                placeholder="Occupation"
              />
              <Input
                value={form.monthlyIncome}
                onChangeText={(v) =>
                  setForm((p) => ({ ...p, monthlyIncome: v }))
                }
                placeholder="Monthly Income"
                keyboardType="numeric"
              />
              <Input
                value={form.province}
                onChangeText={(v) => setForm((p) => ({ ...p, province: v }))}
                placeholder="Province"
              />
              <Input
                value={form.district}
                onChangeText={(v) => setForm((p) => ({ ...p, district: v }))}
                placeholder="District"
              />
              <Input
                value={form.municipality}
                onChangeText={(v) =>
                  setForm((p) => ({ ...p, municipality: v }))
                }
                placeholder="Municipality"
              />
              <Input
                value={form.ward}
                onChangeText={(v) => setForm((p) => ({ ...p, ward: v }))}
                placeholder="Ward"
              />
              <Input
                value={form.tole}
                onChangeText={(v) => setForm((p) => ({ ...p, tole: v }))}
                placeholder="Tole / Street"
              />
              <Input
                value={form.notes}
                onChangeText={(v) => setForm((p) => ({ ...p, notes: v }))}
                placeholder="Notes"
                multiline
                numberOfLines={3}
              />
              <Button
                title={saving ? "Saving..." : "Save Changes"}
                onPress={handleSave}
                disabled={saving}
              />
            </View>
          ) : (
            <>
              <View
                style={[styles.sectionCard, { backgroundColor: colors.card }]}
              >
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Personal Information
                </Text>
                {renderDetailRow("Full Name", kyc.fullName)}
                {renderDetailRow(
                  "DOB",
                  new Date(kyc.dateOfBirth).toLocaleDateString(),
                )}
                {renderDetailRow("Occupation", kyc.occupation || "-")}
                <View
                  style={[
                    styles.detailRow,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Monthly Income
                  </Text>
                  <View style={styles.rupeeRow}>
                    <CurrencyIcon size={14} color={colors.text} />
                    <Text
                      style={[
                        styles.detailValue,
                        { color: colors.text, marginLeft: 4 },
                      ]}
                    >
                      {Number(kyc.monthlyIncome || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={[styles.sectionCard, { backgroundColor: colors.card }]}
              >
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Address
                </Text>
                {renderDetailRow(
                  "Province",
                  kyc.permanentAddress?.province || "-",
                )}
                {renderDetailRow(
                  "District",
                  kyc.permanentAddress?.district || "-",
                )}
                {renderDetailRow(
                  "Municipality",
                  kyc.permanentAddress?.municipality || "-",
                )}
                {renderDetailRow("Ward", kyc.permanentAddress?.ward || "-")}
                {renderDetailRow("Tole", kyc.permanentAddress?.tole || "-")}
              </View>

              <View
                style={[styles.sectionCard, { backgroundColor: colors.card }]}
              >
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Verification
                </Text>
                {renderDetailRow("Status", kyc.status)}
                {renderDetailRow(
                  "Files Uploaded",
                  String(kyc.files?.length || 0),
                )}
                {renderDetailRow(
                  "Last Updated",
                  new Date(kyc.updatedAt).toLocaleDateString(),
                )}
                {kyc.rejectionReason
                  ? renderDetailRow("Rejection Reason", kyc.rejectionReason)
                  : null}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    container: { flex: 1 },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.md,
    },
    content: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      gap: spacing.sm,
    },
    summaryCard: {
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    summaryTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    name: { fontSize: 24, fontWeight: "800", flex: 1, marginRight: spacing.sm },
    meta: { fontSize: 12, fontWeight: "500", marginTop: 6 },
    statusPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
    },
    statusText: { fontSize: 11, fontWeight: "700" },
    sectionCard: {
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    sectionTitle: { fontSize: 22, fontWeight: "800", marginBottom: spacing.sm },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
    },
    detailLabel: { fontSize: 15, fontWeight: "600", flex: 1 },
    detailValue: {
      fontSize: 15,
      fontWeight: "700",
      flex: 1,
      textAlign: "right",
    },
    rupeeRow: { flexDirection: "row", alignItems: "center" },
    editBtn: {
      borderRadius: borderRadius.full,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    editBtnText: { fontSize: 12, fontWeight: "700" },
    emptyText: { fontSize: 14, fontWeight: "500", marginBottom: spacing.sm },
    btn: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: borderRadius.full,
    },
    btnText: { fontSize: 13, fontWeight: "700" },
  });
