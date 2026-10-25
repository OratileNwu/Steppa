import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { db, auth } from '@/lib/firebase';
import { authActions } from '@/hooks/use-auth-session';
import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { ErrandCard } from '@/components/ErrandCard';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, radius, spacing, typography } from '@/theme';
import type { ErrandStatus } from '@/components/ErrandCard';

type ErrandCategory = 'Groceries' | 'Parcels';

type Errand = {
  id: string;
  title: string;
  category: ErrandCategory;
  location: string;
  distance: string;
  fee: number;
  description: string;
  status: ErrandStatus;
};

type DashboardTab = 'available' | 'mine';
type CategoryFilter = 'All tasks' | ErrandCategory;

export default function RunnerDashboard() {
  const router = useRouter();

  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>('available');
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>('All tasks');

  const [availableErrands, setAvailableErrands] = useState<Errand[]>([]);
  const [myErrands, setMyErrands] = useState<Errand[]>([]);
  const [loadingErrands, setLoadingErrands] = useState(true);
  const [errandLoadError, setErrandLoadError] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setAvailableErrands([]);
      setMyErrands([]);
      setErrandLoadError('Please sign in to view errands.');
      setLoadingErrands(false);
      return;
    }

    setLoadingErrands(true);
    setErrandLoadError(null);


// New errands are created as "requested". Keep "pending" for older
// documents created by earlier versions of the app.
const availableQuery = query(
  collection(db, "errands"),
  where("status", "in", ["requested", "pending"]),
  where("runnerId", "==", null)
);

// The service assigns errands with status "accepted", not "assigned".
const assignedQuery = query(
  collection(db, "errands"),
  where("runnerId", "==", user.uid),
  where("assignedRunnerId", "==", user.uid),
  where("status", "in", [
    "accepted",
    "assigned",
    "in_progress",
    "awaiting_customer_confirmation",
    "completion_disputed",
    "completed",
  ])
);

    const mapErrand = (document: {
      id: string;
      data: () => Record<string, any>;
    }): Errand => {
      const data = document.data();

const category: ErrandCategory =
  data.category === "Parcels" ||
  data.category === "parcels"
    ? "Parcels"
    : "Groceries";

      return {
        id: document.id,
        title: data.title ?? `${data.category ?? 'Errand'} request`,
        category,
        location:
          data.collectionAddress ??
          data.queueLocation ??
          data.location ??
          'Location not provided',
        distance: '',
        fee: Number(data.offeredFee ?? data.fee ?? 0),
        description: data.description ?? '',
        // ErrandCard displays new requests with the legacy pending label.
        status: data.status === 'requested' ? 'pending' : (data.status ?? 'pending'),
      };
    };

    let availableLoaded = false;
    let assignedLoaded = false;

    const finishLoadingIfReady = () => {
      if (availableLoaded && assignedLoaded) {
        setLoadingErrands(false);
      }
    };

    const unsubscribeAvailable = onSnapshot(
      availableQuery,
      (snapshot) => {
        setAvailableErrands(snapshot.docs.map(mapErrand));
        availableLoaded = true;
        finishLoadingIfReady();
      },
      (error) => {
        console.error(
          '[Steppa] Could not load available errands:',
          error,
        );
        setErrandLoadError(
          'Could not load available errands. Check Firestore permissions.',
        );
        availableLoaded = true;
        finishLoadingIfReady();
      },
    );

    const unsubscribeAssigned = onSnapshot(
      assignedQuery,
      (snapshot) => {
        setMyErrands(snapshot.docs.map(mapErrand));
        assignedLoaded = true;
        finishLoadingIfReady();
      },
      (error) => {
        console.error(
          '[Steppa] Could not load your errands:',
          error,
        );
        setErrandLoadError(
          'Could not load your assigned errands. Check Firestore permissions.',
        );
        assignedLoaded = true;
        finishLoadingIfReady();
      },
    );

    return () => {
      unsubscribeAvailable();
      unsubscribeAssigned();
    };
  }, []);

  const filteredErrands = availableErrands.filter((errand) => {
    if (selectedCategory === 'All tasks') {
      return true;
    }

    return errand.category === selectedCategory;
  });

  const displayedErrands =
    activeTab === 'available' ? filteredErrands : myErrands;

