
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import {
  doc,
  onSnapshot,
  type DocumentData,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { PrimaryButton } from "@/components/PrimaryButton";
import CustomerErrandDetails from "@/components/errands/CustomerErrandDetails";
import type { RunnerErrand } from "@/components/errands/RunnerErrandDetails";
import { respondToCounterOffer } from "@/services/errandService";
import { colors, spacing } from "@/theme";

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

/**
 * Uses the Firestore document ID as the canonical errand ID.
 */
function toRunnerErrand(
  id: string,
  data: DocumentData,
): RunnerErrand {
  return {
    ...data,
    id,
  } as RunnerErrand;
}

export default function CustomerErrandDetailsRoute() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    id?: string | string[];
    errandId?: string | string[];
  }>();

  const rawId = params.id ?? params.errandId;
  const errandId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [errand, setErrand] = useState<RunnerErrand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/runner-home");
    }
  }, [router]);

  useEffect(() => {
    if (!errandId) {
      setErrand(null);
      setError(
        "No errand was selected. Return to the dashboard and select an errand.",
      );
      setLoading(false);
      return;
    }

    let active = true;

    setLoading(true);
    setError("");
    setErrand(null);

    const errandRef = doc(db, "errands", errandId);

    const unsubscribe = onSnapshot(
      errandRef,
      (snapshot) => {
        if (!active) return;

        if (!snapshot.exists()) {
          setErrand(null);
          setError("This errand no longer exists or is unavailable.");
          setLoading(false);
          return;
        }

        try {
          setErrand(
            toRunnerErrand(snapshot.id, snapshot.data()),
          );
          setError("");
        } catch (caughtError) {
          setErrand(null);
          setError(getErrorMessage(caughtError));
        } finally {
          setLoading(false);
        }
      },
      (caughtError) => {
        if (!active) return;

        console.error(
          "Customer errand subscription failed:",
          caughtError,
        );

        setErrand(null);
        setError(
          "We couldn't load this errand. Check your connection and access permissions.",
        );
        setLoading(false);
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [errandId]);

  /**
   * CustomerErrandDetails expects:
   * (id: string, accept: boolean) => Promise<void>
   */
  const handleRespondToCounterOffer = useCallback(
    async (id: string, accept: boolean): Promise<void> => {
      if (!id) {
        throw new Error("Could not identify this errand.");
      }

      try {
        await respondToCounterOffer(
          id,
          accept ? "accept" : "decline",
        );

        Alert.alert(
          accept
            ? "Counter-offer accepted"
            : "Counter-offer declined",
          accept
            ? "The runner has been assigned to your errand."
            : "You have declined the runner's counter-offer.",
        );
      } catch (caughtError) {
        Alert.alert(
          "Unable to respond",
          getErrorMessage(caughtError),
        );

        // Let the child component display the error too.
        throw caughtError;
      }
    },
    [],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />
        <AppText style={styles.message}>
          Loading errand details...
        </AppText>
      </SafeAreaView>
    );
  }

  if (error || !errand) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={handleBack}
            style={styles.backButton}
          >
            <AppText style={styles.backText}>
              ‹ Back
            </AppText>
          </Pressable>

          <AppText variant="heading">
            Errand details
          </AppText>
        </View>

        <View style={styles.errorContainer}>
          <AppCard>
            <AppText variant="heading">
              Unable to open errand
            </AppText>

            <AppText style={styles.message}>
              {error || "The errand could not be found."}
            </AppText>

            <PrimaryButton
              title="Return to dashboard"
              onPress={handleBack}
            />
          </AppCard>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={handleBack}
          style={styles.backButton}
        >
          <AppText style={styles.backText}>
            ‹ Back
          </AppText>
        </Pressable>

        <AppText variant="heading">
          Errand details
        </AppText>
      </View>

      <View style={styles.content}>
        <CustomerErrandDetails
          errand={errand}
          onBack={handleBack}
          onRespondToCounterOffer={
            handleRespondToCounterOffer
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingRight: spacing.xs,
  },
  backText: {
    color: colors.primary,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  message: {
    marginVertical: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.md,
  },
});
