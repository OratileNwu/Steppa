
import {
    View,
    StyleSheet,
    type ViewProps,
} from "react-native";

import { commonStyles, spacing } from "../theme";

type ScreenContainerProps = ViewProps & {
    padded?: boolean;
    centered?: boolean;
};

export function ScreenContainer({
    children,
    padded = true,
    centered = false,
    style,
    ...props
}: ScreenContainerProps) {
    return (
        <View
            {...props}
            style={[
                commonStyles.screen,
                padded && styles.content,
                centered && commonStyles.centered,
                style,
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.lg,
    },
});
