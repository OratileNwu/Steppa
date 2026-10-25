import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Redirect } from "expo-router";

import { useAuthSession } from "@/hooks/use-auth-session";
import { getProfile } from "@/services/profileService";

type Destination = "/(app)/(tabs)" | "/runner-home";

export default function AppEntryScreen() {
  const { user, demo } = useAuthSession();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;

    async function resolveDestination() {
      setDestination(null);
      setError("");

      if (demo) {
        if (active) setDestination("/(app)/(tabs)");
        return;
      }

      if (!user) {
        if (active) setError("Your session is unavailable. Please sign in again.");
        return;
      }

      try {
        const profile = await getProfile();
        if (active) {
          setDestination(
            profile.role === "steppa" ? "/runner-home" : "/(app)/(tabs)"
          );
        }
      } catch (cause) {
        console.error("[Steppa] Profile lookup failed:", cause);
        if (active) {
          setError(
            "We could not load your profile. Check your connection and Firebase settings, then try again."
          );
        }
      }
    }

    void resolveDestination();
    return () => {
      active = false;
    };
  }, [user, demo, retry]);

  if (destination) return <Redirect href={destination} />;

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        gap: 16,
        backgroundColor: "#FFFFFF",
      }}
    >
      {error ? (
        <>
          <Text style={{ fontSize: 19, fontWeight: "700", color: "#20252B", textAlign: "center" }}>
            Unable to open your dashboard
          </Text>
          <Text style={{ color: "#5D6670", textAlign: "center", lineHeight: 22 }}>
            {error}
          </Text>
          <Pressable
            onPress={() => setRetry((value) => value + 1)}
            style={{ backgroundColor: "#087F5B", paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12 }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Try again</Text>
          </Pressable>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color="#087F5B" />
          <Text style={{ color: "#5D6670" }}>Loading your Steppa dashboard…</Text>
        </>
      )}
    </View>
  );
}
