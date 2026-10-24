import { ScrollView, StyleSheet } from "react-native";

import { ScreenContainer } from "@/components/ScreenContainer";
import SteppaMap from "@/components/maps/SteppaMap";
import { spacing } from "@/theme";

export default function ReviewRouteScreen() {
  return (
    <ScreenContainer padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <SteppaMap />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
});
