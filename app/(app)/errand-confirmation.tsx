
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View, Pressable } from "react-native";

export default function ErrandConfirmationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Errand submitted" }} />

      <View style={styles.icon}>
        <Text style={styles.check}>✓</Text>
      </View>

      <Text style={styles.title}>Request submitted!</Text>

      <Text style={styles.description}>
        Your errand request has been saved. Your offer is pending review and
        has not yet been accepted by a runner.
      </Text>

      {id ? (
        <Text style={styles.reference}>Reference: {id}</Text>
      ) : null}

      <Pressable
        style={styles.button}
        onPress={() => router.replace("/(app)/(tabs)")}
      >
        <Text style={styles.buttonText}>Back to dashboard</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  check: {
    fontSize: 38,
    color: "#15803D",
    fontWeight: "700",
  },
  title: {
    fontSize: 25,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#4B5563",
    textAlign: "center",
    marginBottom: 18,
  },
  reference: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#16A34A",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
