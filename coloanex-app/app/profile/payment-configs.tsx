import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { Card, Button, Input, useToast } from "@/components/ui";
import { spacing, borderRadius } from "@/constants/theme";
import { paymentConfigsApi } from "@/api";
import { useTheme } from "@/hooks/useTheme";
import { useAppSelector } from "@/store/hooks";

export default function ProfilePaymentConfigsScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { showToast } = useToast();
  const user = useAppSelector((state) => state.auth.user);

  const [configs, setConfigs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);

  const [scope, setScope] = useState<"USER" | "TENANT">("USER");
  const [gateway, setGateway] = useState<"ESEWA" | "KHALTI">("ESEWA");
  const [environment, setEnvironment] = useState<"sandbox" | "production">(
    "sandbox",
  );
  const [merchantId, setMerchantId] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  const placeholders =
    gateway === "ESEWA"
      ? {
          merchantId: "EPAYTEST",
          publicKey: "EPAYTEST",
          secretKey: "8gBm/:&EnhH.1/q",
          webhookUrl: "https://rc.esewa.com.np/api/epay/transaction/status/",
        }
      : {
          merchantId: "498dfcacd2b8400699dc8cfd98a0f077",
          publicKey: "498dfcacd2b8400699dc8cfd98a0f077",
          secretKey: "69ceb560028345dba3b25f9fdbea8e8a",
          webhookUrl: "https://dev.khalti.com/api/v2/epayment/lookup/",
        };

  const loadData = useCallback(async () => {
    try {
      const data = await paymentConfigsApi.listMine().catch(() => []);
      setConfigs(data);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const saveConfig = async () => {
    if (scope === "TENANT" && !user?.tenantId) {
      showToast("Tenant scope requires tenant account", "warning");
      return;
    }

    try {
      setSaving(true);
      await paymentConfigsApi.upsert({
        scope,
        tenantId: scope === "TENANT" ? user?.tenantId : undefined,
        gateway,
        environment,
        isActive: true,
        merchantId: merchantId || undefined,
        publicKey: publicKey || undefined,
        secretKey: secretKey || undefined,
        webhookUrl: webhookUrl || undefined,
      });
      showToast("Payment config saved", "success");
      setEditingConfigId(null);
      setMerchantId("");
      setPublicKey("");
      setSecretKey("");
      setWebhookUrl("");
      await loadData();
    } catch (error: any) {
      showToast(
        error?.response?.data?.message || "Unable to save config",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const startEditConfig = (config: any) => {
    setEditingConfigId(config.id);
    setScope(config.ownerScope || "USER");
    setGateway(config.gateway || "ESEWA");
    setEnvironment(config.environment || "sandbox");
    setMerchantId(config.merchantId || "");
    setPublicKey(config.publicKey || "");
    setSecretKey(config.secretKey || "");
    setWebhookUrl(config.webhookUrl || "");
  };

  const resetForm = () => {
    setEditingConfigId(null);
    setScope("USER");
    setGateway("ESEWA");
    setEnvironment("sandbox");
    setMerchantId("");
    setPublicKey("");
    setSecretKey("");
    setWebhookUrl("");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.surface }]}
    >
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Payment Configs
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
          />
        }
      >
        <Card
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.primary + "30",
              borderWidth: 1,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {editingConfigId ? "Edit Payment Config" : "Add Payment Config"}
          </Text>
          <Text
            style={[styles.sectionSubtitle, { color: colors.textSecondary }]}
          >
            Configure who receives disbursement and repayment payments.
          </Text>

          <View style={styles.row}>
            <Button
              title="User"
              variant={scope === "USER" ? "primary" : "outline"}
              onPress={() => setScope("USER")}
              style={styles.toggleButton}
            />
            {user?.tenantId ? (
              <Button
                title="Tenant"
                variant={scope === "TENANT" ? "primary" : "outline"}
                onPress={() => setScope("TENANT")}
                style={styles.toggleButton}
              />
            ) : null}
          </View>

          <View style={styles.row}>
            <Button
              title="eSewa"
              variant={gateway === "ESEWA" ? "primary" : "outline"}
              onPress={() => setGateway("ESEWA")}
              style={styles.toggleButton}
            />
            <Button
              title="Khalti"
              variant={gateway === "KHALTI" ? "primary" : "outline"}
              onPress={() => setGateway("KHALTI")}
              style={styles.toggleButton}
            />
          </View>

          <View style={styles.row}>
            <Button
              title="Sandbox"
              variant={environment === "sandbox" ? "primary" : "outline"}
              onPress={() => setEnvironment("sandbox")}
              style={styles.toggleButton}
            />
            <Button
              title="Production"
              variant={environment === "production" ? "primary" : "outline"}
              onPress={() => setEnvironment("production")}
              style={styles.toggleButton}
            />
          </View>

          <Input
            label="Merchant ID"
            value={merchantId}
            onChangeText={setMerchantId}
            placeholder={placeholders.merchantId}
          />
          <Input
            label="Public Key"
            value={publicKey}
            onChangeText={setPublicKey}
            placeholder={placeholders.publicKey}
          />
          <Input
            label="Secret Key"
            value={secretKey}
            onChangeText={setSecretKey}
            placeholder={placeholders.secretKey}
          />
          <Input
            label="Webhook URL"
            value={webhookUrl}
            onChangeText={setWebhookUrl}
            placeholder={placeholders.webhookUrl}
          />

          <Button
            title={
              saving
                ? "Saving..."
                : editingConfigId
                  ? "Update Config"
                  : "Save Config"
            }
            onPress={saveConfig}
            loading={saving}
          />
          {editingConfigId ? (
            <Button
              title="Cancel Edit"
              variant="outline"
              onPress={resetForm}
              style={{ marginTop: spacing.sm }}
            />
          ) : null}
        </Card>

        <Card style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            My Configs
          </Text>
          {configs.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>
              No payment configs yet.
            </Text>
          ) : (
            configs.map((cfg) => (
              <View
                key={cfg.id}
                style={[
                  styles.item,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <View style={styles.itemHeader}>
                  <Text style={{ color: colors.text, fontWeight: "700" }}>
                    {cfg.ownerScope} • {cfg.gateway}
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor:
                          cfg.environment === "production"
                            ? colors.success + "20"
                            : colors.warning + "20",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color:
                          cfg.environment === "production"
                            ? colors.success
                            : colors.warning,
                        fontSize: 11,
                        fontWeight: "700",
                      }}
                    >
                      {String(cfg.environment).toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  Merchant: {cfg.merchantId || "-"}
                </Text>
                <View style={styles.itemActions}>
                  <Button
                    title="Edit"
                    variant="outline"
                    onPress={() => startEditConfig(cfg)}
                    style={{ flex: 1, marginTop: spacing.xs }}
                  />
                  <Button
                    title="Delete"
                    variant="outline"
                    onPress={async () => {
                      await paymentConfigsApi.remove(cfg.id).catch(() => null);
                      if (editingConfigId === cfg.id) {
                        resetForm();
                      }
                      await loadData();
                    }}
                    style={{ flex: 1, marginTop: spacing.xs }}
                    textStyle={{ color: colors.error }}
                  />
                </View>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { fontSize: 20, fontWeight: "800" },
    content: { flex: 1, padding: spacing.md },
    card: { padding: spacing.md, marginBottom: spacing.md },
    sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: spacing.sm },
    sectionSubtitle: {
      fontSize: 13,
      marginBottom: spacing.md,
      lineHeight: 18,
    },
    row: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
    toggleButton: { flex: 1 },
    item: {
      borderWidth: 1,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      marginTop: spacing.xs,
    },
    itemHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    itemActions: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    badge: {
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
  });
