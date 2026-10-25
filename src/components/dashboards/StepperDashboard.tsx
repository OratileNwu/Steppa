
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View
} from "react-native";

import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { AppTextInput } from "@/components/AppTextInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { StatusBadge } from "@/components/StatusBadge";

import {
  colors,
  dimensions,
  radius,
  spacing,
  statusStyles,
  typography,
} from "@/theme";

type CategoryId = "groceries" | "parcel" | "queue" | "other";
type ErrandStatus = keyof typeof statusStyles;

export type StepperErrand = {
  id: string;
  category: CategoryId;
  title: string;
  description?: string;
  status: ErrandStatus;
  estimatedFee?: number;
};

export type QueueRequest = {
  category: "queue";
  location: string;
  purpose: string;
  instructions: string;
};

export type StepperNotification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
};

type Props = {
  userName?: string | null;
  location?: string | null;
  walletBalance?: number | null;
  activeErrand?: StepperErrand | null;
  notifications?: StepperNotification[];
  loading?: boolean;

  onSaveLocation?: (value: string) => Promise<void> | void;
  onSubmitQueue?: (request: QueueRequest) => Promise<void> | void;
  onRequestErrand?: (category: CategoryId) => void;
  onOpenErrand?: (id: string) => void;
  onViewAllErrands?: () => void;
  onOpenWallet?: () => void;
  onOpenProfile?: () => void;
  onOpenNotification?: (id: string) => void;
  onOpenHelp?: () => void;
};

const categories = [
  {
    id: "groceries",
    label: "Groceries",
    icon: "basket-outline",
  },
  {
    id: "parcel",
    label: "Parcels",
    icon: "cube-outline",
  },
  {
    id: "queue",
    label: "Queue",
    icon: "people-outline",
  },
  {
    id: "other",
    label: "Other",
    icon: "ellipsis-horizontal",
  },
] as const;

const progressSteps = [
  "requested",
  "accepted",
  "in_progress",
  "completed",
] as const;

