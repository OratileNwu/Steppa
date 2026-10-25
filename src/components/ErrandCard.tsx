import { View, StyleSheet } from 'react-native';

import { AppCard } from '@/components/AppCard';
import { AppText } from '@/components/AppText';
import { StatusBadge } from '@/components/StatusBadge';
import { colors, commonStyles, spacing, typography } from '@/theme';

export type ErrandStatus =
  | 'pending'
  | 'requested'
  | 'assigned'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type ErrandCardProps = {
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
  const formattedFee =
    typeof fee === 'number'
      ? `R${fee.toFixed(2)}`
      : fee.trim();

  return (
    <AppCard>
      <View style={styles.container}>
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
            {location || 'Location not provided'}
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
            {formattedFee || 'Not specified'}
          </AppText>
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },

  title: {
    flex: 1,
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
    gap: spacing.md,
  },

  fee: {
    color: colors.primary,
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
});