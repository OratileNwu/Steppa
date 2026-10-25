import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import type { ErrandStatus } from '@/components/ErrandCard';
import { colors, spacing, radius } from '@/theme';

type StatusBadgeProps = {
  status: ErrandStatus;
};

const statusLabels: Record<ErrandStatus, string> = {
  pending: 'Pending',
  requested: 'Requested',
  assigned: 'Assigned',
  accepted: 'Accepted',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const label = statusLabels[status] ?? 'Unknown';

  return (
    <View style={styles.badge}>
      <AppText style={styles.label}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
  },

  label: {
    color: colors.primary,
    fontWeight: '600',
  },
});