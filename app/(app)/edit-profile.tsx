
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { Stack, useRouter } from "expo-router";

import { AppText } from "@/components/AppText";
import { AppCard } from "@/components/AppCard";
import { AppTextInput } from "@/components/AppTextInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { colors, spacing, radius } from "@/theme";

import {
    getProfile,
    updateProfile,
} from "@/services/profileService";

export default function EditProfileScreen() {
    const router = useRouter();

    const [displayName, setDisplayName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadProfile() {
            try {
                const profile = await getProfile();
                setDisplayName(profile.displayName);
                setPhoneNumber(profile.phoneNumber);
            } catch {
                Alert.alert("Error", "Could not load your profile.");
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, []);

    async function handleSave() {
        const trimmedName = displayName.trim();
        const trimmedPhone = phoneNumber.trim();

        if (!trimmedName) {
            Alert.alert("Missing name", "Please enter your name.");
            return;
        }

        if (trimmedName.length > 60) {
            Alert.alert(
                "Invalid name",
                "Your name must be 60 characters or fewer."
            );
            return;
        }

        setSaving(true);

        try {
            await updateProfile({
                displayName: trimmedName,
                phoneNumber: trimmedPhone,
            });

            Alert.alert(
                "Success",
                "Your profile has been updated.",
                [{ text: "OK", onPress: () => router.back() }]
            );
        } catch {
            Alert.alert("Error", "Could not save your profile.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <>
                <Stack.Screen options={{ title: "Edit Profile" }} />
                <ScreenContainer centered>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <AppText variant="secondary">Loading profile...</AppText>
                </ScreenContainer>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ title: "Edit Profile" }} />

            <ScreenContainer padded={false}>
                <KeyboardAvoidingView
                    style={styles.keyboard}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                    <ScrollView
                        contentContainerStyle={styles.content}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.header}>
                            <AppText variant="title">Edit Profile</AppText>
                            <AppText variant="secondary">
                                Keep your STEPPA details up to date.
                            </AppText>
                        </View>

                        <AppCard>
                            <AppTextInput
                                label="Display name"
                                value={displayName}
                                onChangeText={setDisplayName}
                                placeholder="Enter your name"
                                autoCapitalize="words"
                                maxLength={60}
                                editable={!saving}
                            />

                            <AppTextInput
                                label="Phone number"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                placeholder="Enter your phone number"
                                keyboardType="phone-pad"
                                maxLength={20}
                                editable={!saving}
                            />

                            <View style={styles.buttonGroup}>
                                <PrimaryButton
                                    title="Save Changes"
                                    onPress={handleSave}
                                    loading={saving}
                                    disabled={saving}
                                />

                                <PrimaryButton
                                    title="Cancel"
                                    onPress={() => router.back()}
                                    disabled={saving}
                                    style={styles.cancelButton}
                                />
                            </View>
                        </AppCard>
                    </ScrollView>
                </KeyboardAvoidingView>
            </ScreenContainer>
        </>
    );
}

const styles = StyleSheet.create({
    keyboard: {
        flex: 1,
    },
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
    buttonGroup: {
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    cancelButton: {
        backgroundColor: colors.primaryLight,
        borderWidth: 1,
        borderColor: colors.primaryLight,
    },
});
