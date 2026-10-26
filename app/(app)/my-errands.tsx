import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { collection, onSnapshot, query, where, type DocumentData, type QueryDocumentSnapshot } from "firebase/firestore";

import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { auth, db } from "@/lib/firebase";
import { colors, spacing, radius } from "@/theme";

type CustomerErrand = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  offeredFee: number;
  agreedFee?: number;
  counterOffer?: {
    amount: number;
    runnerId: string;
    status: string;
  } | null;
  createdAt?: { toMillis?: () => number } | string | null;
};

function money(value: number) {
  return `R${value.toFixed(2)}`;
}

function readErrand(document: QueryDocumentSnapshot<DocumentData>): CustomerErrand {
  const data = document.data();
  return {
    id: document.id,
    title: String(data.title ?? `${data.category ?? "Errand"} request`),
    description: String(data.description ?? ""),
    category: String(data.category ?? "Other errands"),
    status: String(data.status ?? "requested"),
    offeredFee: Number(data.offeredFee ?? data.fee ?? data.recommendedFee ?? 0),
    agreedFee: data.agreedFee == null ? undefined : Number(data.agreedFee),
    counterOffer: data.counterOffer && typeof data.counterOffer === "object"
      ? {
          amount: Number(data.counterOffer.amount ?? 0),
          runnerId: String(data.counterOffer.runnerId ?? ""),
          status: String(data.counterOffer.status ?? ""),
        }
      : null,
    createdAt: data.createdAt ?? null,
  };
}

function timestamp(value: CustomerErrand["createdAt"]) {
  if (!value) return 0;
  if (typeof value === "string") return new Date(value).getTime() || 0;
  return typeof value.toMillis === "function" ? value.toMillis() : 0;
}

export default function MyErrandsScreen() {
  const router = useRouter();
  const [errands, setErrands] = useState<CustomerErrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setError("Please sign in to view your errands.");
      setLoading(false);
      return;
    }

    const errandsQuery = query(
      collection(db, "errands"),
      where("customerId", "==", user.uid),
    );

    return onSnapshot(
      errandsQuery,
      (snapshot) => {
        setErrands(snapshot.docs.map(readErrand));
        setError("");
        setLoading(false);
      },
      (caughtError) => {
        console.error("[Steppa] Could not load customer errands:", caughtError);
        setError("Could not load your errands. Please check your connection and Firestore permissions.");
        setLoading(false);
      },
    );
  }, []);

  const sortedErrands = useMemo(
    () => [...errands].sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt)),
    [errands],
  );

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <AppText style={styles.link}>‹ Back to dashboard</AppText>
        </Pressable>

        <AppText variant="title">My Errands</AppText>
        <AppText variant="secondary">
          Track your requests and review offers from Steppas.
        </AppText>

        {loading ? (
          <AppCard style={styles.center}>
            <ActivityIndicator color={colors.primary} />
            <AppText>Loading your errands...</AppText>
          </AppCard>
        ) : error ? (
          <AppCard>
            <AppText variant="error">{error}</AppText>
            <PrimaryButton title="Back to dashboard" onPress={() => router.replace("/(app)/(tabs)")} />
          </AppCard>
        ) : sortedErrands.length === 0 ? (
          <AppCard style={styles.center}>
            <AppText variant="heading">No errands yet</AppText>
            <AppText variant="secondary">
              Your submitted requests and runner offers will appear here.
            </AppText>
            <PrimaryButton title="Request an errand" onPress={() => router.push("/create-errand")} />
          </AppCard>
        ) : (
          sortedErrands.map((errand) => {
            const pendingOffer = errand.counterOffer?.status === "pending";
            return (
              <Pressable
                key={errand.id}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: "/customer-errand-details", params: { id: errand.id } })}
              >
                <AppCard style={styles.card}>
                  <View style={styles.row}>
                    <View style={styles.flex}>
                      <AppText variant="heading">{errand.title}</AppText>
                      <AppText variant="secondary">{errand.category}</AppText>
                    </View>
                    <View style={styles.status}>
                      <AppText style={styles.statusText}>{errand.status.replaceAll("_", " ")}</AppText>
                    </View>
                  </View>

                  {errand.description ? <AppText>{errand.description}</AppText> : null}

                  <View style={styles.row}>
                    <AppText variant="secondary">Your offer</AppText>
                    <AppText style={styles.amount}>{money(errand.offeredFee)}</AppText>
                  </View>

                  {errand.agreedFee != null ? (
                    <View style={styles.row}>
                      <AppText variant="secondary">Agreed fee</AppText>
                      <AppText style={styles.amount}>{money(errand.agreedFee)}</AppText>
                    </View>
                  ) : null}

                  {errand.counterOffer ? (
                    <View style={[styles.offerBox, pendingOffer && styles.pendingBox]}>
                      <AppText variant="heading">
                        {pendingOffer ? "New offer from a Steppa" : "Steppa counter-offer"}
                      </AppText>
                      <View style={styles.row}>
                        <AppText>Counter-offer</AppText>
                        <AppText style={styles.amount}>{money(errand.counterOffer.amount)}</AppText>
                      </View>
                      <AppText variant="secondary">Offer status: {errand.counterOffer.status}</AppText>
                      {pendingOffer ? (
                        <AppText style={styles.link}>Tap to review and accept or decline →</AppText>
                      ) : null}
                    </View>
                  ) : (
                    <AppText variant="secondary">Waiting for a Steppa to respond.</AppText>
                  )}

                  <AppText style={styles.link}>View errand details →</AppText>
                </AppCard>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  back: { minHeight: 40, justifyContent: "center" },
  link: { color: colors.primary, fontWeight: "600" },
  center: { alignItems: "center", gap: spacing.md, padding: spacing.lg },
  card: { gap: spacing.md, marginBottom: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  flex: { flex: 1, gap: spacing.xs },
  status: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.pill },
  statusText: { color: colors.primary, textTransform: "capitalize", fontWeight: "600" },
  amount: { color: colors.primary, fontWeight: "700" },
  offerBox: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  pendingBox: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
});
