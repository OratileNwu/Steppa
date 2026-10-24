export type AccountRole = "Customer" | "Steppa";

export interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    phoneNumber: string;
    role: AccountRole;
    photoURL?: string;
    createdAt?: string;
}