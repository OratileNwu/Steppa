
import { useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  ArrowLeft,
  Check,
  MapPin,
  Package,
  Star,
  UserRound,
} from "lucide-react-native";

import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { AppTextInput } from "@/components/AppTextInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { StatusBadge } from "@/components/StatusBadge";
import type { ConfirmedRoute } from "@/components/maps/types";
import { submitErrandRating } from "@/services/ratingService";
import { colors, radius, spacing, typography } from "@/theme";

import ErrandRoutePreview from "./ErrandRoutePreview";

export type RunnerErrandStatus =
  | "requested"
  | "accepted"
  | "in_progress"
  | "awaiting_customer_confirmation"
  | "completion_disputed"
  | "completed"
  | "cancelled";

export type RunnerErrandCategory =
  | "Groceries"
  | "Parcel collection/Pickup"
  | "Queue for me"
  | "Other errands";

export type RunnerErrand = {
  id: string;
  customerId?: string;
  title: string;
  category: RunnerErrandCategory;
  location: string;
  distance?: string;
  fee: number;
  agreedFee?: number;
  paymentMethod?: string;
  description: string;
  status: RunnerErrandStatus;
  assignedRunnerId?: string;
  collectionAddress?: string;
  destinationAddress?: string;
  route?: ConfirmedRoute;
  preferredAt?: string;
  preferredUntil?: string;
  institution?: string;
  queueLocation?: string;
  serviceNeeded?: string;
  maxWaitMinutes?: number;
  notifyBeforeMinutes?: number;
  customer?: {
    name: string;
  };
  counterOffer?: {
    amount: number;
    status: "pending" | "accepted" | "declined";
  };
  statusTimes?: Partial<Record<RunnerErrandStatus, string>>;
};

export type RunnerErrandAction = "accept" | "start" | "complete";

export type RunnerErrandHandlers = {
  onAction?: (
    id: string,
    action: RunnerErrandAction,
  ) => Promise<void>;
  onCounterOffer?: (id: string, amount: number) => Promise<void>;
};

type Props = RunnerErrandHandlers & {
  errand: RunnerErrand;
  currentRunnerId?: string;
  isOnline: boolean;
  onBack: () => void;
};

const progressSteps = [
  { status: "requested", label: "Requested" },
  { status: "accepted", label: "Accepted" },
  { status: "in_progress", label: "In progress" },
  { status: "completed", label: "Completed" },
] as const;

function money(value: number | undefined) {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
    ? `R${ value.toFixed(2) } `
    : "Unavailable";
}