function RequestButton({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const [hovered, setHovered] = useState(false);

  function animate(toValue: number) {
    Animated.spring(scale, {
      toValue,
      friction: 7,
      tension: 130,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={onPress}
        onHoverIn={() => {
          setHovered(true);
          animate(1.01);
        }}
        onHoverOut={() => {
          setHovered(false);
          animate(1);
        }}
        onPressIn={() => animate(0.97)}
        onPressOut={() => animate(1)}
        style={[
          styles.requestButton,
          hovered && styles.requestButtonHover,
        ]}
      >
        <Ionicons
          name="add-circle-outline"
          size={21}
          color={colors.primary}
        />

        <AppText style={styles.requestButtonText}>
          {title}
        </AppText>

        <Ionicons
          name="arrow-forward"
          size={19}
          color={colors.primary}
        />
      </Pressable>
    </Animated.View>
  );
}

export default function StepperDashboard({
  userName,
  location,
  walletBalance,
  activeErrand,
  notifications = [],
  loading = false,
  onSaveLocation,
  onSubmitQueue,
  onRequestErrand,
  onOpenErrand,
  onViewAllErrands,
  onOpenWallet,
  onOpenProfile,
  onOpenNotification,
  onOpenHelp,
}: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CategoryId | null>(null);
  const [hoveredCategory, setHoveredCategory] =
    useState<CategoryId | null>(null);
  const [hoveredCard, setHoveredCard] = useState("");
  const [notice, setNotice] = useState("");

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [locationOpen, setLocationOpen] = useState(false);
  const [locationDraft, setLocationDraft] = useState("");
  const [localLocation, setLocalLocation] =
    useState<string | null>(null);
  const [savingLocation, setSavingLocation] = useState(false);

  const [queueOpen, setQueueOpen] = useState(false);
  const [queueLocation, setQueueLocation] = useState("");
  const [queuePurpose, setQueuePurpose] = useState("");
  const [queueInstructions, setQueueInstructions] =
    useState("");
  const [queueSubmitting, setQueueSubmitting] =
    useState(false);

  const firstName = userName?.trim().split(/\s+/)[0];
  const currentLocation = localLocation || location;

  const unreadCount = notifications.filter(
    (item) => !item.read
  ).length;

  const matchingCategories = categories.filter((item) =>
    item.label
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  function unavailable(feature: string) {
    setNotice(`${feature} is not connected yet.`);
  }

  function requestErrand() {
    setNotice("");

    if (!selected) {
      setNotice("Please select an errand category first.");
      return;
    }

    if (onRequestErrand) {
      // Queue requests use the same validated errand creation flow,
      // with the Queue category preselected.
      onRequestErrand(selected);
    } else {
      unavailable("Create Errand");
    }
  }

  async function saveLocation() {
    if (savingLocation) return;

    const value = locationDraft.trim();

    if (!value) {
      setNotice("Please enter your location.");
      return;
    }

    if (!onSaveLocation) {
      setLocalLocation(value);
      setLocationOpen(false);
      setNotice(
        "Location updated for this preview only. It has not been saved."
      );
      return;
    }

    setSavingLocation(true);
    setNotice("");

    try {
      await onSaveLocation(value);
      setLocalLocation(value);
      setLocationOpen(false);
      setNotice("Location updated.");
    } catch {
      setNotice(
        "Unable to save location. Please try again."
      );
    } finally {
      setSavingLocation(false);
    }
  }

  async function submitQueue() {
    if (queueSubmitting) return;

    const place = queueLocation.trim();
    const purpose = queuePurpose.trim();

    if (!place || !purpose) {
      setNotice(
        "Queue location and purpose are required."
      );
      return;
    }

    if (!onSubmitQueue) {
      setNotice(
        "Queue details are valid, but submission is not connected. No request has been saved."
      );
      return;
    }

    setQueueSubmitting(true);
    setNotice("");

    try {
      await onSubmitQueue({
        category: "queue",
        location: place,
        purpose,
        instructions: queueInstructions.trim(),
      });

      setQueueOpen(false);
      setQueueLocation("");
      setQueuePurpose("");
      setQueueInstructions("");
      setNotice("Queue request submitted.");
    } catch {
      setNotice(
        "Queue submission failed. Please try again."
      );
    } finally {
      setQueueSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.flex}>
            <AppText style={styles.brand}>
              YOUR NEIGHBOURHOOD. ON THE MOVE.
            </AppText>

            <AppText style={styles.heading}>
              {firstName
                ? `Welcome back, ${firstName}.`
                : "Welcome to STEPPA."}
            </AppText>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select location"
              style={styles.locationRow}
              onPress={() => {
                setLocationDraft(currentLocation || "");
                setLocationOpen(!locationOpen);
                setNotificationsOpen(false);
              }}
            >
              <Ionicons
                name="location-outline"
                size={17}
                color={colors.primary}
              />

              <AppText style={styles.locationText}>
                {currentLocation || "Set your location"}
              </AppText>

              <Ionicons
                name="chevron-down"
                size={14}
                color={colors.primary}
              />
            </Pressable>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              style={styles.circleButton}
              onPress={() => {
                setNotificationsOpen(!notificationsOpen);
                setLocationOpen(false);
              }}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={colors.primary}
              />

              {unreadCount > 0 && (
                <View style={styles.notificationDot} />
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Profile"
              style={styles.circleButton}
              onPress={() =>
                onOpenProfile
                  ? onOpenProfile()
                  : unavailable("Profile")
              }
            >
              <Ionicons
                name="person-outline"
                size={22}
                color={colors.primary}
              />
            </Pressable>
          </View>
        </View>

        {/* LOCATION PICKER */}
        {locationOpen && (
          <AppCard style={styles.panel}>
            <AppText variant="heading" style={styles.sectionTitle}>
              Choose your location
            </AppText>

            <AppText variant="secondary">
              Enter your neighbourhood or address.
            </AppText>

            <AppTextInput
              label="Your location"
              value={locationDraft}
              onChangeText={setLocationDraft}
              placeholder="Enter a location"
            />

            <PrimaryButton
              title="Use this location"
              loading={savingLocation}
              onPress={saveLocation}
            />

            <AppText variant="small">
              This is a manually entered location,
              not a verified map pin.
            </AppText>
          </AppCard>
        )}

        {/* NOTIFICATIONS */}
        {notificationsOpen && (
          <AppCard style={styles.panel}>
            <View style={styles.sectionHeader}>
              <AppText
                variant="heading"
                style={styles.sectionTitle}
              >
                Notifications
              </AppText>

              <Pressable
                accessibilityLabel="Close notifications"
                onPress={() => setNotificationsOpen(false)}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>

            {loading ? (
              <AppText variant="secondary">
                Loading notifications...
              </AppText>
            ) : notifications.length === 0 ? (
              <View style={styles.emptyContent}>
                <Ionicons
                  name="notifications-off-outline"
                  size={30}
                  color={colors.primary}
                />

                <AppText style={styles.emptyTitle}>
                  No notifications to display
                </AppText>

                <AppText
                  variant="secondary"
                  style={styles.centerText}
                >
                  Updates will appear here when connected.
                </AppText>
              </View>
            ) : (
              notifications.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.notificationItem}
                  onPress={() =>
                    onOpenNotification
                      ? onOpenNotification(item.id)
                      : unavailable(
                          "Notification details"
                        )
                  }
                >
                  <Ionicons
                    name={
                      item.read
                        ? "mail-open-outline"
                        : "mail-unread-outline"
                    }
                    size={22}
                    color={colors.primary}
                  />

                  <View style={styles.flex}>
                    <AppText style={styles.itemTitle}>
                      {item.title}
                    </AppText>

                    <AppText variant="secondary">
                      {item.message}
                    </AppText>
                  </View>

                  {!item.read && (
                    <View style={styles.unreadDot} />
                  )}
                </Pressable>
              ))
            )}
          </AppCard>
        )}

        {/* SEARCH */}
        <View style={styles.searchBar}>
          <Ionicons
            name="search-outline"
            size={21}
            color={colors.textSecondary}
          />

          <AppTextInput
            value={search}
            onChangeText={setSearch}
            placeholder="What do you need help with?"
            style={styles.searchInput}
          />

          {search.length > 0 && (
            <Pressable
              accessibilityLabel="Clear search"
              onPress={() => setSearch("")}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>
          )}
        </View>

        {/* CATEGORIES */}
        <View style={styles.section}>
          <AppText
            variant="heading"
            style={styles.sectionTitle}
          >
            What can we help with?
          </AppText>

          <View style={styles.categoryRow}>
            {matchingCategories.map((category) => {
              const active = selected === category.id;
              const hovered =
                hoveredCategory === category.id;

              return (
                <Pressable
                  key={category.id}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: active,
                  }}
                  style={styles.category}
                  onPress={() => {
                    setSelected(
                      active ? null : category.id
                    );
                    setQueueOpen(false);
                    setNotice("");
                  }}
                  onHoverIn={() =>
                    setHoveredCategory(category.id)
                  }
                  onHoverOut={() =>
                    setHoveredCategory(null)
                  }
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      active &&
                        styles.categoryActive,
                      hovered &&
                        styles.categoryHover,
                    ]}
                  >
                    <Ionicons
                      name={category.icon}
                      size={24}
                      color={colors.primary}
                    />
                  </View>

                  <AppText
                    style={[
                      styles.categoryLabel,
                      active &&
                        styles.categoryLabelActive,
                    ]}
                  >
                    {category.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          {matchingCategories.length === 0 && (
            <AppText variant="secondary">
              No matching categories found.
            </AppText>
          )}
        </View>

        {/* REQUEST ERRAND */}
        <View style={styles.featureCard}>
          <View style={styles.featureTop}>
            <View style={styles.flex}>
              <AppText style={styles.featureTitle}>
                Need a hand today?
              </AppText>

              <AppText style={styles.featureSubtitle}>
                Get help with everyday tasks from
                people in your neighbourhood.
              </AppText>
            </View>

            <View style={styles.peopleBadge}>
              <Ionicons
                name="people-outline"
                size={28}
                color={colors.textOnPrimary}
              />
            </View>
          </View>

          <RequestButton
            title={
              selected === "queue"
                ? "Request queue assistance"
                : "Request an errand"
            }
            onPress={requestErrand}
          />

          {selected && (
            <AppText style={styles.selectedHint}>
              {
                categories.find(
                  (item) => item.id === selected
                )?.label
              }{" "}
              selected
            </AppText>
          )}
        </View>

        {/* QUEUE FORM */}
        {queueOpen && (
          <AppCard style={styles.panel}>
            <View style={styles.sectionHeader}>
              <AppText
                variant="heading"
                style={styles.sectionTitle}
              >
                Queue for me
              </AppText>

              <Pressable
                accessibilityLabel="Close queue form"
                onPress={() => setQueueOpen(false)}
              >
                <Ionicons
                  name="close"
                  size={21}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>

            <AppText variant="secondary">
              Queue assistance depends on the
              organisation's rules. A place in line
              may not be transferable.
            </AppText>

            <AppTextInput
              label="Queue location *"
              value={queueLocation}
              onChangeText={setQueueLocation}
              placeholder="Where is the queue?"
            />

            <AppTextInput
              label="Purpose *"
              value={queuePurpose}
              onChangeText={setQueuePurpose}
              placeholder="What should the runner queue for?"
            />

            <AppTextInput
              label="Additional instructions"
              value={queueInstructions}
              onChangeText={setQueueInstructions}
              placeholder="No passwords or PINs"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={styles.multiline}
            />

            <PrimaryButton
              title="Continue queue request"
              loading={queueSubmitting}
              onPress={submitQueue}
            />
          </AppCard>
        )}

        {/* SIMULATED WALLET */}
        <Pressable
          accessibilityRole="button"
          style={[
            styles.interactiveCard,
            hoveredCard === "wallet" &&
              styles.hoverCard,
          ]}
          onHoverIn={() => setHoveredCard("wallet")}
          onHoverOut={() => setHoveredCard("")}
          onPress={() =>
            onOpenWallet
              ? onOpenWallet()
              : unavailable("Wallet")
          }
        >
          <View style={styles.walletIcon}>
            <Ionicons
              name="wallet-outline"
              size={24}
              color={colors.primary}
            />
          </View>

          <View style={styles.flex}>
            <AppText style={styles.walletLabel}>
              SIMULATED WALLET
            </AppText>

            <AppText style={styles.walletBalance}>
              {loading
                ? "Loading..."
                : walletBalance == null
                ? "Not available"
                : `R${walletBalance.toFixed(2)}`}
            </AppText>

            <AppText variant="small">
              No real funds
            </AppText>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.primary}
          />
        </Pressable>

        {/* ACTIVE ERRAND HEADER */}
        <View style={styles.sectionHeader}>
          <AppText
            variant="heading"
            style={styles.sectionTitle}
          >
            Your active errand
          </AppText>

          <Pressable
            onPress={() =>
              onViewAllErrands
                ? onViewAllErrands()
                : unavailable("My Errands")
            }
          >
            <AppText style={styles.link}>
              View all
            </AppText>
          </Pressable>
        </View>

        {/* ACTIVE ERRAND CONTENT */}
        {loading ? (
          <AppCard>
            <AppText variant="secondary">
              Loading your errands...
            </AppText>
          </AppCard>
        ) : activeErrand ? (
          <Pressable
            accessibilityRole="button"
            style={[
              styles.errandCard,
              hoveredCard === "errand" &&
                styles.hoverCard,
            ]}
            onHoverIn={() => setHoveredCard("errand")}
            onHoverOut={() => setHoveredCard("")}
            onPress={() =>
              onOpenErrand
                ? onOpenErrand(activeErrand.id)
                : unavailable("Errand details")
            }
          >
            <View style={styles.errandHeader}>
              <View style={styles.flex}>
                <AppText style={styles.itemTitle}>
                  {activeErrand.title}
                </AppText>

                {!!activeErrand.description && (
                  <AppText variant="secondary">
                    {activeErrand.description}
                  </AppText>
                )}
              </View>

              <StatusBadge
                status={activeErrand.status}
              />
            </View>

            {/* PROGRESS TRACKER */}
            <View style={styles.tracker}>
              {progressSteps.map((step, index) => {
                const currentIndex =
                  progressSteps.indexOf(
                    activeErrand.status as
                      (typeof progressSteps)[number]
                  );

                const reached =
                  activeErrand.status !== "cancelled" &&
                  index <= currentIndex;

                return (
                  <View
                    key={step}
                    style={styles.trackerItem}
                  >
                    <View
                      style={[
                        styles.trackerDot,
                        reached &&
                          styles.trackerDotActive,
                      ]}
                    />

                    <AppText
                      style={[
                        styles.trackerLabel,
                        reached &&
                          styles.trackerLabelActive,
                      ]}
                    >
                      {statusStyles[step].label}
                    </AppText>
                  </View>
                );
              })}
            </View>

            <View style={styles.divider} />

            <View style={styles.sectionHeader}>
              <AppText variant="secondary">
                Estimated service fee
              </AppText>

              <AppText style={styles.price}>
                {activeErrand.estimatedFee == null
                  ? "Pending"
                  : `R${activeErrand.estimatedFee.toFixed(2)}`}
              </AppText>
            </View>
          </Pressable>
        ) : (
          <AppCard style={styles.emptyCard}>
            <Ionicons
              name="clipboard-outline"
              size={30}
              color={colors.primary}
            />

            <AppText style={styles.emptyTitle}>
              No active errands
            </AppText>

            <AppText
              variant="secondary"
              style={styles.centerText}
            >
              Your requests will appear here
              when connected.
            </AppText>
          </AppCard>
        )}

        {/* HELP */}
        <View style={styles.helpCard}>
          <Ionicons
            name="help-circle-outline"
            size={22}
            color={colors.primary}
          />

          <View style={styles.flex}>
            <AppText style={styles.itemTitle}>
              Need assistance?
            </AppText>

            <AppText variant="secondary">
              Support and issue reporting
            </AppText>
          </View>

          <Pressable
            onPress={() =>
              onOpenHelp
                ? onOpenHelp()
                : unavailable("Help centre")
            }
          >
            <AppText style={styles.link}>
              Get help ›
            </AppText>
          </Pressable>
        </View>

        {/* INFORMATION NOTICE */}
        {notice !== "" && (
          <View style={styles.notice}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.info}
            />

            <AppText style={styles.noticeText}>
              {notice}
            </AppText>

            <Pressable
              accessibilityLabel="Dismiss message"
              onPress={() => setNotice("")}
            >
              <Ionicons
                name="close"
                size={18}
                color={colors.info}
              />
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },

  content: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    paddingHorizontal: spacing.md,
    paddingTop:
      Platform.OS === "web"
        ? 100
        : spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },

  flex: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  brand: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "700",
    letterSpacing: 0.6,
  },

  heading: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginTop: spacing.xs,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },

  locationText: {
    color: colors.textSecondary,
    fontSize: typography.small,
    flexShrink: 1,
  },

  circleButton: {
    width: dimensions.iconButtonSize,
    height: dimensions.iconButtonSize,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  notificationDot: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.error,
  },

  panel: {
    gap: spacing.md,
  },

  section: {
    gap: spacing.md,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },

  searchBar: {
    minHeight: dimensions.inputHeight,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },

  searchInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    minHeight: 42,
  },

  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  category: {
    flexGrow: 1,
    flexBasis: "20%",
    alignItems: "center",
    gap: spacing.sm,
  },

  categoryIcon: {
    width: dimensions.inputHeight,
    height: dimensions.inputHeight,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryActive: {
    backgroundColor: colors.successBackground,
    borderColor: colors.primary,
    borderWidth: 2,
  },

  categoryHover: {
    borderColor: colors.primary,
    transform: [{ translateY: -2 }],
  },

  categoryLabel: {
    fontSize: typography.caption,
    color: colors.text,
    textAlign: "center",
  },

  categoryLabelActive: {
    color: colors.primary,
    fontWeight: "700",
  },

  featureCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },

  featureTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  featureTitle: {
    color: colors.textOnPrimary,
    fontSize: typography.subtitle,
    fontWeight: "700",
  },

  featureSubtitle: {
    color: colors.primaryLight,
    fontSize: typography.small,
    lineHeight: 20,
    marginTop: spacing.xs,
  },

  peopleBadge: {
    width: 54,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  requestButton: {
    backgroundColor: colors.surface,
    minHeight: dimensions.buttonHeight,
    borderRadius: radius.md,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },

  requestButtonHover: {
    backgroundColor: colors.primaryLight,
  },

  requestButtonText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: "700",
    flexShrink: 1,
  },

  selectedHint: {
    color: colors.primaryLight,
    fontSize: typography.caption,
    textAlign: "center",
  },

  multiline: {
    minHeight: 96,
    paddingVertical: spacing.md,
  },

  interactiveCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  walletIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },

  walletLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: "700",
  },

  walletBalance: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "700",
  },

  hoverCard: {
    borderColor: colors.primary,
    transform: [{ translateY: -2 }],
  },

  errandCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },

  errandHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  itemTitle: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "700",
  },

  tracker: {
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "space-between",
  },

  trackerItem: {
    flex: 1,
    alignItems: "center",
    gap: spacing.sm,
  },

  trackerDot: {
    width: 15,
    height: 15,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.disabled,
    backgroundColor: colors.surface,
  },

  trackerDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  trackerLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    textAlign: "center",
  },

  trackerLabelActive: {
    color: colors.primary,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  price: {
    color: colors.text,
    fontWeight: "700",
    fontSize: typography.body,
  },

  emptyCard: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },

  emptyContent: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "700",
  },

  centerText: {
    textAlign: "center",
  },

  link: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "700",
  },

  helpCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },

  notice: {
    backgroundColor: colors.infoBackground,
    padding: spacing.md,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  noticeText: {
    flex: 1,
    color: colors.info,
    fontSize: typography.small,
  },

  notificationItem: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },

  unreadDot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
});
