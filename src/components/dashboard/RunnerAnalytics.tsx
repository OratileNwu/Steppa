 import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, radius, spacing } from '@/theme';
import { useRunnerAnalytics } from '@/hooks/useRunnerAnalytics';

import type {
  RunnerAnalyticsData,
  RunnerTrip,
} from '@/types/runnerAnalytics';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type ChartType = 'earnings' | 'trips';

function formatMoney(amount: number): string {
  return `R ${amount.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getCurrentPeriod(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${year}-${month}`;
}

function changePeriod(period: string, offset: number): string {
  const [year, month] = period.split('-').map(Number);
  const date = new Date(year, month - 1 + offset, 1);

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, '0')}`;
}

function formatPeriod(period: string): string {
  const [year, month] = period.split('-').map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString(
    'en-ZA',
    {
      month: 'long',
      year: 'numeric',
    }
  );
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionHeading}>
      <AppText variant="heading" style={styles.sectionTitle}>
        {title}
      </AppText>

      {subtitle ? (
        <AppText variant="secondary">{subtitle}</AppText>
      ) : null}
    </View>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: IconName;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <AppCard style={styles.metricCard}>
      <View style={styles.metricIcon}>
        <Ionicons
          name={icon}
          size={20}
          color={colors.primary}
        />
      </View>

      <AppText variant="secondary" style={styles.metricLabel}>
        {label}
      </AppText>

      <AppText variant="heading" style={styles.metricValue}>
        {value}
      </AppText>

      <AppText variant="small" style={styles.metricDetail}>
        {detail}
      </AppText>
    </AppCard>
  );
}

function BarChart({
  values,
  labels,
  money = false,
}: {
  values: number[];
  labels: string[];
  money?: boolean;
}) {
  if (values.length === 0) {
    return (
      <View style={styles.chartEmpty}>
        <Ionicons
          name="bar-chart-outline"
          size={30}
          color={colors.textSecondary}
        />

        <AppText variant="secondary">
          No chart data available.
        </AppText>
      </View>
    );
  }

  const maxValue = Math.max(...values, 1);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chartScroll}
    >
      {values.map((value, index) => {
        const height = Math.max(
          (Math.max(value, 0) / maxValue) * 135,
          6
        );

        return (
          <View
            key={`${labels[index]}-${index}`}
            style={styles.barColumn}
          >
            <AppText variant="small" style={styles.barValue}>
              {money ? formatMoney(value) : String(value)}
            </AppText>

            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  {
                    height,
                    backgroundColor:
                      index === values.length - 1
                        ? colors.primary
                        : '#A7D8BA',
                  },
                ]}
              />
            </View>

            <AppText variant="small" style={styles.barLabel}>
              {labels[index] ?? ''}
            </AppText>
          </View>
        );
      })}
    </ScrollView>
  );
}

function ProgressRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentage =
    total > 0 ? (value / total) * 100 : 0;

  const safePercentage = Math.min(
    100,
    Math.max(0, percentage)
  );

  return (
    <View style={styles.progressRow}>
      <View style={styles.progressHeading}>
        <View style={styles.progressLabel}>
          <Ionicons
            name="layers-outline"
            size={19}
            color={colors.primary}
          />

          <AppText variant="body">{label}</AppText>
        </View>

        <AppText variant="body" style={styles.boldText}>
          {value} ({Math.round(percentage)}%)
        </AppText>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${safePercentage}%` },
          ]}
        />
      </View>
    </View>
  );
}

function TripRow({ trip }: { trip: RunnerTrip }) {
  const completed =
    trip.status.toLowerCase() === 'completed';

  return (
    <View style={styles.tripRow}>
      <View style={styles.tripIcon}>
        <Ionicons
          name="bicycle-outline"
          size={21}
          color={colors.primary}
        />
      </View>

      <View style={styles.tripDetails}>
        <AppText variant="body" style={styles.boldText}>
          {trip.title}
        </AppText>

        <AppText variant="small">
          {trip.destination}
        </AppText>

        <AppText variant="small">
          {trip.date} · {trip.id}
        </AppText>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: completed
                ? colors.successBackground
                : colors.surfaceMuted,
            },
          ]}
        >
          <AppText
            style={[
              styles.statusText,
              {
                color: completed
                  ? colors.success
                  : colors.textSecondary,
              },
            ]}
          >
            {trip.status}
          </AppText>
        </View>
      </View>

      <AppText style={styles.tripAmount}>
        {formatMoney(trip.amount)}
      </AppText>
    </View>
  );
}

