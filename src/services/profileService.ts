
import type { UserProfile } from "../types/profile";

// Temporary profile data for development.
// We will connect this service to Firebase later.
const mockProfile: UserProfile = {
    uid: "demo-user-001",
    displayName: "STEPPA User",
    email: "user@example.com",
    phoneNumber: "",
    role: "customer",
};

export async function getProfile(): Promise<UserProfile> {
    return mockProfile;
}

export async function updateProfile(
    updates: Partial<
        Pick<UserProfile, "displayName" | "phoneNumber" | "photoURL">
    >
): Promise<UserProfile> {
    Object.assign(mockProfile, updates);
    return mockProfile;
}
