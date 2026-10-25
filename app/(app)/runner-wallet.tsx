import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { View } from "react-native";

import { AppText } from "@/components/AppText";
import { AppCard } from "@/components/AppCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { auth, db } from "@/lib/firebase";
import { spacing } from "@/theme";

type CompletedEarning = {
  amount: number;
  paymentMethod: string;
};

function money(value: number) {
  return `R ${value.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function RunnerWalletScreen() {
  const [earnings, setEarnings] = useState<CompletedEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setEarnings([]);
      setError("Please sign in to view your wallet.");
      setLoading(false);
      return;
    }

    const completedQuery = query(
      collection(db, "errands"),
      where("runnerId", "==", user.uid),
      where("assignedRunnerId", "==", user.uid),
      where("status", "==", "completed"),
    );

    return onSnapshot(completedQuery, (snapshot) => {
      setEarnings(snapshot.docs.map((item) => {
        const data = item.data();
        const amount = Number(data.agreedFee ?? data.offeredFee ?? data.fee ?? data.recommendedFee ?? 0);
        return {
          amount: Number.isFinite(amount) && amount > 0 ? amount : 0,
          paymentMethod: String(data.paymentMethod ?? "Not selected"),
        };
      }));
      setError("");
      setLoading(false);
    }, (caughtError) => {
      console.error("Runner wallet subscription failed:", caughtError);
      setError("Unable to load completed earnings. Check your connection and Firestore permissions.");
      setLoading(false);
    });
  }, []);

  const balance = earnings.reduce((total, earning) => total + earning.amount, 0);

  return (
    <>
      <Stack.Screen options={{ title: "Runner Wallet" }} />
      <ScreenContainer>
        <View style={styles.content}>
          <AppText variant="title">My Wallet</AppText>
          <AppText variant="secondary">
            Simulated earnings from errands confirmed as completed. This prototype does not move real money.
          </AppText>
          <AppCard>
            <AppText variant="secondary">Simulated available balance</AppText>
            <AppText variant="heading">{money(balance)}</AppText>
            <AppText variant="small">
              {loading ? "Loading completed errands…" : `${earnings.length} completed errand(s) counted`}
            </AppText>
          </AppCard>
          {error ? <AppText variant="secondary">{error}</AppText> : null}
          <AppText variant="heading">Completed errand earnings</AppText>
          {earnings.length === 0 && !loading ? (
            <AppCard>
              <AppText variant="secondary">No completed errands have earnings yet.</AppText>
            </AppCard>
          ) : earnings.map((earning, index) => (
            <AppCard key={`${earning.paymentMethod}-${index}`}>
              <View style={styles.earningRow}>
                <View style={styles.flex}>
                  <AppText>Completed errand {index + 1}</AppText>
                  <AppText variant="small">Payment method: {earning.paymentMethod}</AppText>
                </View>
                <AppText variant="heading">{money(earning.amount)}</AppText>
              </View>
            </AppCard>
          ))}
        </View>
      </ScreenContainer>
    </>
  );
}

const styles = {
  content: {
    flex: 1,
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  flex: { flex: 1 },
  earningRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: spacing.md,
  },
};
