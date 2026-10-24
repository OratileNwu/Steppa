export type AccountRole = "customer" | "steppa";

export interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    phoneNumber: string;
    role: AccountRole;
    photoURL?: string;
    createdAt?: string;
}