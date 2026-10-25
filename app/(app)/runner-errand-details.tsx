
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  View,
} from "react-native";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import {
  doc,
  onSnapshot,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import RunnerErrandDetails, {
  type RunnerErrand,
  type RunnerErrandAction,
} from "@/components/errands/RunnerErrandDetails";
import {
  acceptErrand,
  completeErrand,
  startErrand,
  submitRunnerCounterOffer,
} from "@/services/errandService";
import { colors } from "@/theme";

export default function RunnerErrandDetailsRoute() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    id?: string | string[];
  }>();

  const id = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [data, setData] = useState<Record<string, any> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setData(null);
      setError("No errand selected.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    return onSnapshot(
      doc(db, "errands", id),
      (snapshot) => {
        if (!snapshot.exists()) {
          setData(null);
          setError("Errand not found.");
        } else {
          setData(snapshot.data());
          setError(null);
        }

        setLoading(false);
      },
      (caughtError) => {
        console.error(
          "Runner errand subscription failed:",
          caughtError,
        );
        setError(
          "Unable to load errand. Check your connection and access permissions.",
        );
        setLoading(false);
      },
    );
  }, [id]);

  const errand = useMemo<RunnerErrand | null>(() => {
    if (!data || !id) return null;

    const categoryValue = String(data.category ?? "");

    const category: RunnerErrand["category"] =
      /grocer/i.test(categoryValue)
        ? "Groceries"
        : /parcel|pickup|collection/i.test(categoryValue)
          ? "Parcel collection/Pickup"
          : /queue/i.test(categoryValue)
            ? "Queue for me"
            : "Other errands";

    const statuses: Record<
      string,
      RunnerErrand["status"]
    > = {
      requested: "requested",
      pending: "requested",
      accepted: "accepted",
      assigned: "accepted",
      in_progress: "in_progress",
      awaiting_customer_confirmation: "awaiting_customer_confirmation",
      completion_disputed: "completion_disputed",
      completed: "completed",
      cancelled: "cancelled",
    };

    const counterOfferData = data.counterOffer;

    return {
      id,
      title: String(
        data.title ?? `${category} request`,
      ),
      category,
      location: String(
        data.location ??
          data.queueLocation ??
          data.collectionAddress ??
          "Location not provided",
      ),
      // Keep the customer's original offer separate from the accepted price.
      fee: Number(
        data.offeredFee ??
          data.recommendedFee ??
          data.fee ??
          0,
      ),
      paymentMethod: String(data.paymentMethod ?? "Not selected"),
      agreedFee:
        data.agreedFee == null
          ? undefined
          : Number(data.agreedFee),
      description: String(data.description ?? ""),
      status:
        statuses[String(data.status)] ?? "requested",
      assignedRunnerId:
        data.assignedRunnerId ??
        data.runnerId ??
        undefined,
      collectionAddress: data.collectionAddress,
      destinationAddress: data.destinationAddress,
      preferredAt: data.preferredAt,
      preferredUntil: data.preferredUntil,
      institution: data.institution,
      queueLocation: data.queueLocation,
      serviceNeeded: data.serviceNeeded,
      maxWaitMinutes: data.maxWaitMinutes,
      notifyBeforeMinutes: data.notifyBeforeMinutes,
      customer: data.customerName
        ? { name: String(data.customerName) }
        : undefined,
      counterOffer: counterOfferData
        ? {
            amount: Number(counterOfferData.amount),
            status: counterOfferData.status,
          }
        : undefined,
      statusTimes: data.statusTimes,
    };
  }, [data, id]);

  async function onAction(
    errandId: string,
    action: RunnerErrandAction,
  ): Promise<void> {
    try {
      if (action === "accept") {
        await acceptErrand(errandId);
      } else if (action === "start") {
        await startErrand(errandId);
      } else {
        await completeErrand(errandId);
      }
    } catch (caughtError) {
      Alert.alert(
        "Action failed",
        caughtError instanceof Error
          ? caughtError.message
          : "Please try again.",
      );
      throw caughtError;
    }
  }

  async function onCounterOffer(
    errandId: string,
    amount: number,
  ): Promise<void> {
    try {
      await submitRunnerCounterOffer(errandId, amount);

      Alert.alert(
        "Counter-offer sent",
        "The customer can now respond.",
      );
    } catch (caughtError) {
      Alert.alert(
        "Counter-offer failed",
        caughtError instanceof Error
          ? caughtError.message
          : "Please try again.",
      );
      throw caughtError;
    }
  }

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/runner-home");
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} />
        <Text>Loading errand...</Text>
      </View>
    );
  }

  if (error || !errand) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          backgroundColor: colors.background,
        }}
      >
        <Text>
          {error ?? "Errand unavailable."}
        </Text>

        <Text
          onPress={handleBack}
          style={{
            marginTop: 16,
            color: colors.primary,
            fontWeight: "600",
          }}
        >
          Back
        </Text>
      </View>
    );
  }

  return (
    <RunnerErrandDetails
      errand={errand}
      currentRunnerId={auth.currentUser?.uid}
      isOnline={true}
      onBack={handleBack}
      onAction={onAction}
      onCounterOffer={onCounterOffer}
    />
  );
}