const handleViewErrand = (errand: Errand) => {
  router.push({
    pathname: "/runner-errand-details",
    params: { id: errand.id },
  });
};

  const handleNavigation = (page: string) => {
    switch (page) {
      case 'Home':
        router.replace('/runner-home');
        break;
      case 'Activity':
        router.push('/runner-analytics');
        break;
      case 'Wallet':
        router.push('/(app)/runner-wallet');
        break;
      case 'Profile':
        router.push('/edit-profile');
        break;
    }
  };

  return (
    <ScreenContainer padded={false}>
      <View style={styles.mainContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <AppText variant="small">STEPPA RUNNER</AppText>

              <AppText variant="title">Runner Dashboard</AppText>

              <AppText variant="secondary">
                Find nearby errands and start earning.
              </AppText>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Log out of Steppa"
              onPress={async () => {
                try {
                  await signOut(auth);
                  authActions.exitDemo();
                  router.replace('/welcome');
                } catch (error) {
                  console.error(
                    'Steppa runner logout failed:',
                    error,
                  );

                  Alert.alert(
                    'Logout failed',
                    'We could not log you out. Please try again.',
                  );
                }
              }}
              style={styles.profileIcon}
            >
              <Ionicons
                name="log-out-outline"
                size={24}
                color={colors.primary}
              />
            </Pressable>
          </View>

          {/* ONLINE STATUS */}
          <AppCard style={styles.availabilityCard}>
            <View style={styles.availabilityRow}>
              <View style={styles.availabilityDetails}>
                <View style={styles.statusHeading}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: isOnline
                          ? colors.success
                          : colors.disabled,
                      },
                    ]}
                  />

                  <AppText
                    variant="heading"
                    style={styles.statusTitle}
                  >
                    {isOnline ? "You're online" : "You're offline"}
                  </AppText>
                </View>

                <AppText variant="secondary">
                  {isOnline
                    ? 'You are available for nearby errands.'
                    : 'Go online to become available for errands.'}
                </AppText>
              </View>

              <Switch
                value={isOnline}
                onValueChange={setIsOnline}
                trackColor={{
                  false: colors.disabled,
                  true: colors.primaryLight,
                }}
                thumbColor={
                  isOnline ? colors.primary : colors.surface
                }
                accessibilityLabel="Runner availability"
              />
            </View>
          </AppCard>

          {/* EARNINGS SUMMARY */}
          <View style={styles.summaryRow}>
            <AppCard style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons
                  name="wallet-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>

              <AppText variant="secondary">
                Today's earnings
              </AppText>

              <AppText
                variant="heading"
                style={styles.summaryValue}
              >
                R —
              </AppText>

              <AppText variant="small">
                Earnings not available yet
              </AppText>
            </AppCard>

            <AppCard style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>

              <AppText variant="secondary">
                Completed errands
              </AppText>

              <AppText
                variant="heading"
                style={styles.summaryValue}
              >
                —
              </AppText>

              <AppText variant="small">
                Data not available yet
              </AppText>
            </AppCard>
          </View>

          {activeTab === 'available' && myErrands.some((e) => ['accepted', 'assigned', 'in_progress', 'awaiting_customer_confirmation', 'completion_disputed'].includes(e.status)) ? (
            <AppCard>
              <AppText variant="heading">Your active errands</AppText>
              {myErrands.filter((e) => ['accepted', 'assigned', 'in_progress', 'awaiting_customer_confirmation', 'completion_disputed'].includes(e.status)).slice(0, 3).map((errand) => (
                <Pressable key={errand.id} onPress={() => handleViewErrand(errand)} style={{ paddingVertical: spacing.sm }} accessibilityRole="button">
                  <AppText>{errand.title}</AppText>
                  <AppText variant="secondary">{String(errand.status).replaceAll('_', ' ')}</AppText>
                </Pressable>
              ))}
              <Pressable onPress={() => setActiveTab('mine')} accessibilityRole="button">
                <AppText style={styles.viewButtonText}>View all my errands</AppText>
              </Pressable>
            </AppCard>
          ) : null}

          {/* SECTION HEADER */}
          <View style={styles.sectionHeading}>
            <AppText variant="heading">Errands</AppText>

            <AppText variant="secondary">
              Browse available tasks or manage your errands.
            </AppText>
          </View>

          {/* TABS */}
          <View style={styles.tabsContainer}>
            <Pressable
              style={[
                styles.tab,
                activeTab === 'available' && styles.activeTab,
              ]}
              onPress={() => setActiveTab('available')}
              accessibilityRole="button"
            >
              <AppText
                style={[
                  styles.tabText,
                  activeTab === 'available' && styles.activeTabText,
                ]}
              >
                Available ({availableErrands.length})
              </AppText>
            </Pressable>

            <Pressable
              style={[
                styles.tab,
                activeTab === 'mine' && styles.activeTab,
              ]}
              onPress={() => setActiveTab('mine')}
              accessibilityRole="button"
            >
              <AppText
                style={[
                  styles.tabText,
                  activeTab === 'mine' && styles.activeTabText,
                ]}
              >
                My errands ({myErrands.length})
              </AppText>
            </Pressable>
          </View>

          {/* CATEGORY FILTERS */}
          {activeTab === 'available' && (
            <View style={styles.filters}>
              {(['All tasks', 'Groceries', 'Parcels'] as const).map(
                (category) => (
                  <Pressable
                    key={category}
                    onPress={() => setSelectedCategory(category)}
                    style={[
                      styles.filterChip,
                      selectedCategory === category &&
                        styles.selectedFilterChip,
                    ]}
                    accessibilityRole="button"
                  >
                    <AppText
                      style={[
                        styles.filterText,
                        selectedCategory === category &&
                          styles.selectedFilterText,
                      ]}
                    >
                      {category}
                    </AppText>
                  </Pressable>
                ),
              )}
            </View>
          )}

          {/* OFFLINE NOTICE */}
          {!isOnline && (
            <AppCard style={styles.noticeCard}>
              <AppText variant="heading">
                You're currently offline
              </AppText>

              <AppText variant="secondary">
                You can browse errands, but switch online when you're ready
                to receive requests.
              </AppText>
            </AppCard>
          )}

          {/* ERRAND LIST */}
          <View style={styles.errandList}>
            <View style={styles.listHeading}>
              <AppText
                variant="heading"
                style={styles.listTitle}
              >
                {activeTab === 'available'
                  ? 'Available errands'
                  : 'My errands'}
              </AppText>

              <AppText variant="secondary">
                {displayedErrands.length} found
              </AppText>
            </View>

            {loadingErrands ? (
              <AppCard style={styles.emptyCard}>
                <AppText>Loading errands...</AppText>
              </AppCard>
            ) : errandLoadError ? (
              <AppCard style={styles.emptyCard}>
                <AppText>{errandLoadError}</AppText>
              </AppCard>
            ) : displayedErrands.length === 0 ? (
              <AppCard style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name={
                      activeTab === 'available'
                        ? 'search-outline'
                        : 'clipboard-outline'
                    }
                    size={28}
                    color={colors.primary}
                  />
                </View>

                <AppText
                  variant="heading"
                  style={styles.emptyTitle}
                >
                  {activeTab === 'available'
                    ? 'No available errands'
                    : 'No errands yet'}
                </AppText>

                <AppText
                  variant="secondary"
                  style={styles.emptyDescription}
                >
                  {activeTab === 'available'
                    ? 'Available errands will appear here once they are loaded.'
                    : 'Errands assigned to you will appear here.'}
                </AppText>
              </AppCard>
            ) : (
              displayedErrands.map((errand) => (
                <View
                  key={errand.id}
                  style={styles.errandItem}
                >
                  <View style={styles.errandMeta}>
                    <View style={styles.categoryLabel}>
                      <Ionicons
                        name={
                          errand.category === 'Groceries'
                            ? 'basket-outline'
                            : 'cube-outline'
                        }
                        size={16}
                        color={colors.primary}
                      />

                      <AppText variant="small">
                        {errand.category}
                      </AppText>
                    </View>

                    {errand.distance ? (
                      <View style={styles.distanceLabel}>
                        <Ionicons
                          name="location-outline"
                          size={15}
                          color={colors.textSecondary}
                        />

                        <AppText variant="small">
                          {errand.distance}
                        </AppText>
                      </View>
                    ) : null}
                  </View>

                  <ErrandCard
                    title={errand.title}
                    location={errand.location}
                    fee={errand.fee}
                    status={errand.status}
                    description={errand.description}
                  />

                  <Pressable
                    onPress={() => handleViewErrand(errand)}
                    style={styles.viewButton}
                    accessibilityRole="button"
                  >
                    <AppText style={styles.viewButtonText}>
                      View errand
                    </AppText>

                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color={colors.textOnPrimary}
                    />
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* BOTTOM NAVIGATION */}
        <View style={styles.bottomNavigation}>
          {(
            [
              { name: 'Home', icon: 'home-outline' },
              { name: 'Activity', icon: 'time-outline' },
              { name: 'Wallet', icon: 'wallet-outline' },
              { name: 'Profile', icon: 'person-outline' },
            ] as const
          ).map((item) => (
            <Pressable
              key={item.name}
              style={styles.navigationItem}
              onPress={() => handleNavigation(item.name)}
              accessibilityRole="button"
            >
              <Ionicons
                name={item.icon}
                size={23}
                color={
                  item.name === 'Home'
                    ? colors.primary
                    : colors.textSecondary
                }
              />

              <AppText
                variant="small"
                style={[
                  styles.navigationText,
                  item.name === 'Home' &&
                    styles.activeNavigationText,
                ]}
              >
                {item.name}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },

  headerText: {
    flex: 1,
    gap: spacing.xs,
  },

  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  availabilityCard: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryLight,
  },

  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },

  availabilityDetails: {
    flex: 1,
    gap: spacing.sm,
  },

  statusHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
  },

  statusTitle: {
    fontSize: typography.subtitle,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  summaryCard: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },

  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryValue: {
    color: colors.primary,
  },

  sectionHeading: {
    gap: spacing.xs,
  },

  tabsContainer: {
    flexDirection: 'row',
    padding: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },

  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    alignItems: 'center',
  },

  activeTab: {
    backgroundColor: colors.primary,
  },

  tabText: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontWeight: '600',
    textAlign: 'center',
  },

  activeTabText: {
    color: colors.textOnPrimary,
  },

  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  filterChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },

  selectedFilterChip: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },

  filterText: {
    color: colors.textSecondary,
    fontSize: typography.small,
  },

  selectedFilterText: {
    color: colors.primary,
    fontWeight: '700',
  },

  errandList: {
    gap: spacing.md,
  },

  listHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  listTitle: {
    fontSize: typography.subtitle,
  },

  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    textAlign: 'center',
  },

  emptyDescription: {
    textAlign: 'center',
    maxWidth: 280,
  },

  errandItem: {
    gap: spacing.sm,
  },

  errandMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },

  categoryLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  distanceLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  viewButton: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },

  viewButtonText: {
    color: colors.textOnPrimary,
    fontSize: typography.body,
    fontWeight: '600',
  },

  noticeCard: {
    backgroundColor: colors.warningBackground,
    borderColor: colors.warningBackground,
  },

  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },

  navigationItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },

  navigationText: {
    color: colors.textSecondary,
  },

  activeNavigationText: {
    color: colors.primary,
    fontWeight: '700',
  },
});