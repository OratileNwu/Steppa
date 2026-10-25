import { useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { PrimaryButton } from "@/components/PrimaryButton";
import { StatusBadge } from "@/components/StatusBadge";
import { colors, radius, spacing } from "@/theme";

import ErrandRoutePreview from "./ErrandRoutePreview";
import type {
  RunnerErrand,
  RunnerErrandStatus,
} from "./RunnerErrandDetails";

type Props = {
  errand: RunnerErrand;
  runnerName?: string;
  onBack: () => void;
  onRespondToCounterOffer?: (
    id: string,
    accept: boolean,
  ) => Promise<void>;
  onConfirmCompletion?: (confirmed: boolean) => Promise<void>;
};

const steps: {
  status: RunnerErrandStatus;
  title: string;
  description: string;
}[] = [
  {
    status: "requested",
    title: "Requested",
    description: "Your errand has been submitted.",
  },
  {
    status: "accepted",
    title: "Accepted",
    description: "A Steppa has accepted your errand.",
  },
  {
    status: "in_progress",
    title: "In progress",
    description: "Your Steppa has started the errand.",
  },
  {
    status: "awaiting_customer_confirmation",
    title: "Awaiting your confirmation",
    description: "Your Steppa reports delivery. Confirm receipt or report a problem.",
  },
  {
    status: "completion_disputed",
    title: "Problem reported",
    description: "This errand needs follow-up.",
  },
  {
    status: "completed",
    title: "Completed",
    description: "You confirmed this errand was completed.",
  },
];

function money(amount: number) {
  return `R${amount.toFixed(2)}`;
}

function dateLabel(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "";
  }

  return date.toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusDescription(errand: RunnerErrand) {
  switch (errand.status) {
    case "requested":
      return errand.counterOffer?.status === "pending"
        ? "A Steppa has proposed a different fee. Review it below."
        : "Waiting for a Steppa to accept your errand.";
    case "accepted":
      return "Your Steppa has accepted the errand and has not started yet.";
    case "in_progress":
      return "Your Steppa is working on your errand.";
    case "awaiting_customer_confirmation":
      return "Your Steppa reports delivery. Please confirm receipt or report a problem.";
    case "completion_disputed":
      return "You reported a problem. This errand needs follow-up.";
    case "completed":
      return "You confirmed this errand was completed.";
    case "cancelled":
      return "This errand has been cancelled.";
  }
}

export default function CustomerErrandDetails({
  errand,
  runnerName,
  onBack,
  onRespondToCounterOffer,
  onConfirmCompletion,
}: Props) {
  const [busy, setBusy] = useState<"accept" | "decline" | null>(
    null,
  );
  const [error, setError] = useState("");
  const actionInProgress = useRef(false);

  const queueOnly = errand.category === "Queue for me";

  const collection =
    errand.route?.collection.label ||
    errand.queueLocation ||
    errand.collectionAddress ||
    errand.location;

  const destination =
    errand.route?.destination?.label ||
    errand.destinationAddress;

  const currentStep = steps.findIndex(
    (step) => step.status === errand.status,
  );

  const pendingCounterOffer =
    errand.status === "requested" &&
    !errand.assignedRunnerId &&
    errand.counterOffer?.status === "pending";

  const canRespond =
    pendingCounterOffer &&
    Boolean(onRespondToCounterOffer) &&
    busy === null;

  async function respond(accept: boolean) {
    if (
      actionInProgress.current ||
      !pendingCounterOffer ||
      !onRespondToCounterOffer
    ) {
      return;
    }

    actionInProgress.current = true;
    setBusy(accept ? "accept" : "decline");
    setError("");

    try {
      await onRespondToCounterOffer(errand.id, accept);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Your response could not be saved. Please retry.",
      );
    } finally {
      actionInProgress.current = false;
      setBusy(null);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={styles.backButton}
        >
          <AppText style={styles.link}>
            Back to my errands
          </AppText>
        </Pressable>

        <View style={styles.header}>
          <View style={styles.heading}>
            <AppText variant="small">
              {errand.id}
            </AppText>

            <AppText variant="title">
              {errand.title}
            </AppText>

            <AppText variant="secondary">
              {errand.category}
            </AppText>
          </View>

          <StatusBadge status={errand.status} />
        </View>

        <AppCard style={styles.summaryCard}>
          <AppText variant="heading">
            Your errand
          </AppText>

          <AppText accessibilityLiveRegion="polite">
            {statusDescription(errand)}
          </AppText>
        </AppCard>

        <AppCard>
          <AppText variant="heading">Journey</AppText>

          <AppText variant="small">
            {queueOnly ? "QUEUE LOCATION" : "COLLECT FROM"}
          </AppText>

          <AppText>{collection}</AppText>

          {!queueOnly && destination ? (
            <>
              <View style={styles.divider} />

              <AppText variant="small">DELIVER TO</AppText>

              <AppText>{destination}</AppText>
            </>
          ) : null}

          {typeof errand.route?.distanceMeters === "number" ? (
            <AppText variant="secondary">
              Route distance:{" "}
              {(errand.route.distanceMeters / 1000).toFixed(1)} km
            </AppText>
          ) : null}

          {typeof errand.route?.durationSeconds === "number" ? (
            <AppText variant="secondary">
              Estimated driving time:{" "}
              {Math.max(
                1,
                Math.ceil(errand.route.durationSeconds / 60),
              )}{" "}
              min. This excludes shopping, queuing and stops.
            </AppText>
          ) : null}
        </AppCard>

        <AppCard>
          <AppText variant="heading">
            Task instructions
          </AppText>

          <AppText>{errand.description}</AppText>

          {queueOnly && errand.institution ? (
            <AppText>
              Institution: {errand.institution}
            </AppText>
          ) : null}

          {queueOnly && errand.serviceNeeded ? (
            <AppText>
              Service needed: {errand.serviceNeeded}
            </AppText>
          ) : null}

          {queueOnly && errand.maxWaitMinutes !== undefined ? (
            <AppText>
              Maximum queue time: {errand.maxWaitMinutes} minutes
            </AppText>
          ) : null}

          {queueOnly &&
          errand.notifyBeforeMinutes !== undefined ? (
            <AppText>
              Requested notice: {errand.notifyBeforeMinutes} minutes
              before your turn
            </AppText>
          ) : null}

          {dateLabel(errand.preferredAt) ? (
            <>
              <AppText variant="small">
                PREFERRED TIME
              </AppText>

              <AppText>
                {dateLabel(errand.preferredAt)}
                {dateLabel(errand.preferredUntil)
                  ? ` - ${dateLabel(errand.preferredUntil)}`
                  : ""}
              </AppText>
            </>
          ) : null}
        </AppCard>

        <AppCard>
          <AppText variant="heading">
            Your Steppa
          </AppText>

          <AppText>
            {errand.assignedRunnerId
              ? runnerName?.trim() || "Steppa assigned"
              : "No Steppa assigned yet"}
          </AppText>

          <AppText variant="secondary">
            {errand.assignedRunnerId
              ? "Progress below reflects the latest errand status supplied to this screen."
              : "The assigned Steppa's details will appear after acceptance."}
          </AppText>
        </AppCard>

        <AppCard style={styles.summaryCard}>
          <View style={styles.row}>
            <AppText>Your original offer</AppText>
            <AppText style={styles.amount}>
              {money(errand.fee)}
            </AppText>
          </View>

          {errand.agreedFee !== undefined ? (
            <View style={styles.row}>
              <AppText>Agreed fee</AppText>
              <AppText style={styles.amount}>
                {money(errand.agreedFee)}
              </AppText>
            </View>
          ) : null}

          <AppText variant="small">
            Runner service fee only. Purchases and institution
            charges are separate. This screen does not process payment.
          </AppText>
        </AppCard>

        {errand.counterOffer ? (
          <AppCard>
            <AppText variant="heading">
              Steppa counteroffer
            </AppText>

            <AppText style={styles.amount}>
              {money(errand.counterOffer.amount)}
            </AppText>

            <AppText variant="secondary">
              Status: {errand.counterOffer.status}
            </AppText>

            {pendingCounterOffer ? (
              <>
                <AppText>
                  Accept this fee to assign the errand to the
                  proposing Steppa, or decline to keep your
                  original offer available.
                </AppText>

                <PrimaryButton
                  title={`Accept ${money(
                    errand.counterOffer.amount,
                  )}`}
                  disabled={!canRespond}
                  loading={busy === "accept"}
                  onPress={() => void respond(true)}
                />

                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !canRespond }}
                  disabled={!canRespond}
                  onPress={() => void respond(false)}
                  style={[
                    styles.outlineButton,
                    !canRespond && styles.disabled,
                  ]}
                >
                  <AppText style={styles.link}>
                    {busy === "decline"
                      ? "Saving response..."
                      : "Decline counteroffer"}
                  </AppText>
                </Pressable>

                {!onRespondToCounterOffer ? (
                  <AppText variant="secondary">
                    Counteroffer responses have not been connected.
                  </AppText>
                ) : null}
              </>
            ) : null}
          </AppCard>
        ) : null}

        {error ? (
          <AppText variant="error" accessibilityRole="alert">
            {error}
          </AppText>
        ) : null}

        {errand.status === "awaiting_customer_confirmation" && onConfirmCompletion ? (
          <AppCard>
            <AppText variant="heading">Did your errand arrive?</AppText>
            <AppText>Your Steppa has reported delivery. Confirm only if the task was completed as requested.</AppText>
            <PrimaryButton title="Confirm completion" onPress={() => {
              if (actionInProgress.current) return;
              actionInProgress.current = true;
              setError("");
              void onConfirmCompletion(true).catch((e) => setError(e instanceof Error ? e.message : "Could not confirm completion.")).finally(() => { actionInProgress.current = false; });
            }} />
            <Pressable accessibilityRole="button" onPress={() => {
              if (actionInProgress.current) return;
              actionInProgress.current = true;
              setError("");
              void onConfirmCompletion(false).catch((e) => setError(e instanceof Error ? e.message : "Could not report the problem.")).finally(() => { actionInProgress.current = false; });
            }} style={styles.outlineButton}>
              <AppText style={styles.link}>Report a problem</AppText>
            </Pressable>
          </AppCard>
        ) : null}

        <AppCard>
          <AppText variant="heading">
            Errand progress
          </AppText>

          {errand.status === "cancelled" ? (
            <AppText>
              This errand was cancelled
              {dateLabel(errand.statusTimes?.cancelled)
                ? ` on ${dateLabel(
                    errand.statusTimes?.cancelled,
                  )}`
                : ""}
              .
            </AppText>
          ) : (
            steps.map((step, index) => {
              const reached = index <= currentStep;
              const current = index === currentStep;
              const timestamp = dateLabel(
                errand.statusTimes?.[step.status],
              );

              return (
                <View key={step.status} style={styles.step}>
                  <View
                    style={[
                      styles.stepNumber,
                      reached && styles.reachedStep,
                    ]}
                  >
                    <AppText
                      style={[
                        styles.stepNumberText,
                        reached && styles.reachedText,
                      ]}
                    >
                      {index + 1}
                    </AppText>
                  </View>

                  <View style={styles.stepContent}>
                    <AppText
                      style={current ? styles.currentTitle : undefined}
                    >
                      {step.title}
                      {current ? " - current" : ""}
                    </AppText>

                    <AppText variant="small">
                      {reached ? step.description : "Pending"}
                    </AppText>

                    {timestamp ? (
                      <AppText variant="small">
                        {timestamp}
                      </AppText>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </AppCard>

        <AppText variant="heading">
          Route preview
        </AppText>

        <ErrandRoutePreview route={errand.route} />

        <AppText variant="small">
          This map shows the selected locations and route.
          Live Steppa location sharing is not connected.
        </AppText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
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
  backButton: {
    minHeight: 44,
    justifyContent: "center",
  },
  link: {
    color: colors.primary,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  heading: {
    flex: 1,
    gap: spacing.xs,
  },
  summaryCard: {
    backgroundColor: colors.primaryLight,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  amount: {
    color: colors.primary,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  outlineButton: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  reachedStep: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  stepNumberText: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  reachedText: {
    color: colors.textOnPrimary,
  },
  stepContent: {
    flex: 1,
    gap: spacing.xs,
  },
  currentTitle: {
    color: colors.primary,
    fontWeight: "700",
  },
});