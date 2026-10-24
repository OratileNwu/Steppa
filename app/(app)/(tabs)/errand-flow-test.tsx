import { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { PrimaryButton } from "@/components/PrimaryButton";
import { StatusBadge } from "@/components/StatusBadge";

import CreateErrandForm, {
  type CreateErrandInput,
} from "@/components/errands/CreateErrandForm";

import CustomerErrandDetails from "@/components/errands/CustomerErrandDetails";

import RunnerErrandDetails, {
  type RunnerErrand,
  type RunnerErrandAction,
} from "@/components/errands/RunnerErrandDetails";

import {
  colors,
  radius,
  spacing,
  typography,
} from "@/theme";

const STORAGE_KEY = "steppa.local-errand-flow.v1";
const LOCAL_RUNNER_ID = "local-test-runner";

type TestErrand = RunnerErrand & {
  createdAt: string;
  recommendedFee: number;
};

type StoredData = {
  version: 1;
  errands: TestErrand[];
};

type Role = "customer" | "runner";
type CustomerTab = "requests" | "create";
type RunnerTab = "available" | "active" | "completed";

function money(amount: number) {
  return `R${amount.toFixed(2)}`;
}

function isObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isMoney(value: unknown): value is number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    return false;
  }

  const cents = Math.round(value * 100);

  return (
    Number.isSafeInteger(cents) &&
    Math.abs(value * 100 - cents) < 0.000001
  );
}