function LoadingState() {
  return (
    <View style={styles.stateContainer}>
      <ActivityIndicator
        size="large"
        color={colors.primary}
      />

      <AppText variant="heading">
        Loading analytics
      </AppText>

      <AppText
        variant="secondary"
        style={styles.centerText}
      >
        Retrieving your earnings and trip information...
      </AppText>
    </View>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.stateContainer}>
      <Ionicons
        name="alert-circle-outline"
        size={48}
        color={colors.error}
      />

      <AppText variant="heading">
        Unable to load analytics
      </AppText>

      <AppText
        variant="secondary"
        style={styles.centerText}
      >
        {message}
      </AppText>

      <Pressable
        style={styles.retryButton}
        onPress={onRetry}
      >
        <AppText style={styles.retryButtonText}>
          Try Again
        </AppText>
      </Pressable>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.stateContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name="analytics-outline"
          size={42}
          color={colors.primary}
        />
      </View>

      <AppText variant="heading">
        No analytics available
      </AppText>

      <AppText
        variant="secondary"
        style={styles.centerText}
      >
        Your earnings, trips and performance statistics
        will appear here when data becomes available.
      </AppText>
    </View>
  );
}

function AnalyticsContent({
  analytics,
}: {
  analytics: RunnerAnalyticsData;
}) {
  const [chartType, setChartType] =
    useState<ChartType>('earnings');

  const weeklyValues =
    analytics.weeklyPerformance.map((week) =>
      chartType === 'earnings'
        ? week.earnings
        : week.trips
    );

  const weeklyLabels =
    analytics.weeklyPerformance.map(
      (week) => week.week
    );

  const monthlyValues =
    analytics.monthlyPerformance.map(
      (month) => month.earnings
    );

  const monthlyLabels =
    analytics.monthlyPerformance.map(
      (month) => month.month
    );

  return (
    <>
      {/* NET EARNINGS */}

      <View style={styles.earningsHero}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="wallet-outline"
              size={23}
              color="#FFFFFF"
            />
          </View>

          <AppText style={styles.heroLabel}>
            TOTAL NET EARNINGS
          </AppText>
        </View>

        <AppText style={styles.heroAmount}>
          {formatMoney(analytics.netEarnings)}
        </AppText>

        {analytics.earningsGrowth !== null && (
          <View style={styles.heroFooter}>
            <View style={styles.heroGrowth}>
              <Ionicons
                name={
                  analytics.earningsGrowth >= 0
                    ? 'trending-up'
                    : 'trending-down'
                }
                size={17}
                color="#FFFFFF"
              />

              <AppText style={styles.heroGrowthText}>
                {analytics.earningsGrowth >= 0
                  ? '+'
                  : ''}
                {analytics.earningsGrowth.toFixed(1)}%
              </AppText>
            </View>

            <AppText style={styles.heroFooterText}>
              vs previous month
            </AppText>
          </View>
        )}
      </View>

      {/* TRIP STATISTICS */}

      <SectionHeading title="Performance Overview" />

      <View style={styles.metricGrid}>
        <MetricCard
          icon="bicycle-outline"
          label="Total Trips"
          value={String(analytics.totalTrips)}
          detail="Trips requested"
        />

        <MetricCard
          icon="checkmark-circle-outline"
          label="Completed Trips"
          value={String(analytics.completedTrips)}
          detail={`${analytics.completionRate.toFixed(
            1
          )}% completion rate`}
        />

        <MetricCard
          icon="cash-outline"
          label="Average per Trip"
          value={formatMoney(
            analytics.averageEarningsPerTrip
          )}
          detail="Net earnings per completed trip"
        />

        <MetricCard
          icon="close-circle-outline"
          label="Cancelled Trips"
          value={String(analytics.cancelledTrips)}
          detail="Trips not completed"
        />
      </View>

      {/* WEEKLY PERFORMANCE */}

      <SectionHeading
        title="Weekly Performance"
        subtitle="Track your earnings and trips"
      />

      <AppCard style={styles.chartCard}>
        <View style={styles.chartTabs}>
          <Pressable
            onPress={() => setChartType('earnings')}
            style={[
              styles.chartTab,
              chartType === 'earnings' &&
                styles.activeChartTab,
            ]}
          >
            <AppText
              style={[
                styles.chartTabText,
                chartType === 'earnings' &&
                  styles.activeChartTabText,
              ]}
            >
              Earnings
            </AppText>
          </Pressable>

          <Pressable
            onPress={() => setChartType('trips')}
            style={[
              styles.chartTab,
              chartType === 'trips' &&
                styles.activeChartTab,
            ]}
          >
            <AppText
              style={[
                styles.chartTabText,
                chartType === 'trips' &&
                  styles.activeChartTabText,
              ]}
            >
              Trips
            </AppText>
          </Pressable>
        </View>

        <BarChart
          values={weeklyValues}
          labels={weeklyLabels}
          money={chartType === 'earnings'}
        />
      </AppCard>

      {/* EARNINGS BREAKDOWN */}

      <SectionHeading
        title="Earnings Breakdown"
        subtitle="Your earnings after platform deductions"
      />

      <AppCard style={styles.breakdownCard}>
        <View style={styles.breakdownRow}>
          <AppText variant="secondary">
            Gross earnings
          </AppText>

          <AppText style={styles.boldText}>
            {formatMoney(analytics.grossEarnings)}
          </AppText>
        </View>

        <View style={styles.breakdownRow}>
          <AppText variant="secondary">
            Platform commission
          </AppText>

          <AppText style={styles.deductionText}>
            - {formatMoney(analytics.commission)}
          </AppText>
        </View>

        <View style={styles.divider} />

        <View style={styles.breakdownRow}>
          <AppText variant="heading">
            Net earnings
          </AppText>

          <AppText
            variant="heading"
            style={styles.greenText}
          >
            {formatMoney(analytics.netEarnings)}
          </AppText>
        </View>
      </AppCard>

      {/* TRIP CATEGORIES */}

      <SectionHeading
        title="Trip Categories"
        subtitle="Completed trips by category"
      />

      <AppCard style={styles.categoryCard}>
        {analytics.categories.length > 0 ? (
          analytics.categories.map((category) => (
            <ProgressRow
              key={category.name}
              label={category.name}
              value={category.completed}
              total={analytics.completedTrips}
            />
          ))
        ) : (
          <AppText variant="secondary">
            No trip category data available.
          </AppText>
        )}
      </AppCard>

      {/* MONTHLY EARNINGS CHART */}

      <SectionHeading
        title="Monthly Earnings Trend"
        subtitle="Your earnings over time"
      />

      <AppCard style={styles.chartCard}>
        <BarChart
          values={monthlyValues}
          labels={monthlyLabels}
          money
        />
      </AppCard>

      {/* RECENT TRIPS */}

      <SectionHeading
        title="Recent Trips"
        subtitle="Your latest trip activity"
      />

      <AppCard style={styles.recentCard}>
        {analytics.recentTrips.length > 0 ? (
          analytics.recentTrips.map(
            (trip, index) => (
              <View key={trip.id}>
                <TripRow trip={trip} />

                {index <
                  analytics.recentTrips.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            )
          )
        ) : (
          <AppText variant="secondary">
            No recent trips available.
          </AppText>
        )}
      </AppCard>

      {/* SUMMARY */}

      <View style={styles.summaryBanner}>
        <Ionicons
          name="trophy-outline"
          size={24}
          color={colors.primary}
        />

        <View style={styles.summaryText}>
          <AppText
            variant="body"
            style={styles.boldText}
          >
            Your performance summary
          </AppText>

          <AppText variant="secondary">
            You completed {analytics.completedTrips}{' '}
            trips and earned{' '}
            {formatMoney(analytics.netEarnings)}{' '}
            after commission.
          </AppText>
        </View>
      </View>
    </>
  );
}

export default function RunnerAnalytics() {
  const router = useRouter();

  const [period, setPeriod] =
    useState<string>(getCurrentPeriod);

  const {
    analytics,
    loading,
    error,
    refreshAnalytics,
  } = useRunnerAnalytics(period);

  const isCurrentMonth =
    period === getCurrentPeriod();

  return (
    <ScreenContainer padded={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() =>
              router.navigate('/runner-home')
            }
            accessibilityRole="button"
            accessibilityLabel="Go to runner dashboard"
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={colors.text}
            />
          </Pressable>

          <View style={styles.headerText}>
            <AppText variant="title">
              Runner Analytics
            </AppText>

            <AppText variant="secondary">
              Track your earnings, trips and performance
            </AppText>
          </View>
        </View>

        {/* MONTH SELECTOR */}

        <View style={styles.monthSelector}>
          <Pressable
            onPress={() =>
              setPeriod((current) =>
                changePeriod(current, -1)
              )
            }
            style={styles.monthArrow}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={colors.primary}
            />
          </Pressable>

          <View style={styles.monthText}>
            <AppText variant="heading">
              {formatPeriod(period)}
            </AppText>

            <AppText
              variant="small"
              style={styles.centerText}
            >
              Monthly overview
            </AppText>
          </View>

          <Pressable
            onPress={() =>
              setPeriod((current) =>
                changePeriod(current, 1)
              )
            }
            disabled={isCurrentMonth}
            style={styles.monthArrow}
            accessibilityRole="button"
            accessibilityLabel="Next month"
          >
            <Ionicons
              name="chevron-forward"
              size={22}
              color={
                isCurrentMonth
                  ? colors.disabled
                  : colors.primary
              }
            />
          </Pressable>
        </View>

        {/* ANALYTICS CONTENT */}

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={() =>
              void refreshAnalytics()
            }
          />
        ) : analytics ? (
          <AnalyticsContent analytics={analytics} />
        ) : (
          <EmptyState />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerText: {
    flex: 1,
    gap: 3,
  },

  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    borderRadius: radius.lg,
  },

  monthArrow: {
    padding: spacing.sm,
  },

  monthText: {
    alignItems: 'center',
    gap: 3,
  },

  centerText: {
    textAlign: 'center',
  },

  earningsHero: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  heroIcon: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroLabel: {
    color: '#E8F5EC',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
  },

  heroAmount: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
  },

  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  heroGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },

  heroGrowthText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  heroFooterText: {
    color: '#E8F5EC',
    fontSize: 13,
  },

  sectionHeading: {
    gap: 3,
    marginTop: spacing.sm,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
  },

  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },

  metricCard: {
    width: '48%',
    minWidth: 0,
    gap: spacing.sm,
    padding: spacing.md,
  },

  metricIcon: {
    width: 38,
    height: 38,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  metricLabel: {
    fontSize: 12,
  },

  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },

  metricDetail: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  chartCard: {
    padding: spacing.md,
    gap: spacing.lg,
  },

  chartTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: 4,
  },

  chartTab: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: radius.sm,
  },

  activeChartTab: {
    backgroundColor: colors.primary,
  },

  chartTabText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },

  activeChartTabText: {
    color: '#FFFFFF',
  },

  chartScroll: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: 190,
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },

  barColumn: {
    width: 75,
    alignItems: 'center',
    gap: spacing.sm,
  },

  barValue: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  barTrack: {
    height: 135,
    width: 40,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  bar: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 6,
  },

  barLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  chartEmpty: {
    minHeight: 170,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },

  breakdownCard: {
    padding: spacing.md,
    gap: spacing.md,
  },

  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },

  boldText: {
    fontWeight: '700',
  },

  deductionText: {
    color: colors.error,
    fontWeight: '700',
  },

  greenText: {
    color: colors.primary,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },

  categoryCard: {
    padding: spacing.md,
    gap: spacing.lg,
  },

  progressRow: {
    gap: spacing.sm,
  },

  progressHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },

  progressLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },

  progressTrack: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },

  recentCard: {
    padding: spacing.md,
  },

  tripRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },

  tripIcon: {
    width: 42,
    height: 42,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tripDetails: {
    flex: 1,
    gap: 4,
  },

  tripAmount: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginTop: 3,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },

  summaryText: {
    flex: 1,
    gap: spacing.sm,
  },

  stateContainer: {
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },

  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});