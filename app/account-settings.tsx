
import { useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    View,
} from "react-native";
import { Stack, useRouter } from "expo-router";

import { AppText } from "../src/components/AppText";
import { AppCard } from "../src/components/AppCard";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { colors, spacing, radius } from "../src/theme";

export default function AccountSettingsScreen() {
    const router = useRouter();

    const [notificationsEnabled, setNotificationsEnabled] =
        useState(true);

    function handlePasswordReset() {
        Alert.alert(
            "Change Password",
            "Password reset will be available when Firebase Authentication is connected."
        );
    }

    function handlePrivacy() {
        Alert.alert(
            "Privacy Information",
            "STEPPA's privacy information will be displayed here once finalised."
        );
    }

    function handleDeleteAccount() {
        Alert.alert(
            "Delete Account",
            "Account deletion is not available yet. Please contact the STEPPA team for assistance."
        );
    }

    return (
        <>
            <Stack.Screen options={{ title: "Account Settings" }} />

            <ScreenContainer padded={false}>
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <AppText variant="title">Account Settings</AppText>
                        <AppText variant="secondary">
                            Manage your preferences and account security.
                        </AppText>
                    </View>

                    <AppText variant="heading">Preferences</AppText>

                    <AppCard>
                        <View style={styles.settingRow}>
                            <View style={styles.settingText}>
                                <AppText>Notifications</AppText>
                                <AppText variant="secondary">
                                    Enable or disable your notification preference.
                                </AppText>
                            </View>

                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                                trackColor={{
                                    false: colors.border,
                                    true: colors.primaryLight,
                                }}
                                thumbColor={
                                    notificationsEnabled
                                        ? colors.primary
                                        : colors.disabled
                                }
                                accessibilityLabel="Enable notifications"
                            />
                        </View>
                    </AppCard>

                    <AppText variant="heading">Security and Privacy</AppText>

                    <AppCard>
                        <SettingItem
                            title="Change Password"
                            description="Manage your login credentials."
                            onPress={handlePasswordReset}
                        />

                        <View style={styles.divider} />

                        <SettingItem
                            title="Privacy Information"
                            description="Learn how your information is handled."
                            onPress={handlePrivacy}
                        />
                    </AppCard>

                    <AppText variant="heading">Account Management</AppText>

                    <AppCard>
                        <SettingItem
                            title="Delete Account"
                            description="Request removal of your STEPPA account."
                            destructive
                            onPress={handleDeleteAccount}
                        />
                    </AppCard>

                    <PrimaryButton
                        title="Back to Account"
                        onPress={() => router.back()}
                    />

                    <AppText variant="small" style={styles.footer}>
                        STEPPA · Your Neighbourhood. On the Move.
                    </AppText>
                </ScrollView>
            </ScreenContainer>
        </>
    );
}

type SettingItemProps = {
    title: string;
    description: string;
    destructive?: boolean;
    onPress: () => void;
};

function SettingItem({
    title,
    description,
    destructive = false,
    onPress,
}: SettingItemProps) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${title}. ${description}`}
            onPress={onPress}
            style={({ pressed }) => [
                styles.settingItem,
                pressed && styles.pressed,
            ]}
        >
            <View style={styles.settingText}>
                <AppText
                    style={destructive ? styles.destructiveTitle : undefined}
                >
                    {title}
                </AppText>

                <AppText variant="secondary">{description}</AppText>
            </View>

            <AppText style={styles.arrow}>›</AppText>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.lg,
        paddingBottom: spacing.xl,
        gap: spacing.md,
    },
    header: {
        gap: spacing.xs,
        marginBottom: spacing.sm,
    },
    settingRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
    },
    settingText: {
        flex: 1,
        gap: spacing.xs,
    },
    settingItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.sm,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.sm,
    },
    arrow: {
        color: colors.primary,
        fontSize: 24,
    },
    destructiveTitle: {
        color: colors.error,
        fontWeight: "600",
    },
    pressed: {
        opacity: 0.7,
    },
    footer: {
        color: colors.textSecondary,
        textAlign: "center",
        marginTop: spacing.sm,
    },
});
