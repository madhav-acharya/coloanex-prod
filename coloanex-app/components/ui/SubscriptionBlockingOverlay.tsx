import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { subscriptionsApi } from "@/api";

interface SubscriptionBlockingOverlayProps {
  isVisible?: boolean;
}

export function SubscriptionBlockingOverlay({
  isVisible,
}: SubscriptionBlockingOverlayProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [reason, setReason] = useState<string | null>(null);

  const checkSubscription = async () => {
    setLoading(true);
    try {
      const subscriptions = await subscriptionsApi.listMine().catch(() => []);
      const now = Date.now();
      const activeSubscriptions = subscriptions.filter((subscription) => {
        if (String(subscription?.status).toUpperCase() !== "ACTIVE")
          return false;

        const startsAt = subscription?.startsAt
          ? new Date(subscription.startsAt).getTime()
          : undefined;
        const endsAt = subscription?.endsAt
          ? new Date(subscription.endsAt).getTime()
          : undefined;

        if (startsAt && startsAt > now) return false;
        if (endsAt && endsAt < now) return false;
        return true;
      });

      if (activeSubscriptions.length === 0) {
        setHasAccess(false);
        setReason("Active subscription required for blockchain operations.");
        return;
      }

      const hasCapacity = activeSubscriptions.some((subscription) => {
        const maxTransactions = Number(
          subscription?.planRef?.maxTransactions || 0,
        );
        const usageCount = Number(subscription?.usageCount || 0);
        if (maxTransactions <= 0) return true;
        return usageCount < maxTransactions;
      });

      if (!hasCapacity) {
        setHasAccess(false);
        setReason("Subscription limit reached. Please upgrade to continue.");
        return;
      }

      setHasAccess(true);
      setReason(null);
    } catch {
      setHasAccess(false);
      setReason("Unable to verify subscription status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, []);

  if (!loading && hasAccess) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + "10" }]}>
              <Ionicons name="flash" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              Subscription Required
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {reason || "You need an active subscription to perform this blockchain-secured action."}
            </Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/profile/subscriptions" as any)}
            >
              <Text style={styles.buttonText}>Upgrade Plan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>
                Go Back
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    zIndex: 1000,
  },
  card: {
    width: "100%",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 22,
  },
  button: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