function dateTime(value: string | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleString("en-ZA", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
}

export default function RunnerErrandDetails({
  errand,
  currentRunnerId,
  isOnline,
  onBack,
  onAction,
  onCounterOffer,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterAmount, setCounterAmount] = useState("");

  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingReview, setRatingReview] = useState("");
  const [ratingBusy, setRatingBusy] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [ratingNotice, setRatingNotice] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const busyRef = useRef(false);

  const isQueue = errand.category === "Queue for me";

  const isAssignedToMe = Boolean(
    currentRunnerId &&
      errand.assignedRunnerId === currentRunnerId,
  );

  const availableToAccept =
    errand.status === "requested" &&
    !errand.assignedRunnerId;

  const canAccept = Boolean(
    availableToAccept &&
      currentRunnerId &&
      isOnline &&
      onAction,
  );

  const canCounter = Boolean(
    availableToAccept &&
      currentRunnerId &&
      isOnline &&
      onCounterOffer &&
      errand.counterOffer?.status !== "pending",
  );

  const activeIndex = progressSteps.findIndex(
    (step) => step.status === errand.status,
  );

  const collectionLabel =
    errand.route?.collection.label ||
    (isQueue
      ? errand.queueLocation || errand.location
      : errand.collectionAddress || errand.location);

  const destinationLabel =
    errand.route?.destination?.label ||
    errand.destinationAddress;

  const preferredStart = dateTime(errand.preferredAt);
  const preferredEnd = dateTime(errand.preferredUntil);

  async function submitRating() {
    if (
      !isAssignedToMe ||
      errand.status !== "completed" ||
      !errand.customerId ||
      !currentRunnerId ||
      selectedRating < 1 ||
      selectedRating > 5 ||
      ratingBusy ||
      ratingSubmitted
    ) {
      setRatingError(
        "A valid rating can only be submitted for your completed errand.",
      );
      return;
    }

    setRatingBusy(true);
    setRatingError("");
    setRatingNotice("");

    try {
      await submitErrandRating(
        errand.id,
        errand.customerId,
        selectedRating,
        ratingReview,
      );

      setRatingSubmitted(true);
      setRatingNotice("Your rating was submitted successfully.");
    } catch (caughtError) {
      console.error("[Steppa] Rating submission failed:", caughtError);

      setRatingError(
        caughtError instanceof Error
          ? caughtError.message
          : "The rating could not be submitted. Please try again later.",
      );
    } finally {
      setRatingBusy(false);
    }
  }

  async function runAction(action: RunnerErrandAction) {
    const allowed =
      action === "accept"
        ? canAccept
        : isAssignedToMe &&
          Boolean(onAction) &&
          (action === "start"
            ? errand.status === "accepted"
            : errand.status === "in_progress");

    if (!allowed || !onAction || busyRef.current) {
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setError("");
    setNotice("");

    try {
      await onAction(errand.id, action);

      setNotice(
        "Update sent. The progress display will refresh when the latest errand data arrives.",
      );
    } catch (caughtError) {
      console.error("[Steppa] Errand action failed:", caughtError);
      const detail =
        caughtError instanceof Error
          ? caughtError.message
          : String(caughtError);

      setError(
        detail
          ? `Update failed: ${ detail } `
          : "The update could not be confirmed. Refresh the errand before retrying.",
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function sendCounterOffer() {
    const text = counterAmount.trim();

    if (!/^\d+(\.\d{1,2})?$/.test(text)) {
      setError("Enter a valid amount, for example 45 or 45.50.");
      return;
    }

    const amount = Number(text);

    if (
      !Number.isFinite(amount) ||
      amount < 30 ||
      !Number.isSafeInteger(Math.round(amount * 100))
    ) {
      setError("Enter an offer of at least R30.");
      return;
    }

    if (!canCounter || !onCounterOffer || busyRef.current) {
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setError("");
    setNotice("");

    try {
      await onCounterOffer(errand.id, amount);
      setCounterOpen(false);
      setNotice(
        "Counteroffer sent. Wait for the customer’s response before starting.",
      );
    } catch (caughtError) {
      console.error("[Steppa] Counteroffer failed:", caughtError);
      const detail =
        caughtError instanceof Error
          ? caughtError.message
          : String(caughtError);

      setError(
        detail
          ? `Counteroffer failed: ${ detail } `
          : "The counteroffer could not be confirmed. Refresh before retrying.",
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <ScreenContainer padded={false}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to runner dashboard"
            onPress={onBack}
            disabled={busy || ratingBusy}
            style={styles.backButton}
          >
            <ArrowLeft size={20} color={colors.primary} />
            <AppText style={styles.link}>Back to errands</AppText>
          </Pressable>

          <View style={styles.heading}>
            <View style={styles.categoryIcon}>
              <Package size={22} color={colors.primary} />
            </View>

            <View style={styles.flex}>
              <AppText variant="small">{errand.id}</AppText>
              <AppText variant="heading">{errand.title}</AppText>
              <AppText variant="secondary">{errand.category}</AppText>
            </View>

            <StatusBadge status={errand.status} />
          </View>

          <AppCard>
            <AppText variant="heading">
              {isQueue ? "Queue location" : "Journey"}
            </AppText>

            <View style={styles.locationRow}>
              <MapPin size={20} color={colors.primary} />
              <View style={styles.flex}>
                <AppText variant="small">
                  {isQueue ? "QUEUE AT" : "COLLECT FROM"}
                </AppText>
                <AppText style={styles.label}>
                  {collectionLabel || "Location unavailable"}
                </AppText>
              </View>
            </View>

            {!isQueue ? (
              <View style={styles.locationRow}>
                <MapPin size={20} color={colors.text} />
                <View style={styles.flex}>
                  <AppText variant="small">DELIVER TO</AppText>
                  <AppText style={styles.label}>
                    {destinationLabel || "Location unavailable"}
                  </AppText>
                </View>
              </View>
            ) : null}
          </AppCard>

          <AppCard>
            <AppText variant="heading">Task instructions</AppText>
            <AppText>{errand.description}</AppText>

            {preferredStart ? (
              <>
                <AppText style={styles.label}>Preferred time</AppText>
                <AppText variant="secondary">
                  {preferredStart}
                  {preferredEnd ? ` – ${ preferredEnd } ` : ""}
                </AppText>
              </>
            ) : null}

            {isQueue ? (
              <>
                {errand.institution ? (
                  <AppText variant="secondary">
                    Institution: {errand.institution}
                  </AppText>
                ) : null}

                {errand.serviceNeeded ? (
                  <AppText>Service: {errand.serviceNeeded}</AppText>
                ) : null}

                {errand.maxWaitMinutes !== undefined ? (
                  <AppText variant="secondary">
                    Maximum waiting time: {errand.maxWaitMinutes} min
                  </AppText>
                ) : null}

                {errand.notifyBeforeMinutes !== undefined ? (
                  <AppText variant="secondary">
                    Requested advance notice: {errand.notifyBeforeMinutes} min
                  </AppText>
                ) : null}
              </>
            ) : null}
          </AppCard>

          <AppCard>
            <View style={styles.sectionHeading}>
              <UserRound size={20} color={colors.primary} />
              <AppText variant="heading">Customer</AppText>
            </View>

            <AppText variant="secondary">
              {isAssignedToMe && errand.customer?.name
                ? errand.customer.name
                : "Customer details will appear here when you are assigned and the details are available."}
            </AppText>
          </AppCard>

          <AppCard style={styles.feeCard}>
            <AppText variant="secondary">Customer payment method</AppText>
            <AppText variant="heading">
              {errand.paymentMethod ?? "Not selected"}
            </AppText>
            <AppText variant="small">
              Payment is simulated in this prototype; no real payment is processed.
            </AppText>

            <View style={styles.feeRow}>
              <AppText style={styles.label}>Customer’s original offer</AppText>
              <AppText style={styles.fee}>{money(errand.fee)}</AppText>
            </View>

            {errand.agreedFee !== undefined ? (
              <View style={styles.feeRow}>
                <AppText style={styles.label}>Agreed fee</AppText>
                <AppText style={styles.fee}>
                  {money(errand.agreedFee)}
                </AppText>
              </View>
            ) : null}

            {errand.counterOffer ? (
              <AppText variant="secondary">
                Runner counteroffer: {money(errand.counterOffer.amount)}
                {" · "}
                {errand.counterOffer.status}
              </AppText>
            ) : null}

            <AppText variant="small">
              Runner service fee only. Purchases and institution charges are separate.
            </AppText>
          </AppCard>

          <AppCard>
            <AppText variant="heading">Progress</AppText>

            {errand.status === "cancelled" ? (
              <AppText variant="secondary">
                This errand was cancelled. It cannot be started or completed.
              </AppText>
            ) : (
              progressSteps.map((step, index) => {
                const finished = index < activeIndex;
                const current = index === activeIndex;
                const timestamp = dateTime(
                  errand.statusTimes?.[step.status],
                );

                return (
                  <View key={step.status} style={styles.progressRow}>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressCircle,
                          (finished || current) && styles.activeCircle,
                        ]}
                      >
                        {finished ? (
                          <Check
                            size={15}
                            color={colors.textOnPrimary}
                          />
                        ) : (
                          <AppText
                            style={[
                              styles.stepNumber,
                              current && styles.activeStepNumber,
                            ]}
                          >
                            {index + 1}
                          </AppText>
                        )}
                      </View>

                      {index < progressSteps.length - 1 ? (
                        <View
                          style={[
                            styles.progressLine,
                            finished && styles.activeLine,
                          ]}
                        />
                      ) : null}
                    </View>

                    <View style={styles.progressText}>
                      <AppText style={styles.label}>
                        {step.label}
                      </AppText>
                      <AppText variant="small">
                        {timestamp ||
                          (current
                            ? "Current status"
                            : finished
                              ? "Reached"
                              : "Pending")}
                      </AppText>
                    </View>
                  </View>
                );
              })
            )}
          </AppCard>

          <AppCard>
            <AppText variant="heading">Route map</AppText>
            <ErrandRoutePreview route={errand.route} />
          </AppCard>

          {availableToAccept ? (
            <AppCard>
              <AppText variant="heading">Take this errand</AppText>

              <PrimaryButton
                title={`Accept offer · ${ money(errand.fee) } `}
                loading={busy}
                disabled={!canAccept}
                onPress={() => {
                  void runAction("accept");
                }}
              />

              <Pressable
                accessibilityRole="button"
                disabled={!canCounter || busy}
                onPress={() => {
                  setError("");
                  setCounterAmount(
                    Number.isFinite(errand.fee)
                      ? String(errand.fee)
                      : "",
                  );
                  setCounterOpen((current) => !current);
                }}
                style={[
                  styles.outlineButton,
                  (!canCounter || busy) && styles.disabled,
                ]}
              >
                <AppText style={styles.link}>Make a counteroffer</AppText>
              </Pressable>

              {counterOpen ? (
                <>
                  <AppTextInput
                    label="Your counteroffer (R)"
                    value={counterAmount}
                    onChangeText={setCounterAmount}
                    placeholder="Enter your proposed fee"
                    keyboardType="decimal-pad"
                    maxLength={12}
                    editable={!busy}
                  />

                  <PrimaryButton
                    title="Send counteroffer"
                    loading={busy}
                    disabled={!canCounter}
                    onPress={() => {
                      void sendCounterOffer();
                    }}
                  />
                </>
              ) : null}

              {!isOnline ? (
                <AppText variant="small">
                  Go online before accepting new errands.
                </AppText>
              ) : null}
            </AppCard>
          ) : null}

          {isAssignedToMe && errand.status === "accepted" ? (
            <PrimaryButton
              title={isQueue ? "Start queue task" : "Start errand"}
              loading={busy}
              disabled={!onAction}
              onPress={() => {
                void runAction("start");
              }}
            />
          ) : null}

          {isAssignedToMe && errand.status === "in_progress" ? (
            <PrimaryButton
              title="Mark as delivered — request confirmation"
              loading={busy}
              disabled={!onAction}
              onPress={() => {
                void runAction("complete");
              }}
            />
          ) : null}

          {isAssignedToMe &&
          errand.status === "awaiting_customer_confirmation" ? (
            <AppCard>
              <AppText variant="heading">
                Waiting for customer confirmation
              </AppText>
              <AppText variant="secondary">
                You reported delivery. The errand will be completed after the customer confirms.
              </AppText>
            </AppCard>
          ) : null}

          {isAssignedToMe &&
          errand.status === "completion_disputed" ? (
            <AppCard>
              <AppText variant="heading">
                Customer reported a problem
              </AppText>
              <AppText variant="secondary">
                This errand needs follow-up and is not marked completed.
              </AppText>
            </AppCard>
          ) : null}

          {isAssignedToMe && errand.status === "completed" ? (
            <AppCard>
              <AppText variant="heading">Rate your customer</AppText>
              <AppText variant="secondary">
                Share feedback about your experience. Your review is optional.
              </AppText>

              {!errand.customerId ? (
                <AppText variant="error">
                  Customer information is unavailable for this errand.
                </AppText>
              ) : ratingSubmitted ? (
                <AppText>{ratingNotice}</AppText>
              ) : (
                <>
                  <AppText style={styles.label}>
                    Your rating (required)
                  </AppText>

                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Pressable
                        key={value}
                        accessibilityRole="button"
                        accessibilityLabel={`Rate customer ${ value } out of 5 stars`}
                        accessibilityState={{
                          selected: selectedRating === value,
                        }}
                        disabled={ratingBusy}
                        onPress={() => {
                          setSelectedRating(value);
                          setRatingError("");
                        }}
                        style={styles.starButton}
                      >
                        <Star
                          size={30}
                          color={
                            value <= selectedRating
                              ? "#E6A817"
                              : colors.border
                          }
                          fill={
                            value <= selectedRating
                              ? "#E6A817"
                              : "transparent"
                          }
                        />
                      </Pressable>
                    ))}
                  </View>

                  <AppText variant="small">
                    {selectedRating === 0
                      ? "Select 1 to 5 stars"
                      : `${ selectedRating } out of 5 stars`}
                  </AppText>

                  <AppTextInput
                    label="Review (optional)"
                    value={ratingReview}
                    onChangeText={(value) => {
                      setRatingReview(value.slice(0, 500));
                      setRatingError("");
                    }}
                    placeholder="Describe your experience with this customer"
                    multiline
                    maxLength={500}
                    editable={!ratingBusy}
                  />

                  <AppText variant="small">
                    {ratingReview.length}/500 characters
                  </AppText>

                  <PrimaryButton
                    title="Submit rating"
                    loading={ratingBusy}
                    disabled={
                      ratingBusy ||
                      selectedRating < 1 ||
                      !errand.customerId
                    }
                    onPress={() => {
                      void submitRating();
                    }}
                  />

                  {ratingError ? (
                    <AppText
                      variant="error"
                      accessibilityRole="alert"
                    >
                      {ratingError}
                    </AppText>
                  ) : null}

                  <AppText variant="small">
                    Ratings are intended to be submitted once per completed errand.
                  </AppText>
                </>
              )}
            </AppCard>
          ) : null}

          {notice ? (
            <AppText accessibilityLiveRegion="polite">
              {notice}
            </AppText>
          ) : null}

          {error ? (
            <AppText variant="error" accessibilityRole="alert">
              {error}
            </AppText>
          ) : null}

          {!onAction ? (
            <AppText variant="small">
              Acceptance and progress updates are not connected to the backend yet. Displayed progress comes from the supplied errand data.
            </AppText>
          ) : null}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.md,
    alignItems: "center",
  },
  content: {
    width: "100%",
    maxWidth: 560,
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  flex: {
    flex: 1,
    gap: spacing.xs,
  },
  backButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    alignSelf: "flex-start",
  },
  link: {
    color: colors.primary,
    fontWeight: "600",
  },
  heading: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },
  label: {
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  feeCard: {
    backgroundColor: colors.primaryLight,
  },
  feeRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  fee: {
    color: colors.primary,
    fontSize: typography.subtitle,
    fontWeight: "700",
    flexShrink: 0,
    fontVariant: ["tabular-nums"],
  },
  progressRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  progressTrack: {
    alignItems: "center",
    width: 30,
  },
  progressCircle: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeCircle: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepNumber: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  activeStepNumber: {
    color: colors.textOnPrimary,
  },
  progressLine: {
    flex: 1,
    width: 2,
    minHeight: 18,
    backgroundColor: colors.border,
  },
  activeLine: {
    backgroundColor: colors.primary,
  },
  progressText: {
    flex: 1,
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  outlineButton: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.sm,
  },
  disabled: {
    opacity: 0.45,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  starButton: {
    minWidth: 40,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
