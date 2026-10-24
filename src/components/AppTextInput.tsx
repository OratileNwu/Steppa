
import { useState } from 'react';
import {
  TextInput,
  View,
  type TextInputProps,
  StyleSheet,
} from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, commonStyles, spacing } from '@/theme';

type AppTextInputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function AppTextInput({
  label,
  error,
  style,
  onFocus,
  onBlur,
  ...props
}: AppTextInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label ? <AppText variant="secondary">{label}</AppText> : null}

      <TextInput
        {...props}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        placeholderTextColor={colors.textSecondary}
        style={[
          commonStyles.input,
          focused && styles.focused,
          error && styles.invalid,
          style,
        ]}
        accessibilityLabel={props.accessibilityLabel ?? label}
        accessibilityState={{ disabled: props.editable === false }}
      />

      {error ? (
        <AppText variant="error" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  focused: {
    borderColor: colors.primary,
  },
  invalid: {
    borderColor: colors.error,
  },
});
