import { useCallback, useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';
import type { RunnerAnalyticsData } from '@/types/runnerAnalytics';

type AnalyticsState = {
  analytics: RunnerAnalyticsData | null;
  loading: boolean;
  error: string | null;
};

function amount(data: Record<string, any>) {
  const value = Number(data.agreedFee ?? data.offeredFee ?? data.fee ?? data.recommendedFee ?? 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function useRunnerAnalytics(period: string) {
  const [state, setState] = useState<AnalyticsState>({
    analytics: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setState({ analytics: null, loading: false, error: 'Please sign in to view earnings.' });
      return;
    }

    const completedQuery = query(
      collection(db, 'errands'),
      where('assignedRunnerId', '==', user.uid),
      where('status', '==', 'completed'),
    );

    return onSnapshot(completedQuery, (snapshot) => {
      const rows = snapshot.docs.map((document) => ({
        id: document.id,
        data: document.data(),
      }));
      const inPeriod = rows.filter(({ data }) => {
        const timestamp = data.statusTimes?.completed ?? data.customerConfirmedAt ?? data.completedAt;
        const date = timestamp?.toDate ? timestamp.toDate() : timestamp ? new Date(timestamp) : null;
        if (!date || Number.isNaN(date.getTime())) return period === new Date().toISOString().slice(0, 7);
        return date.toISOString().slice(0, 7) === period;
      });
      const netEarnings = inPeriod.reduce((sum, row) => sum + amount(row.data), 0);
      const completedTrips = inPeriod.length;
      const recentTrips = rows
        .slice()
        .sort((a, b) => {
          const av = a.data.statusTimes?.completed?.toMillis?.() ?? 0;
          const bv = b.data.statusTimes?.completed?.toMillis?.() ?? 0;
          return bv - av;
        })
        .slice(0, 10)
        .map(({ id, data }) => ({
          id,
          title: String(data.title ?? 'Completed errand'),
          destination: String(data.destinationAddress ?? data.queueLocation ?? data.location ?? 'Destination not provided'),
          date: String(data.statusTimes?.completed?.toDate?.()?.toISOString?.() ?? ''),
          amount: amount(data),
          status: String(data.status ?? 'completed'),
          category: String(data.category ?? 'Other errands'),
        }));

      const weeklyPerformance = Array.from({ length: 4 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (3 - index) * 7);
        const key = date.toISOString().slice(0, 10);
        const start = new Date(date);
        start.setDate(start.getDate() - 6);
        const weekly = rows.filter(({ data }) => {
          const raw = data.statusTimes?.completed;
          const done = raw?.toDate ? raw.toDate() : raw ? new Date(raw) : null;
          return done && done >= start && done <= date;
        });
        return { week: key, earnings: weekly.reduce((sum, row) => sum + amount(row.data), 0), trips: weekly.length };
      });

      const monthRows = rows.filter(({ data }) => {
        const raw = data.statusTimes?.completed;
        const done = raw?.toDate ? raw.toDate() : raw ? new Date(raw) : null;
        return done && !Number.isNaN(done.getTime());
      });
      const monthlyPerformance = monthRows.reduce<Record<string, number>>((acc, row) => {
        const raw = row.data.statusTimes?.completed;
        const done = raw?.toDate ? raw.toDate() : new Date(raw);
        const key = done.toISOString().slice(0, 7);
        acc[key] = (acc[key] ?? 0) + amount(row.data);
        return acc;
      }, {});
      const categories = inPeriod.reduce<Record<string, number>>((acc, row) => {
        const key = String(row.data.category ?? 'Other errands');
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {});

      setState({
        analytics: {
          period,
          grossEarnings: netEarnings,
          commission: 0,
          netEarnings,
          totalTrips: completedTrips,
          completedTrips,
          cancelledTrips: 0,
          averageEarningsPerTrip: completedTrips ? netEarnings / completedTrips : 0,
          completionRate: completedTrips ? 100 : 0,
          earningsGrowth: null,
          weeklyPerformance,
          monthlyPerformance: Object.entries(monthlyPerformance).sort(([a], [b]) => a.localeCompare(b)).map(([month, earnings]) => ({ month, earnings })),
          categories: Object.entries(categories).map(([name, completed]) => ({ name, completed })),
          recentTrips,
        },
        loading: false,
        error: null,
      });
    }, (error) => {
      console.error('Runner analytics subscription failed:', error);
      setState({ analytics: null, loading: false, error: 'Unable to load earnings. Check Firestore permissions.' });
    });
  }, [period]);

  const refreshAnalytics = useCallback(async () => {
    // Firestore onSnapshot keeps this view live; changing the period re-filters the data.
  }, []);

  return { ...state, refreshAnalytics };
}
