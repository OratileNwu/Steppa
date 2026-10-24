import { Linking, StyleSheet, View } from "react-native";
import { useState } from "react";

import { AppText } from "@/components/AppText";
import { PrimaryButton } from "@/components/PrimaryButton";
import type { ConfirmedRoute } from "@/components/maps/types";
import { spacing } from "@/theme";

export type ErrandRoutePreviewProps = {
  route?: ConfirmedRoute;
};

export default function ErrandRoutePreview({
  route,
}: ErrandRoutePreviewProps) {
  const [error, setError] = useState("");

  async function openDirections() {
    if (!route) {
      return;
    }

    const collection = [
      route.collection.coordinates[1],
      route.collection.coordinates[0],
    ].join(",");

    const destination = route.destination
      ? [
          route.destination.coordinates[1],
          route.destination.coordinates[0],
        ].join(",")
      : null;

    const url = destination
      ? "https://www.google.com/maps/dir/?api=1" +
        `&origin=${encodeURIComponent(collection)}` +
        `&destination=${encodeURIComponent(destination)}` +
        "&travelmode=driving"
      : "https://www.google.com/maps/search/?api=1" +
        `&query=${encodeURIComponent(collection)}`;

    try {
      setError("");
      await Linking.openURL(url);
    } catch {
      setError("Could not open directions on this device.");
    }
  }

  return (
    <View style={styles.container}>
      <AppText variant="secondary">
        {route
          ? "Open the confirmed errand locations in your maps app."
          : "Confirmed location coordinates are not available yet."}
      </AppText>

      {route ? (
        <PrimaryButton
          title="Open directions"
          onPress={() => {
            void openDirections();
          }}
        />
      ) : null}

      {error ? <AppText variant="error">{error}</AppText> : null}

      <AppText variant="small">
        Embedded maps are currently available in the web version.
        Live Steppa tracking is not connected.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
});