function isCoordinate(value: unknown) {
  if (!Array.isArray(value) || value.length !== 2) {
    return false;
  }

  const [longitude, latitude] = value;

  return (
    typeof longitude === "number" &&
    typeof latitude === "number" &&
    Number.isFinite(longitude) &&
    Number.isFinite(latitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
}

function isLocation(value: unknown) {
  return (
    isObject(value) &&
    typeof value.label === "string" &&
    isCoordinate(value.coordinates)
  );
}

function isTestErrand(value: unknown): value is TestErrand {
  if (!isObject(value)) return false;

  for (const field of [
    "id",
    "title",
    "description",
    "location",
    "createdAt",
  ]) {
    if (typeof value[field] !== "string") {
      return false;
    }
  }

  if (
    typeof value.category !== "string" ||
    ![
      "Groceries",
      "Parcel collection/Pickup",
      "Queue for me",
      "Other errands",
    ].includes(value.category) ||
    typeof value.status !== "string" ||
    ![
      "requested",
      "accepted",
      "in_progress",
      "completed",
      "cancelled",
    ].includes(value.status) ||
    !isMoney(value.fee) ||
    !isMoney(value.recommendedFee)
  ) {
    return false;
  }

  if (
    value.agreedFee !== undefined &&
    !isMoney(value.agreedFee)
  ) {
    return false;
  }

  for (const field of [
    "assignedRunnerId",
    "distance",
    "collectionAddress",
    "destinationAddress",
    "preferredAt",
    "preferredUntil",
    "institution",
    "queueLocation",
    "serviceNeeded",
  ]) {
    if (
      value[field] !== undefined &&
      typeof value[field] !== "string"
    ) {
      return false;
    }
  }

  if (value.counterOffer !== undefined) {
    if (
      !isObject(value.counterOffer) ||
      !isMoney(value.counterOffer.amount) ||
      typeof value.counterOffer.status !== "string" ||
      !["pending", "accepted", "declined"].includes(
        value.counterOffer.status,
      )
    ) {
      return false;
    }
  }

  if (value.route !== undefined) {
    if (
      !isObject(value.route) ||
      !isLocation(value.route.collection) ||
      (value.route.destination !== null &&
        !isLocation(value.route.destination))
    ) {
      return false;
    }

    for (const field of [
      "distanceMeters",
      "durationSeconds",
    ]) {
      const amount = value.route[field];

      if (
        amount !== null &&
        (typeof amount !== "number" ||
          !Number.isFinite(amount) ||
          amount < 0)
      ) {
        return false;
      }
    }
  }

  if (value.statusTimes !== undefined) {
    if (
      !isObject(value.statusTimes) ||
      !Object.values(value.statusTimes).every(
        (time) => typeof time === "string",
      )
    ) {
      return false;
    }
  }

  if (
    value.customer !== undefined &&
    (!isObject(value.customer) ||
      typeof value.customer.name !== "string")
  ) {
    return false;
  }

  for (const field of [
    "maxWaitMinutes",
    "notifyBeforeMinutes",
  ]) {
    const amount = value[field];

    if (
      amount !== undefined &&
      (typeof amount !== "number" ||
        !Number.isFinite(amount) ||
        amount < 0)
    ) {
      return false;
    }
  }

  return true;
}

function readErrands(): TestErrand[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (raw === null) return [];

  const parsed: unknown = JSON.parse(raw);

  if (
    !isObject(parsed) ||
    parsed.version !== 1 ||
    !Array.isArray(parsed.errands) ||
    !parsed.errands.every(isTestErrand)
  ) {
    throw new Error(
      "Saved test data could not be read. It has not been overwritten.",
    );
  }

  const ids = parsed.errands.map((errand) => errand.id);

  if (new Set(ids).size !== ids.length) {
    throw new Error(
      "Saved test data contains duplicate IDs.",
    );
  }

  return parsed.errands;
}

function createId() {
  if (typeof window.crypto?.randomUUID === "function") {
    return `STP-${window.crypto.randomUUID()}`;
  }

  return (
    `STP-${Date.now().toString(36)}-` +
    Math.random().toString(36).slice(2, 10)
  );
}

export default function ErrandFlowTestScreen() {
  const [role, setRole] = useState<Role>("customer");

  const [customerTab, setCustomerTab] =
    useState<CustomerTab>("requests");

  const [runnerTab, setRunnerTab] =
    useState<RunnerTab>("available");

  const [errands, setErrands] = useState<TestErrand[]>([]);
  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [ready, setReady] = useState(Platform.OS !== "web");
  const [storageError, setStorageError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    function load() {
      try {
        setErrands(readErrands());
        setStorageError("");
      } catch (caughtError) {
        setStorageError(
          caughtError instanceof Error
            ? caughtError.message
            : "Browser storage is unavailable.",
        );
      } finally {
        setReady(true);
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY || event.key === null) {
        load();
      }
    }

    load();
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  function refreshErrands() {
    try {
      setErrands(readErrands());
      setStorageError("");
    } catch (caughtError) {
      setStorageError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not read saved errands.",
      );
    }
  }

  function saveChange(
    change: (current: TestErrand[]) => TestErrand[],
  ) {
    let current: TestErrand[];

    try {
      current = readErrands();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Could not read saved errands.";

      setStorageError(message);
      throw new Error(message);
    }

    // Action validation happens before writing.
    const next = change(current);

    const stored: StoredData = {
      version: 1,
      errands: next,
    };

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(stored),
      );
    } catch {
      const message =
        "Could not save this action in browser storage.";

      setStorageError(message);
      throw new Error(message);
    }

    // Update the screen only after the save succeeds.
    setErrands(next);
    setStorageError("");
  }

  async function submitOffer(input: CreateErrandInput) {
    if (role !== "customer") {
      throw new Error(
        "Use the Customer test view to submit an errand.",
      );
    }

    if (
      !input.route ||
      !isLocation(input.route.collection) ||
      !isMoney(input.offeredFee) ||
      input.offeredFee < 30 ||
      !isMoney(input.recommendedFee)
    ) {
      throw new Error(
        "A confirmed route and valid offer are required.",
      );
    }

    if (
      input.category !== "Queue for me" &&
      !isLocation(input.route.destination)
    ) {
      throw new Error(
        "A confirmed delivery location is required.",
      );
    }

    const now = new Date().toISOString();

    const record: TestErrand = {
      id: createId(),
      title:
        input.description.trim().split(/\r?\n/)[0].slice(0, 80) ||
        input.category,
      category: input.category,
      description: input.description,
      location: input.route.collection.label,
      collectionAddress:
        input.category === "Queue for me"
          ? undefined
          : input.collectionAddress,
      destinationAddress:
        input.category === "Queue for me"
          ? undefined
          : input.destinationAddress,
      queueLocation:
        input.category === "Queue for me"
          ? input.queueLocation
          : undefined,
      institution:
        input.category === "Queue for me"
          ? input.institution
          : undefined,
      serviceNeeded:
        input.category === "Queue for me"
          ? input.serviceNeeded
          : undefined,
      maxWaitMinutes:
        input.category === "Queue for me"
          ? input.maxWaitMinutes
          : undefined,
      notifyBeforeMinutes:
        input.category === "Queue for me"
          ? input.notifyBeforeMinutes
          : undefined,
      fee: input.offeredFee,
      recommendedFee: input.recommendedFee,
      preferredAt: input.preferredAt,
      preferredUntil: input.preferredUntil,
      route: input.route,
      status: "requested",
      createdAt: now,
      customer: {
        name: "Customer - local test role",
      },
      statusTimes: {
        requested: now,
      },
    };

    saveChange((current) => [record, ...current]);

    setSelectedId(null);
    setCustomerTab("requests");
    setNotice(
      "Offer saved in this browser. Open View details to track its progress.",
    );
  }

  async function handleRunnerAction(
    id: string,
    action: RunnerErrandAction,
  ) {
    if (role !== "runner") {
      throw new Error(
        "This action belongs to the Steppa test view.",
      );
    }

    saveChange((current) => {
      const existing = current.find(
        (errand) => errand.id === id,
      );

      if (!existing) {
        throw new Error("This errand was not found.");
      }

      const now = new Date().toISOString();
      let updated: TestErrand;

      if (action === "accept") {
        if (
          existing.status !== "requested" ||
          existing.assignedRunnerId
        ) {
          throw new Error(
            "This errand is no longer available.",
          );
        }

        updated = {
          ...existing,
          status: "accepted",
          assignedRunnerId: LOCAL_RUNNER_ID,
          agreedFee: existing.fee,
          counterOffer: existing.counterOffer
            ? {
                ...existing.counterOffer,
                status: "declined",
              }
            : undefined,
          statusTimes: {
            ...existing.statusTimes,
            accepted: now,
          },
        };
      } else {
        if (
          existing.assignedRunnerId !== LOCAL_RUNNER_ID
        ) {
          throw new Error(
            "This errand is not assigned to this test Steppa.",
          );
        }

        if (action === "start") {
          if (existing.status !== "accepted") {
            throw new Error(
              "Accept the errand before starting.",
            );
          }

          updated = {
            ...existing,
            status: "in_progress",
            statusTimes: {
              ...existing.statusTimes,
              in_progress: now,
            },
          };
        } else if (action === "complete") {
          if (existing.status !== "in_progress") {
            throw new Error(
              "Start the errand before completing it.",
            );
          }

          updated = {
            ...existing,
            status: "completed",
            statusTimes: {
              ...existing.statusTimes,
              completed: now,
            },
          };
        } else {
          throw new Error("Unsupported errand action.");
        }
      }

      return current.map((errand) =>
        errand.id === id ? updated : errand,
      );
    });
  }

  async function handleCounterOffer(
    id: string,
    amount: number,
  ) {
    if (role !== "runner") {
      throw new Error(
        "Counteroffers belong to the Steppa test view.",
      );
    }

    if (!isMoney(amount) || amount < 30) {
      throw new Error(
        "The counteroffer must be at least R30.",
      );
    }

    saveChange((current) => {
      const existing = current.find(
        (errand) => errand.id === id,
      );

      if (
        !existing ||
        existing.status !== "requested" ||
        existing.assignedRunnerId
      ) {
        throw new Error(
          "This errand is no longer available.",
        );
      }

      if (existing.counterOffer?.status === "pending") {
        throw new Error(
          "A counteroffer is already awaiting a response.",
        );
      }

      return current.map((errand) =>
        errand.id === id
          ? {
              ...errand,
              counterOffer: {
                amount,
                status: "pending",
              },
            }
          : errand,
      );
    });
  }

  async function respondToCounterOffer(
    id: string,
    accept: boolean,
  ) {
    if (role !== "customer") {
      throw new Error(
        "Only the Customer test view can respond.",
      );
    }

    saveChange((current) => {
      const existing = current.find(
        (errand) => errand.id === id,
      );

      if (
        !existing ||
        existing.status !== "requested" ||
        existing.assignedRunnerId ||
        existing.counterOffer?.status !== "pending"
      ) {
        throw new Error(
          "This counteroffer is no longer pending.",
        );
      }

      const counterOffer = existing.counterOffer;

      const updated: TestErrand = accept
        ? {
            ...existing,
            status: "accepted",
            assignedRunnerId: LOCAL_RUNNER_ID,
            agreedFee: counterOffer.amount,
            counterOffer: {
              ...counterOffer,
              status: "accepted",
            },
            statusTimes: {
              ...existing.statusTimes,
              accepted: new Date().toISOString(),
            },
          }
        : {
            ...existing,
            counterOffer: {
              ...counterOffer,
              status: "declined",
            },
          };

      return current.map((errand) =>
        errand.id === id ? updated : errand,
      );
    });
  }

  function switchRole(nextRole: Role) {
    setSelectedId(null);
    setCustomerTab("requests");
    setRole(nextRole);
    setNotice("");
  }

  const selectedErrand = errands.find(
    (errand) => errand.id === selectedId,
  );

  const runnerErrands = errands.filter((errand) => {
    if (runnerTab === "available") {
      return (
        errand.status === "requested" &&
        !errand.assignedRunnerId
      );
    }

    if (errand.assignedRunnerId !== LOCAL_RUNNER_ID) {
      return false;
    }

    return runnerTab === "completed"
      ? errand.status === "completed"
      : errand.status === "accepted" ||
          errand.status === "in_progress";
  });

  const visibleErrands =
    role === "customer" ? errands : runnerErrands;

  if (Platform.OS !== "web") {
    return (
      <View style={styles.nativeNotice}>
        <AppText variant="heading">
          Browser test page
        </AppText>

        <AppText>
          Open this page in your browser. This test uses browser
          storage and does not connect real customer and Steppa
          accounts.
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.banner}>
        <AppText style={styles.bannerTitle}>
          Local errand flow test
        </AppText>

        <AppText variant="small">
          Role switching is for testing only. Both views share
          this browser&apos;s saved errands. Firebase account access,
          payments and live location sharing are not connected.
        </AppText>
      </View>

      <View style={styles.roleBar}>
        {(
          [
            { value: "customer", label: "Customer" },
            { value: "runner", label: "Steppa" },
          ] as const
        ).map((item) => (
          <Pressable
            key={item.value}
            accessibilityRole="tab"
            accessibilityState={{
              selected: role === item.value,
            }}
            onPress={() => switchRole(item.value)}
            style={[
              styles.roleButton,
              role === item.value && styles.selectedButton,
            ]}
          >
            <AppText
              style={[
                styles.roleText,
                role === item.value && styles.selectedText,
              ]}
            >
              {item.label}
            </AppText>
          </Pressable>
        ))}
      </View>

      {storageError ? (
        <View style={styles.message}>
          <AppText variant="error" accessibilityRole="alert">
            {storageError}
          </AppText>
        </View>
      ) : null}

      {!ready ? (
        <View style={styles.message}>
          <AppText>Loading saved test errands...</AppText>
        </View>
      ) : selectedErrand ? (
        <View style={styles.flex}>
          {role === "customer" ? (
            <CustomerErrandDetails
              key={`customer-${selectedErrand.id}`}
              errand={selectedErrand}
              runnerName={
                selectedErrand.assignedRunnerId ===
                LOCAL_RUNNER_ID
                  ? "Steppa - local test role"
                  : undefined
              }
              onBack={() => setSelectedId(null)}
              onRespondToCounterOffer={respondToCounterOffer}
            />
          ) : (
            <RunnerErrandDetails
              key={`runner-${selectedErrand.id}`}
              errand={selectedErrand}
              currentRunnerId={LOCAL_RUNNER_ID}
              isOnline
              onBack={() => setSelectedId(null)}
              onAction={handleRunnerAction}
              onCounterOffer={handleCounterOffer}
            />
          )}
        </View>
      ) : role === "customer" &&
        customerTab === "create" ? (
        <View style={styles.flex}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setCustomerTab("requests")}
            style={styles.backButton}
          >
            <AppText style={styles.link}>
              Back to my local requests
            </AppText>
          </Pressable>

          <View style={styles.flex}>
            <CreateErrandForm onSubmit={submitOffer} />
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {notice ? (
              <AppCard style={styles.noticeCard}>
                <AppText accessibilityLiveRegion="polite">
                  {notice}
                </AppText>
              </AppCard>
            ) : null}

            <AppText variant="heading">
              {role === "customer"
                ? "My local requests"
                : "Steppa test errands"}
            </AppText>

            {role === "customer" ? (
              <PrimaryButton
                title="Create an errand"
                disabled={Boolean(storageError)}
                onPress={() => {
                  setSelectedId(null);
                  setNotice("");
                  setCustomerTab("create");
                }}
              />
            ) : (
              <View style={styles.filterRow}>
                {(
                  [
                    { value: "available", label: "Available" },
                    { value: "active", label: "My active" },
                    { value: "completed", label: "Completed" },
                  ] as const
                ).map((tab) => (
                  <Pressable
                    key={tab.value}
                    accessibilityRole="tab"
                    accessibilityState={{
                      selected: runnerTab === tab.value,
                    }}
                    onPress={() => setRunnerTab(tab.value)}
                    style={[
                      styles.filterButton,
                      runnerTab === tab.value &&
                        styles.selectedButton,
                    ]}
                  >
                    <AppText
                      style={[
                        styles.roleText,
                        runnerTab === tab.value &&
                          styles.selectedText,
                      ]}
                    >
                      {tab.label}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            )}

            <Pressable
              accessibilityRole="button"
              onPress={refreshErrands}
              style={styles.backButton}
            >
              <AppText style={styles.link}>
                Refresh saved errands
              </AppText>
            </Pressable>

            {visibleErrands.length === 0 ? (
              <AppCard>
                <AppText variant="heading">
                  No errands in this view
                </AppText>

                <AppText variant="secondary">
                  {role === "customer"
                    ? "Create an errand, confirm its locations and submit an offer."
                    : "Create an offer under the Customer test role first. Accepted errands move to My active."}
                </AppText>
              </AppCard>
            ) : (
              visibleErrands.map((errand) => (
                <AppCard key={errand.id}>
                  <View style={styles.cardHeading}>
                    <AppText
                      variant="heading"
                      style={styles.cardTitle}
                    >
                      {errand.title}
                    </AppText>

                    <StatusBadge status={errand.status} />
                  </View>

                  <AppText variant="small">
                    {errand.category}
                  </AppText>

                  <AppText variant="secondary">
                    {errand.description}
                  </AppText>

                  <AppText variant="secondary">
                    {errand.location}
                  </AppText>

                  <AppText style={styles.fee}>
                    {errand.agreedFee !== undefined
                      ? `Agreed fee: ${money(errand.agreedFee)}`
                      : `Customer offer: ${money(errand.fee)}`}
                  </AppText>

                  {errand.counterOffer ? (
                    <AppText variant="secondary">
                      Counteroffer:{" "}
                      {money(errand.counterOffer.amount)}
                      {" - "}
                      {errand.counterOffer.status}
                    </AppText>
                  ) : null}

                  {role === "customer" &&
                  errand.status === "requested" &&
                  errand.counterOffer?.status === "pending" ? (
                    <AppText style={styles.link}>
                      Open details to respond to the counteroffer.
                    </AppText>
                  ) : null}

                  <PrimaryButton
                    title={
                      role === "customer"
                        ? "View details and progress"
                        : "View errand"
                    }
                    onPress={() => {
                      setNotice("");
                      setSelectedId(errand.id);
                    }}
                  />
                </AppCard>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  banner: {
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.primaryLight,
  },
  bannerTitle: {
    color: colors.primary,
    fontWeight: "700",
  },
  roleBar: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
  },
  roleButton: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectedButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleText: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  selectedText: {
    color: colors.textOnPrimary,
  },
  scrollContent: {
    padding: spacing.md,
    alignItems: "center",
  },
  content: {
    width: "100%",
    maxWidth: 560,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  message: {
    padding: spacing.md,
  },
  noticeCard: {
    backgroundColor: colors.primaryLight,
  },
  backButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  link: {
    color: colors.primary,
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  filterButton: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  cardHeading: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
  },
  fee: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: typography.subtitle,
  },
  nativeNotice: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
});