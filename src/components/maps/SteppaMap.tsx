
import type { SteppaMapProps } from "./types";
import { Linking, StyleSheet, View } from "react-native";
import { useState } from "react";

import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { PrimaryButton } from "@/components/PrimaryButton";
import { spacing } from "@/theme";

/**
 * Native fallback for route review. The web build has the interactive MapLibre
 * map; this Android/iOS view provides clear route details and opens the device's
 * maps app. It intentionally does not claim to provide live Steppa GPS tracking.
 */
export default function SteppaMap({
    category = "Errand",
    initialCollection = "",
    initialDestination = "",
    queueOnly = false,
}: SteppaMapProps) {
    const [error, setError] = useState("");

    const collection = initialCollection.trim();
    const destination = initialDestination.trim();

    async function openDirections() {
        if (!collection) {
            setError("Add a collection or queue location before opening directions.");
            return;
        }

        const url =
            destination && !queueOnly
                ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
                    collection,
                )}&destination=${encodeURIComponent(destination)}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    collection,
                )}`;

        try {
            setError("");
            await Linking.openURL(url);
        } catch {
            setError(
                "Could not open a maps app on this device. Check that a browser or maps app is installed.",
            );
        }
    }

    return (
        <AppCard>
            <View style={styles.container}>
                <AppText variant="heading">{category} route</AppText>

                <AppText variant="secondary">
                    Review the saved addresses below. Open your phone's maps app for
                    navigation.
                </AppText>

                <View style={styles.location}>
                    <AppText variant="small">COLLECTION / QUEUE LOCATION</AppText>
                    <AppText>
                        {collection || "No collection location supplied"}
                    </AppText>
                </View>

                {!queueOnly ? (
                    <View style={styles.location}>
                        <AppText variant="small">DESTINATION</AppText>
                        <AppText>
                            {destination || "No destination supplied"}
                        </AppText>
                    </View>
                ) : null}

                <PrimaryButton
                    title="Open directions"
                    onPress={() => {
                        void openDirections();
                    }}
                />

                {error ? <AppText variant="error">{error}</AppText> : null}

                <AppText variant="small">
                    Native live location sharing and an embedded phone map are not
                    connected yet. No distance or travel time is estimated here.
                </AppText>
            </View>
        </AppCard>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: spacing.md,
    },
    location: {
        gap: spacing.xs,
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#D8DEE8",
    },
});
