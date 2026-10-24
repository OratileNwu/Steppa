
import { View, StyleSheet } from 'react-native';

import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { StatusBadge } from '@/components/StatusBadge';
import { colors, commonStyles, spacing, typography } from '@/theme';

type ErrandStatus =
  | 'requested'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

type ErrandCardProps = {
  title: string;
  location: string;
  fee: string | number;
  status: ErrandStatus;
  description?: string;
  runnerName?: string;
};

export function ErrandCard({
  title,
  location,
  fee,
  status,
  description,
  runnerName,
}: ErrandCardProps) {
  return (
    <AppCard>
      <View style={styles.header}>
        <AppText variant="heading" style={styles.title}>
          {title}
        </AppText>

        <StatusBadge status={status} />
      </View>

      {description ? (
        <AppText variant="secondary">
          {description}
        </AppText>
      ) : null}

      <View style={commonStyles.divider} />

      <View style={styles.detailRow}>
        <AppText variant="secondary">Location</AppText>
        <AppText style={styles.detailValue}>
          {location}
        </AppText>
      </View>

      {runnerName ? (
        <View style={styles.detailRow}>
          <AppText variant="secondary">Runner</AppText>
          <AppText style={styles.detailValue}>
            {runnerName}
          </AppText>
        </View>
      ) : null}

      <View style={styles.footer}>
        <AppText variant="secondary">Errand fee</AppText>
        <AppText style={styles.fee}>
          {typeof fee === 'number' ? `R${fee.toFixed(2)}` : fee}
        </AppText>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.subtitle,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fee: {
    color: colors.primary,
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
});
