
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, commonStyles, spacing } from '@/theme';

type PrimaryButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  loading?: boolean;
  fullWidth?: boolean;
};

export function PrimaryButton({
  title,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  accessibilityLabel,
  ...props
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={(state) => {
        const externalStyle =
          typeof style === 'function' ? style(state) : style;

        return [
          commonStyles.primaryButton,
          styles.button,
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          state.pressed && !isDisabled && styles.pressed,
          externalStyle as StyleProp<ViewStyle>,
        ];
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors.textOnPrimary} />
      ) : (
        <AppText style={styles.label}>{title}</AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    backgroundColor: colors.disabled,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
});
