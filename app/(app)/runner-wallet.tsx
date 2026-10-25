import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { AppCard } from "@/components/AppCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { spacing } from "@/theme";

export default function RunnerWalletScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Runner Wallet" }} />
      <ScreenContainer>
        <View style={styles.content}>
          <AppText variant="title">My Wallet</AppText>
          <AppText variant="secondary">
            Your earnings summary will appear here when earnings data is connected.
          </AppText>
          <AppCard>
            <AppText variant="secondary">Available balance</AppText>
            <AppText variant="heading">R 0.00</AppText>
            <AppText variant="small">
              No verified earnings are available to display yet.
            </AppText>
          </AppCard>
        </View>
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
});