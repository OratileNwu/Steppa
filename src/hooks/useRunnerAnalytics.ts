import { useCallback, useState } from 'react';

import type { RunnerAnalyticsData } from '@/types/runnerAnalytics';

type AnalyticsState = {
  analytics: RunnerAnalyticsData | null;
  loading: boolean;
  error: string | null;
};

export function useRunnerAnalytics(period: string) {
  const [state] = useState<AnalyticsState>({
    analytics: null,
    loading: false,
    error: null,
  });

  const refreshAnalytics = useCallback(async () => {
    // Backend integration will go here.
    // The selected period will be sent to the API.
    console.log('Analytics requested for:', period);
  }, [period]);

  return {
    analytics: state.analytics,
    loading: state.loading,
    error: state.error,
    refreshAnalytics,
  };
}