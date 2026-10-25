import {
    ListTodo,
    MapPin,
    Minus,
    Package,
    Plus,
    Route,
    ShoppingBasket,
    Users,
} from "lucide-react-native";
import { useRef, useState, type ComponentRef } from "react";
import { useLocalSearchParams } from "expo-router";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { AppTextInput } from "@/components/AppTextInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenContainer } from "@/components/ScreenContainer";

import SteppaMap from "@/components/maps/SteppaMap";
import type { ConfirmedRoute } from "@/components/maps/types";

import {
    colors,
    commonStyles,
    dimensions,
    radius,
    spacing,
    typography,
} from "@/theme";

import DateTimeField from "./DateTimeField";

const categories = [
  "Groceries",
  "Parcel collection/Pickup",
  "Queue for me",
  "Other errands",
] as const;

const institutions = ["Bank", "Home Affairs", "Other"] as const;

const waitingOptions = ["60", "120", "180", "240"] as const;
const noticeOptions = ["15", "30", "45", "60"] as const;

// Prototype rates. Replace these with the team's approved policy.
const PRICING = {
  minimumOffer: 30,
  baseFee: 30,
  perKilometre: 5,
  queuePerHour: 30,
  adjustment: 5,
  version: "prototype-v1",
} as const;

type Category = (typeof categories)[number];
type Institution = (typeof institutions)[number];

type SharedDetails = {
  description: string;
  preferredAt: string;
  preferredUntil: string;
  route?: ConfirmedRoute;
};

type ErrandDetails =
  | (SharedDetails & {
      category: Exclude<Category, "Queue for me">;
      collectionAddress: string;
      destinationAddress: string;
    })
  | (SharedDetails & {
      category: "Queue for me";
      institution: Institution;
      queueLocation: string;
      serviceNeeded: string;
      maxWaitMinutes: number;
      notifyBeforeMinutes: number;
    });

export type CreateErrandInput = ErrandDetails & {
  recommendedFee: number;
  offeredFee: number;
  currency: "ZAR";
  pricingVersion: typeof PRICING.version;
};

type Props = {
  onSubmit?: (errand: CreateErrandInput) => Promise<void>;
  estimatedFee?: number;
};

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  multiline?: boolean;
  locationIcon?: boolean;
};

type FeeCardProps = {
  category: Category;
  recommendedFee: number | null;
  offeredFee: number | null;
  maxWaitMinutes?: number;
  externallyEstimated: boolean;
  editable: boolean;
  submitting: boolean;
  onChange: (value: number) => void;
};

function formatMoney(value: number) {
  return `R${value.toFixed(2)}`;
}

function roundFee(value: number) {
  return Math.max(
    PRICING.minimumOffer,
    Math.ceil(value / PRICING.adjustment) * PRICING.adjustment,
  );
}

function hasExternalEstimate(value: number | undefined): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= Number.MAX_SAFE_INTEGER - PRICING.adjustment
  );
}

function calculateQueueFee(minutes: number) {
  return roundFee(Math.ceil(minutes / 60) * PRICING.queuePerHour);
}

function calculateRecommendedFee(
  details: ErrandDetails,
  estimatedFee?: number,
): number | null {
  if (hasExternalEstimate(estimatedFee)) {
    return roundFee(estimatedFee);
  }

  if (details.category === "Queue for me") {
    return calculateQueueFee(details.maxWaitMinutes);
  }

  const meters = details.route?.distanceMeters;

  if (typeof meters !== "number" || !Number.isFinite(meters) || meters < 0) {
    return null;
  }

  return roundFee(PRICING.baseFee + (meters / 1000) * PRICING.perKilometre);
}

