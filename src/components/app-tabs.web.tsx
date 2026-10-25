import {
  TabList,
  Tabs,
  TabSlot,
  TabTrigger,
  type TabListProps,
  type TabTriggerSlotProps,
} from 'expo-router/ui';

import {
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';

import {
  Colors,
  MaxContentWidth,
  Spacing,
} from '@/constants/theme';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />

      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>

          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton>Explore</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  ...props
}: TabTriggerSlotProps) {
  const { ref: _ref, ...pressableProps } = props;

  return (
    <Pressable
      {...pressableProps}
      style={({ pressed }) => [
        styles.tabButton,
        pressed && styles.pressed,
      ]}
    >
      <ThemedView
        type={
          isFocused
            ? 'backgroundSelected'
            : 'backgroundElement'
        }
        style={styles.tabButtonView}
      >
        <ThemedText
          type="small"
          themeColor={
            isFocused ? 'text' : 'textSecondary'
          }
        >
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme();

  return (
    <View style={[styles.tabListContainer, props.style]}>
      <ThemedView
        type="backgroundElement"
        style={styles.innerContainer}
      >
        <ThemedText
          type="smallBold"
          style={styles.brandText}
        >
          Steppa
        </ThemedText>

        {props.children}

        <ThemedText
          type="small"
          themeColor="textSecondary"
        >
          Your Neighbourhood. On the Move.
        </ThemedText>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },

  brandText: {
    marginRight: 'auto',
  },

  tabButton: {
    borderRadius: Spacing.three,
  },

  pressed: {
    opacity: 0.7,
  },

  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});