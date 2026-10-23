
import { StyleSheet } from "react-native";

/**
 * STEPPA DESIGN SYSTEM
 * Brand: Your Neighbourhood. On the Move.
 *
 * All team members should use these shared tokens.
 * Avoid hardcoding colours, spacing or radii in individual screens.
 */

export const colors = {
  primary: "#176B45",
  primaryDark: "#115536",
  primaryLight: "#E8F5EC",

  background: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceMuted: "#F9FAFB",

  text: "#1F2937",
  textSecondary: "#6B7280",
  textOnPrimary: "#FFFFFF",

  border: "#E5E7EB",
  inputBackground: "#FFFFFF",

  error: "#B42318",
  errorBackground: "#FEF3F2",

  success: "#176B45",
  successBackground: "#E8F5EC",

  warning: "#92400E",
  warningBackground: "#FEF3C7",

  info: "#1D4ED8",
  infoBackground: "#DBEAFE",

  disabled: "#D1D5DB",
  disabledText: "#6B7280",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  caption: 12,
  small: 14,
  body: 16,
  subtitle: 18,
  heading: 24,
  title: 30,
} as const;

export const dimensions = {
  buttonHeight: 52,
  inputHeight: 52,
  iconButtonSize: 44,
  borderWidth: 1,
} as const;

/**
 * Shared styles for common screen layouts and components.
 * Import these into screens instead of duplicating styles.
 */
export const commonStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  screenContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },

  section: {
    gap: spacing.sm,
  },

  heading: {
    fontSize: typography.heading,
    fontWeight: "700",
    color: colors.text,
  },

  title: {
    fontSize: typography.title,
    fontWeight: "700",
    color: colors.text,
  },

  bodyText: {
    fontSize: typography.body,
    lineHeight: 24,
    color: colors.text,
  },

  secondaryText: {
    fontSize: typography.small,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  card: {
    backgroundColor: colors.surface,
    borderWidth: dimensions.borderWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },

  primaryButton: {
    minHeight: dimensions.buttonHeight,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    color: colors.textOnPrimary,
    fontSize: typography.body,
    fontWeight: "600",
  },

  secondaryButton: {
    minHeight: dimensions.buttonHeight,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primaryLight,
    borderWidth: dimensions.borderWidth,
    borderColor: colors.primaryLight,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: "600",
  },

  input: {
    minHeight: dimensions.inputHeight,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.inputBackground,
    borderWidth: dimensions.borderWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: typography.body,
  },

  errorText: {
    color: colors.error,
    fontSize: typography.small,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
});

/**
 * Standard errand statuses.
 * Use the same colours and labels across customer and runner screens.
 */
export const statusStyles = {
  requested: {
    backgroundColor: colors.infoBackground,
    color: colors.info,
    label: "Requested",
  },
  accepted: {
    backgroundColor: colors.primaryLight,
    color: colors.primary,
    label: "Accepted",
  },
  in_progress: {
    backgroundColor: colors.warningBackground,
    color: colors.warning,
    label: "In progress",
  },
  completed: {
    backgroundColor: colors.successBackground,
    color: colors.success,
    label: "Completed",
  },
  cancelled: {
    backgroundColor: colors.errorBackground,
    color: colors.error,
    label: "Cancelled",
  },
} as const;
