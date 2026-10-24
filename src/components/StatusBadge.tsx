
import { View, StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { radius, spacing, statusStyles, typography } from '@/theme';

type ErrandStatus = keyof typeof statusStyles;

type StatusBadgeProps = {
  status: ErrandStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusStyles[status];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.backgroundColor },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Errand status: ${config.label}`}
    >
      <AppText
        style={[
          styles.text,
          { color: config.color },
        ]}
      >
        {config.label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  text: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
});
