
import {
    Text,
    type TextProps,
    StyleSheet,
} from "react-native";

import {
    colors,
    commonStyles,
    typography,
} from "../theme";

type AppTextVariant =
    | "title"
    | "heading"
    | "body"
    | "secondary"
    | "small"
    | "error";

type AppTextProps = TextProps & {
    variant?: AppTextVariant;
};

export function AppText({
    variant = "body",
    style,
    ...props
}: AppTextProps) {
    return (
        <Text
            {...props}
            style={[
                styles.base,
                variant === "title" && commonStyles.title,
                variant === "heading" && commonStyles.heading,
                variant === "body" && commonStyles.bodyText,
                variant === "secondary" && commonStyles.secondaryText,
                variant === "small" && styles.small,
                variant === "error" && styles.error,
                style,
            ]}
        />
    );
}

const styles = StyleSheet.create({
    base: {
        color: colors.text,
    },
    small: {
        fontSize: typography.caption,
        color: colors.textSecondary,
    },
    error: {
        ...commonStyles.errorText,
    },
});
