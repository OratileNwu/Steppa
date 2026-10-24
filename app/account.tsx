
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { useRouter } from "expo-router";

import { AppText } from "../src/components/AppText";
import { AppCard } from "../src/components/AppCard";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { ScreenContainer } from "../src/components/ScreenContainer";
import {
    colors,
    spacing,
    radius,
    commonStyles,
} from "../src/theme";

import type { UserProfile } from "../src/types/profile";
import { getProfile } from "../src/services/profileService";

export default function AccountScreen() {
    const router = useRouter();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProfile() {
            try {
                const userProfile = await getProfile();
                setProfile(userProfile);
            } catch {
                Alert.alert("Error", "Could not load your profile.");
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, []);

    if (loading) {
        return (
            <ScreenContainer centered>
                <ActivityIndicator size="large" color={colors.primary} />
                <AppText variant="secondary">
                    Loading your account...
                </AppText>
            </ScreenContainer>
        );
    }

    if (!profile) {
        return (
            <ScreenContainer centered>
                <AppText variant="heading">
                    Unable to load your account
                </AppText>
                <AppText variant="secondary">
                    Please try again later.
                </AppText>
                <PrimaryButton
                    title="Back"
                    onPress={() => router.back()}
                />
            </ScreenContainer>
        );
    }

    const isSteppa = profile.role === "steppa";
    const initial = profile.displayName.trim().charAt(0).toUpperCase();

    return (
        <ScreenContainer padded={false}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                <View style={styles.header}>
                    <AppText variant="title">My Account</AppText>
                    <AppText variant="secondary">
                        Manage your STEPPA profile and settings.
                    </AppText>
                </View>

                <AppCard>
                    <View style={styles.profileHeader}>
                        <View style={styles.avatar}>
                            <AppText style={styles.avatarText}>
                                {initial || "S"}
                            </AppText>
                        </View>

                        <AppText variant="heading">
                            {profile.displayName}
                        </AppText>

                        <AppText variant="secondary">
                            {profile.email}
                        </AppText>

                        <View style={styles.roleBadge}>
                            <AppText style={styles.roleText}>
                                {isSteppa ? "Steppa" : "Customer"}
                            </AppText>
                        </View>
                    </View>

                    <PrimaryButton
                        title="Edit Profile"
                        onPress={() => router.push("/edit-profile")}
                    />
                </AppCard>

                <AppText variant="heading">Account</AppText>

                <MenuItem
                    title="Personal Information"
                    subtitle="Update your name and phone number"
                    onPress={() => router.push("/edit-profile")}
                />

                <MenuItem
                    title="Account Settings"
                    subtitle="Manage your preferences and security"
                    onPress={() => router.push("/account-settings")}
                />

                {isSteppa && (
                    <>
                        <AppText variant="heading">Steppa Tools</AppText>

                        <MenuItem
                            title="SafeStep"
                            subtitle="Access your safety features"
                            onPress={() =>
                                Alert.alert(
                                    "SafeStep",
                                    "SafeStep functionality will be added later."
                                )
                            }
                        />
                    </>
                )}

                <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                        Alert.alert(
                            "Log Out",
                            "Logout will be connected to Firebase Authentication later."
                        )
                    }
                    style={({ pressed }) => [
                        styles.logout,
                        pressed && styles.pressed,
                    ]}
                >
                    <AppText style={styles.logoutText}>Log Out</AppText>
                </Pressable>

                <AppText variant="small" style={styles.footer}>
                    STEPPA · Your Neighbourhood. On the Move.
                </AppText>
            </ScrollView>
        </ScreenContainer>
    );
}

type MenuItemProps = {
    title: string;
    subtitle: string;
    onPress: () => void;
};

function MenuItem({ title, subtitle, onPress }: MenuItemProps) {
    return (
        <Pressable
            accessibilityRole="button"
            onPress={onPress}
            style={({ pressed }) => [
                commonStyles.card,
                styles.menuItem,
                pressed && styles.pressed,
            ]}
        >
            <View style={styles.menuText}>
                <AppText>{title}</AppText>
                <AppText variant="secondary">{subtitle}</AppText>
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
    profileHeader: {
        alignItems: "center",
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: radius.pill,
        backgroundColor: colors.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.xs,
    },
    avatarText: {
        fontSize: 28,
        fontWeight: "700",
        color: colors.primary,
    },
    roleBadge: {
        alignSelf: "center",
        borderRadius: radius.pill,
        backgroundColor: colors.primaryLight,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        marginTop: spacing.xs,
    },
    roleText: {
        color: colors.primary,
        fontWeight: "600",
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
    },
    menuText: {
        flex: 1,
        gap: spacing.xs,
    },
    arrow: {
        color: colors.primary,
        fontSize: 26,
    },
    pressed: {
        opacity: 0.7,
    },
    logout: {
        alignItems: "center",
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.errorBackground,
    },
    logoutText: {
        color: colors.error,
        fontWeight: "600",
    },
    footer: {
        color: colors.textSecondary,
        textAlign: "center",
        marginTop: spacing.sm,
    },
});