function validOffer(value: number | null): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= PRICING.minimumOffer &&
    value % PRICING.adjustment === 0
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
  multiline = false,
  locationIcon = false,
}: FieldProps) {
  return (
    <View style={styles.fieldSection}>
      <AppText style={styles.label}>{label}</AppText>

      <View style={styles.inputWrapper}>
        <AppTextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          error={error}
          multiline={multiline}
          maxLength={multiline ? 1000 : 200}
          style={[
            styles.input,
            multiline && styles.multilineInput,
            locationIcon && styles.locationInput,
          ]}
        />

        {locationIcon ? (
          <View pointerEvents="none" style={styles.locationIcon}>
            <MapPin size={18} color={colors.primary} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function getCategoryIcon(option: string) {
  switch (option) {
    case "Groceries":
      return ShoppingBasket;
    case "Parcel collection/Pickup":
      return Package;
    case "Queue for me":
      return Users;
    case "Other errands":
      return ListTodo;
    default:
      return null;
  }
}

function Choices<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.fieldSection}>
      <AppText style={styles.label}>{label}</AppText>

      <View style={styles.choices}>
        {options.map((option) => {
          const selected = option === value;
          const Icon = getCategoryIcon(option);

          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => onChange(option)}
              style={({ pressed }) => [
                styles.choice,
                selected && styles.selectedChoice,
                pressed && styles.pressed,
              ]}
            >
              {Icon ? (
                <Icon
                  size={16}
                  color={selected ? colors.primary : colors.textSecondary}
                />
              ) : null}

              <AppText
                style={[
                  styles.choiceText,
                  selected && styles.selectedChoiceText,
                ]}
              >
                {option}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function FeeCard({
  category,
  recommendedFee,
  offeredFee,
  maxWaitMinutes,
  externallyEstimated,
  editable,
  submitting,
  onChange,
}: FeeCardProps) {
  const canAdjust =
    editable &&
    !submitting &&
    recommendedFee !== null &&
    validOffer(offeredFee);

  const canDecrease =
    canAdjust && offeredFee !== null && offeredFee > PRICING.minimumOffer;

  const canIncrease =
    canAdjust &&
    offeredFee !== null &&
    offeredFee <= Number.MAX_SAFE_INTEGER - PRICING.adjustment;

  const difference =
    recommendedFee !== null && offeredFee !== null
      ? offeredFee - recommendedFee
      : 0;

  return (
    <AppCard style={styles.feeCard}>
      <View style={styles.feeHeader}>
        <AppText style={styles.feeLabel}>Recommended fee</AppText>

        <AppText style={styles.recommendedAmount}>
          {recommendedFee === null
            ? "Awaiting route"
            : formatMoney(recommendedFee)}
        </AppText>
      </View>

      <AppText variant="small">
        {externallyEstimated
          ? "Based on the supplied estimate, rounded up to R5 with a R30 minimum."
          : category === "Queue for me"
            ? `Prototype rate: R30 per booked hour, rounded up. Maximum waiting time: ${maxWaitMinutes ?? 60} minutes.`
            : "Prototype rate: R30 + R5 per route kilometre, rounded up to R5."}
      </AppText>

      {editable ? (
        <>
          <View style={styles.feeDivider} />

          <AppText style={styles.label}>Your offer</AppText>

          <View style={styles.offerRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decrease offer by 5 rand"
              accessibilityState={{ disabled: !canDecrease }}
              disabled={!canDecrease}
              onPress={() => {
                if (canDecrease && offeredFee !== null) {
                  onChange(offeredFee - PRICING.adjustment);
                }
              }}
              style={({ pressed }) => [
                styles.adjustButton,
                !canDecrease && styles.disabledControl,
                pressed && canDecrease && styles.pressed,
              ]}
            >
              <Minus size={22} color={colors.primary} />
            </Pressable>

            <View style={styles.offerValue}>
              <AppText
                style={styles.offerAmount}
                accessibilityLiveRegion="polite"
                accessibilityLabel={
                  offeredFee === null
                    ? "Offer not available yet"
                    : `Your offer: ${offeredFee} rand`
                }
              >
                {offeredFee === null ? "—" : formatMoney(offeredFee)}
              </AppText>

              <AppText variant="small">Runner fee</AppText>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase offer by 5 rand"
              accessibilityState={{ disabled: !canIncrease }}
              disabled={!canIncrease}
              onPress={() => {
                if (canIncrease && offeredFee !== null) {
                  onChange(offeredFee + PRICING.adjustment);
                }
              }}
              style={({ pressed }) => [
                styles.adjustButton,
                !canIncrease && styles.disabledControl,
                pressed && canIncrease && styles.pressed,
              ]}
            >
              <Plus size={22} color={colors.primary} />
            </Pressable>
          </View>

          {offeredFee !== null && recommendedFee !== null ? (
            <AppText variant="small" style={styles.centerText}>
              {difference === 0
                ? "Your offer matches the recommendation."
                : difference > 0
                  ? `${formatMoney(difference)} above the recommendation.`
                  : `${formatMoney(Math.abs(difference))} below the recommendation.`}
            </AppText>
          ) : null}

          <AppText variant="small" style={styles.centerText}>
            Adjust in R5 steps. Minimum offer: R30.
          </AppText>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Use the recommended fee"
            disabled={!canAdjust || difference === 0}
            onPress={() => {
              if (canAdjust && recommendedFee !== null) {
                onChange(recommendedFee);
              }
            }}
            style={({ pressed }) => [
              styles.resetButton,
              (!canAdjust || difference === 0) && styles.disabledControl,
              pressed && styles.pressed,
            ]}
          >
            <AppText style={styles.outlineButtonText}>
              Use recommended fee
            </AppText>
          </Pressable>

          {!editable || offeredFee === null ? (
            <AppText variant="small">
              Confirm your locations to set an offer.
            </AppText>
          ) : null}
        </>
      ) : (
        <AppText variant="small">
          Confirm your locations on the next screen to adjust your offer.
        </AppText>
      )}

      <AppText variant="small">
        This is the runner’s service fee. Purchases, parcel charges and
        institution charges are separate. An offer is not an accepted price
        until a Steppa agrees.
      </AppText>
    </AppCard>
  );
}

function parseTimeForDay(time: string, day: Date): Date | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time.trim());

  if (!match) {
    return null;
  }

  const result = new Date(day);
  result.setHours(Number(match[1]), Number(match[2]), 0, 0);

  return result;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function CreateErrandForm({ onSubmit, estimatedFee }: Props) {
  const routeParams = useLocalSearchParams<{ category?: string }>();
  const [category, setCategory] = useState<Category>(
    routeParams.category === "queue" ? "Queue for me" : "Groceries",
  );
  const [institution, setInstitution] = useState<Institution>("Bank");

  const [description, setDescription] = useState("");
  const [collection, setCollection] = useState("");
  const [destination, setDestination] = useState("");
  const [queueLocation, setQueueLocation] = useState("");
  const [service, setService] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeUntil, setTimeUntil] = useState("");
  const [wait, setWait] = useState("120");
  const [notice, setNotice] = useState("30");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [review, setReview] = useState<ErrandDetails | null>(null);
  const [offeredFee, setOfferedFee] = useState<number | null>(null);
  const [locationsConfirmed, setLocationsConfirmed] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const submittingRef = useRef(false);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const isQueue = category === "Queue for me";
  const externallyEstimated = hasExternalEstimate(estimatedFee);

  const recommendedFee = review
    ? calculateRecommendedFee(review, estimatedFee)
    : null;

  const previewFee = externallyEstimated
    ? roundFee(estimatedFee)
    : isQueue
      ? calculateQueueFee(Number(wait))
      : null;

  function scrollToTop() {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function clearFieldError(field: string) {
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function clearTimeErrors() {
    setErrors((current) => {
      const next = { ...current };
      delete next.timeFrom;
      delete next.timeUntil;
      return next;
    });
  }

  function buildRequest(): ErrandDetails | null {
    const nextErrors: Record<string, string> = {};
    const now = new Date();
    const start = parseTimeForDay(timeFrom, now);
    const end = parseTimeForDay(timeUntil, now);

    if (!description.trim()) {
      nextErrors.description = "Please describe what you need.";
    }

    if (!start) {
      nextErrors.timeFrom = "Select a start time.";
    } else if (start.getTime() <= now.getTime()) {
      nextErrors.timeFrom = "Choose a later start time today.";
    }

    if (!end) {
      nextErrors.timeUntil = "Select an end time.";
    } else if (start && end.getTime() <= start.getTime()) {
      nextErrors.timeUntil = "End time must be after the start time.";
    }

    if (isQueue) {
      if (!queueLocation.trim()) {
        nextErrors.queueLocation =
          "Enter the institution or place name and full address.";
      }

      if (!service.trim()) {
        nextErrors.service = "Describe the service you need.";
      }

      if (
        !waitingOptions.some((option) => option === wait) ||
        !noticeOptions.some((option) => option === notice)
      ) {
        nextErrors.queueOptions = "Select valid waiting and notice times.";
      }
    } else {
      if (!collection.trim()) {
        nextErrors.collection = "Enter the collection address.";
      }

      if (!destination.trim()) {
        nextErrors.destination = "Enter the delivery address.";
      }
    }

    setErrors(nextErrors);
    setSubmitError("");

    if (Object.keys(nextErrors).length > 0 || !start || !end) {
      scrollToTop();
      return null;
    }

    const shared: SharedDetails = {
      description: description.trim(),
      preferredAt: start.toISOString(),
      preferredUntil: end.toISOString(),
    };

    if (category === "Queue for me") {
      return {
        ...shared,
        category,
        institution,
        queueLocation: queueLocation.trim(),
        serviceNeeded: service.trim(),
        maxWaitMinutes: Number(wait),
        notifyBeforeMinutes: Number(notice),
      };
    }

    return {
      ...shared,
      category,
      collectionAddress: collection.trim(),
      destinationAddress: destination.trim(),
    };
  }

  function openMapReview() {
    const request = buildRequest();

    if (!request) {
      return;
    }

    setOfferedFee(null);
    setLocationsConfirmed(false);
    setReview(request);
    scrollToTop();
  }

  function confirmLocations(route: ConfirmedRoute) {
    if (!review) {
      return;
    }

    let confirmedDetails: ErrandDetails;

    if (review.category === "Queue for me") {
      confirmedDetails = {
        ...review,
        queueLocation: route.collection.label,
        route,
      };

      setQueueLocation(route.collection.label);
    } else {
      if (!route.destination) {
        setSubmitError("Select a delivery location.");
        return;
      }

      confirmedDetails = {
        ...review,
        collectionAddress: route.collection.label,
        destinationAddress: route.destination.label,
        route,
      };

      setCollection(route.collection.label);
      setDestination(route.destination.label);
    }

    setReview(confirmedDetails);
    setOfferedFee(calculateRecommendedFee(confirmedDetails, estimatedFee));
    setLocationsConfirmed(true);
    setSubmitError("");
  }

  async function submitRequest() {
    if (!review || !locationsConfirmed || !onSubmit || submittingRef.current) {
      return;
    }

    if (
      recommendedFee === null ||
      !Number.isFinite(recommendedFee) ||
      !validOffer(offeredFee)
    ) {
      setSubmitError(
        "Confirm a valid route and choose an offer of at least R30.",
      );
      return;
    }

    if (new Date(review.preferredAt).getTime() <= Date.now()) {
      setSubmitError(
        "The start time has passed. Edit your details and choose a later range.",
      );
      return;
    }

    const request: CreateErrandInput = {
      ...review,
      recommendedFee,
      offeredFee,
      currency: "ZAR",
      pricingVersion: PRICING.version,
    };

    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError("");

    try {
      await onSubmit(request);
      setSubmitted(true);
      scrollToTop();
    } catch {
      setSubmitError(
        "We could not confirm submission. Check My errands before retrying.",
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const canSubmit =
    Boolean(onSubmit) &&
    locationsConfirmed &&
    recommendedFee !== null &&
    validOffer(offeredFee);

  return (
    <ScreenContainer padded={false}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        enabled={Platform.OS !== "web"}
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            commonStyles.screenContent,
            styles.screenContent,
          ]}
        >
          <View style={styles.formContainer}>
            {submitted ? (
              <AppCard>
                <AppText variant="heading">Request submitted</AppText>

                <AppText>
                  Your errand request has been created successfully.
                </AppText>

                {offeredFee !== null ? (
                  <AppText style={styles.label}>
                    Your offer: {formatMoney(offeredFee)}
                  </AppText>
                ) : null}
              </AppCard>
            ) : review ? (
              <>
                <AppText variant="heading">Review locations</AppText>

                <SteppaMap
                  category={review.category}
                  queueOnly={review.category === "Queue for me"}
                  initialCollection={
                    review.category === "Queue for me"
                      ? review.queueLocation
                      : review.collectionAddress
                  }
                  initialDestination={
                    review.category === "Queue for me"
                      ? ""
                      : review.destinationAddress
                  }
                  onConfirm={confirmLocations}
                />

                <AppCard>
                  <AppText style={styles.label}>Task description</AppText>

                  <AppText>{review.description}</AppText>

                  <AppText style={styles.label}>Preferred time</AppText>

                  <AppText>
                    Today, {formatTime(review.preferredAt)}–
                    {formatTime(review.preferredUntil)}
                  </AppText>

                  {review.category === "Queue for me" ? (
                    <>
                      <AppText style={styles.label}>Service needed</AppText>

                      <AppText>{review.serviceNeeded}</AppText>

                      <AppText variant="secondary">
                        Maximum waiting time: {review.maxWaitMinutes} minutes
                      </AppText>

                      <AppText variant="secondary">
                        Requested advance notice: {review.notifyBeforeMinutes}{" "}
                        minutes
                      </AppText>
                    </>
                  ) : null}
                </AppCard>

                <FeeCard
                  category={review.category}
                  recommendedFee={recommendedFee}
                  offeredFee={offeredFee}
                  maxWaitMinutes={
                    review.category === "Queue for me"
                      ? review.maxWaitMinutes
                      : undefined
                  }
                  externallyEstimated={externallyEstimated}
                  editable
                  submitting={submitting || !locationsConfirmed}
                  onChange={(value) => {
                    if (validOffer(value)) {
                      setOfferedFee(value);
                      setSubmitError("");
                    }
                  }}
                />

                {submitError ? (
                  <AppText variant="error" accessibilityRole="alert">
                    {submitError}
                  </AppText>
                ) : null}

                <PrimaryButton
                  title={
                    validOffer(offeredFee)
                      ? `Submit offer · ${formatMoney(offeredFee)}`
                      : "Submit request"
                  }
                  loading={submitting}
                  disabled={!canSubmit}
                  onPress={submitRequest}
                />

                <Pressable
                  accessibilityRole="button"
                  disabled={submitting}
                  onPress={() => {
                    setReview(null);
                    setOfferedFee(null);
                    setLocationsConfirmed(false);
                    setSubmitError("");
                    scrollToTop();
                  }}
                  style={({ pressed }) => [
                    styles.outlineButton,
                    submitting && styles.disabledControl,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText style={styles.outlineButtonText}>
                    Edit details
                  </AppText>
                </Pressable>

                {!onSubmit ? (
                  <AppText variant="small">
                    Preview only. Submission, Steppa acceptance and
                    counteroffers are not connected yet.
                  </AppText>
                ) : null}
              </>
            ) : (
              <>
                <View style={styles.fieldSection}>
                  <AppText variant="heading">Tell us what you need</AppText>

                  <AppText variant="secondary">
                    A few details will help a nearby Steppa understand your
                    task.
                  </AppText>
                </View>

                {Object.keys(errors).length > 0 ? (
                  <AppText variant="error" accessibilityRole="alert">
                    Please correct the highlighted fields below.
                  </AppText>
                ) : null}

                <Choices
                  label="Category"
                  options={categories}
                  value={category}
                  onChange={(value) => {
                    setCategory(value);
                    setErrors({});
                  }}
                />

                {isQueue ? (
                  <>
                    <Choices
                      label="Institution"
                      options={institutions}
                      value={institution}
                      onChange={setInstitution}
                    />

                    <Field
                      label={
                        institution === "Other"
                          ? "Institution or place name and address"
                          : "Institution and branch address"
                      }
                      value={queueLocation}
                      onChange={(value) => {
                        setQueueLocation(value);
                        clearFieldError("queueLocation");
                      }}
                      placeholder="Enter the place name and full address"
                      error={errors.queueLocation}
                      locationIcon
                    />

                    <Field
                      label="Service needed"
                      value={service}
                      onChange={(value) => {
                        setService(value);
                        clearFieldError("service");
                      }}
                      placeholder="Describe what you need us to queue for"
                      error={errors.service}
                    />
                  </>
                ) : null}

                <Field
                  label={isQueue ? "Queue instructions" : "Task description"}
                  value={description}
                  onChange={(value) => {
                    setDescription(value);
                    clearFieldError("description");
                  }}
                  placeholder={
                    isQueue
                      ? "Explain where to queue and any special instructions"
                      : category === "Other errands"
                        ? "Describe what you need done"
                        : category === "Parcel collection/Pickup"
                          ? "Describe the parcel and pickup instructions"
                          : "List your groceries, quantities and preferred shop"
                  }
                  error={errors.description}
                  multiline
                />

                {!isQueue ? (
                  <>
                    <Field
                      label="Collection address"
                      value={collection}
                      onChange={(value) => {
                        setCollection(value);
                        clearFieldError("collection");
                      }}
                      placeholder="Shop or collection point and full address"
                      error={errors.collection}
                      locationIcon
                    />

                    <Field
                      label="Destination"
                      value={destination}
                      onChange={(value) => {
                        setDestination(value);
                        clearFieldError("destination");
                      }}
                      placeholder="Enter the delivery address"
                      error={errors.destination}
                      locationIcon
                    />
                  </>
                ) : null}

                {isQueue ? (
                  <>
                    <Choices
                      label="Maximum waiting time (minutes)"
                      options={waitingOptions}
                      value={wait}
                      onChange={(value) => {
                        setWait(value);
                        clearFieldError("queueOptions");
                      }}
                    />

                    <Choices
                      label="Requested advance notice (minutes)"
                      options={noticeOptions}
                      value={notice}
                      onChange={(value) => {
                        setNotice(value);
                        clearFieldError("queueOptions");
                      }}
                    />

                    {errors.queueOptions ? (
                      <AppText variant="error">{errors.queueOptions}</AppText>
                    ) : null}

                    <AppCard>
                      <AppText variant="secondary">
                        Queue holding depends on the institution’s rules. You
                        must attend personally when required. A Steppa cannot
                        replace a required appointment.
                      </AppText>
                    </AppCard>
                  </>
                ) : null}

                <View style={styles.fieldSection}>
                  <AppText style={styles.label}>Preferred time</AppText>

                  <View style={styles.timeRangeRow}>
                    <View style={styles.timeRangeField}>
                      <DateTimeField
                        label="From"
                        mode="time"
                        value={timeFrom}
                        onChange={(value) => {
                          setTimeFrom(value);
                          clearTimeErrors();
                        }}
                        error={errors.timeFrom}
                      />
                    </View>

                    <View style={styles.timeRangeField}>
                      <DateTimeField
                        label="Until"
                        mode="time"
                        value={timeUntil}
                        onChange={(value) => {
                          setTimeUntil(value);
                          clearTimeErrors();
                        }}
                        error={errors.timeUntil}
                      />
                    </View>
                  </View>

                  <AppText variant="small">
                    {timeFrom && timeUntil
                      ? `Today, ${timeFrom}–${timeUntil}`
                      : "Choose your preferred time range for today."}
                  </AppText>
                </View>

                <FeeCard
                  category={category}
                  recommendedFee={previewFee}
                  offeredFee={null}
                  maxWaitMinutes={isQueue ? Number(wait) : undefined}
                  externallyEstimated={externallyEstimated}
                  editable={false}
                  submitting={false}
                  onChange={() => {}}
                />

                <Pressable
                  accessibilityRole="button"
                  onPress={openMapReview}
                  style={({ pressed }) => [
                    styles.outlineButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Route size={18} color={colors.primary} />

                  <AppText style={styles.outlineButtonText}>
                    Review route & locations
                  </AppText>
                </Pressable>

                <AppText variant="small">
                  Confirm your locations, then adjust your offer before
                  submitting.
                </AppText>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screenContent: {
    alignItems: "center",
  },
  formContainer: {
    width: "100%",
    maxWidth: 520,
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  fieldSection: {
    gap: spacing.xs,
  },
  label: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "600",
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    minHeight: dimensions.inputHeight,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  multilineInput: {
    minHeight: dimensions.inputHeight * 2,
    textAlignVertical: "top",
  },
  locationInput: {
    paddingLeft: 40,
  },
  locationIcon: {
    position: "absolute",
    left: 12,
    top: dimensions.inputHeight / 2 - 9,
  },
  choices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  choice: {
    minHeight: dimensions.iconButtonSize,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: dimensions.borderWidth,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  selectedChoice: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  choiceText: {
    color: colors.textSecondary,
    fontSize: typography.small,
  },
  selectedChoiceText: {
    color: colors.primary,
    fontWeight: "600",
  },
  timeRangeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  timeRangeField: {
    flex: 1,
    minWidth: 150,
  },
  feeCard: {
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
  },
  feeHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  feeLabel: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: "600",
  },
  recommendedAmount: {
    color: colors.primary,
    fontSize: typography.subtitle,
    fontWeight: "700",
  },
  feeDivider: {
    height: dimensions.borderWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  offerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  adjustButton: {
    width: Math.max(48, dimensions.iconButtonSize),
    height: Math.max(48, dimensions.iconButtonSize),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: dimensions.borderWidth,
    borderColor: colors.primary,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  offerValue: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
  },
  offerAmount: {
    color: colors.primary,
    fontSize: typography.title,
    fontWeight: "700",
  },
  centerText: {
    textAlign: "center",
  },
  resetButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.sm,
  },
  outlineButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: dimensions.borderWidth,
    borderColor: colors.primary,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  outlineButtonText: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: "600",
  },
  disabledControl: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.8,
  },
});
