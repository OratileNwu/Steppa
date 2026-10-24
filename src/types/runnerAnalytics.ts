export type WeeklyPerformance = {
  week: string;
  earnings: number;
  trips: number;
};

export type MonthlyPerformance = {
  month: string;
  earnings: number;
};

export type TripCategory = {
  name: string;
  completed: number;
};

export type RunnerTrip = {
  id: string;
  title: string;
  destination: string;
  date: string;
  amount: number;
  status: string;
  category: string;
};

export type RunnerAnalyticsData = {
  period: string;

  // Earnings
  grossEarnings: number;
  commission: number;
  netEarnings: number;

  // Trips
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;

  // Performance
  averageEarningsPerTrip: number;
  completionRate: number;
  earningsGrowth: number | null;

  // Charts
  weeklyPerformance: WeeklyPerformance[];
  monthlyPerformance: MonthlyPerformance[];

  // Categories
  categories: TripCategory[];

  // History
  recentTrips: RunnerTrip[];
};