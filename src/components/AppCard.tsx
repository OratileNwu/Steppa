
import {
  View,
  StyleSheet,
  type ViewProps,
} from 'react-native';

import { commonStyles, spacing } from '@/theme';

type AppCardProps = ViewProps & {
  padded?: boolean;
};

export function AppCard({
  children,
  padded = true,
  style,
  ...props
}: AppCardProps) {
  return (
    <View
      {...props}
      style={[
        commonStyles.card,
        !padded && styles.noPadding,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  noPadding: {
    padding: 0,
    gap: 0,
  },
});
