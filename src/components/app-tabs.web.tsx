import {
  TabList,
  Tabs,
  TabSlot,
  TabTrigger,
  type TabListProps,
  type TabTriggerSlotProps,
} from "expo-router/ui";
import { SymbolView } from "expo-symbols";
import { forwardRef, type ComponentRef } from "react";
import {
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

import {
  Colors,
  MaxContentWidth,
  Spacing,
} from "@/constants/theme";

import { ExternalLink } from "./external-link";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />

      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>

          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton>Explore</TabButton>
          </TabTrigger>

          <TabTrigger name="account" href="/account" asChild>
            <TabButton>Account</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export const TabButton = forwardRef<
  ComponentRef<typeof Pressable>,
  Omit<TabTriggerSlotProps, "ref">
>(function TabButton(
  { children, isFocused, ...props },
  ref,
) {
  return (
    <Pressable
      {...props}
      ref={ref}
      style={({ pressed }) =>
        pressed ? styles.pressed : undefined
      }
    >
      <ThemedView
        type={
          isFocused
            ? "backgroundSelected"
            : "backgroundElement"
        }
        style={styles.tabButtonView}
      >
        <ThemedText
          type="small"
          themeColor={isFocused ? "text" : "textSecondary"}
        >
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
});

export function CustomTabList({
  children,
  style,
  ...props
}: TabListProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  return (
    <View
      {...props}
      style={[styles.tabListContainer, style]}
    >
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

        {children}

        <ExternalLink href="https://docs.expo.dev" asChild>
          <Pressable style={styles.externalPressable}>
            <ThemedText type="link">Docs</ThemedText>

            <SymbolView
              tintColor={colors.text}
              name={{
                ios: "arrow.up.right.square",
                web: "link",
              }}
              size={12}
            />
          </Pressable>
        </ExternalLink>
        <ThemedText type="small" themeColor="textSecondary">
          Your Neighbourhood. On the Move.
        </ThemedText>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    width: "100%",
    padding: Spacing.three,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },

  brandText: {
    marginRight: "auto",
  },

  pressed: {
    opacity: 0.7,
  },

  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },

  externalPressable: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.one,
    marginLeft: Spacing.three,
  },
});

