
import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";

import { auth, db, isFirebaseConfigured } from "@/lib/firebase";

export type ErrandRating = {
    errandId: string;
    targetUserId: string;
    raterUserId: string;
    rating: number;
    review: string;
    createdAt?: unknown;
};

function requireSignedInUser() {
    if (!isFirebaseConfigured) {
        throw new Error("Firebase is not configured.");
    }

    const user = auth.currentUser;

    if (!user) {
        throw new Error("Please sign in first.");
    }

    return user;
}

/**
 * Save one rating from a participant for a completed errand.
 *
 * Each recipient has one rating document per errand:
 * publicProfiles/{targetUserId}/ratings/{errandId}
 *
 * Firestore rules must enforce participant permissions and
 * reject edits to an existing rating before this is used live.
 */
export async function submitErrandRating(
    errandId: string,
    targetUserId: string,
    rating: number,
    review: string,
): Promise<void> {
    const user = requireSignedInUser();

    if (!errandId.trim() || !targetUserId.trim()) {
        throw new Error("The errand or rating recipient is missing.");
    }

    if (
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
    ) {
        throw new Error("Choose a rating from 1 to 5 stars.");
    }

    const cleanReview = review.trim();

    if (cleanReview.length > 500) {
        throw new Error("Your review must be 500 characters or fewer.");
    }

    if (targetUserId === user.uid) {
        throw new Error("You cannot rate your own account.");
    }

    const errandRef = doc(db, "errands", errandId);
    const errandSnapshot = await getDoc(errandRef);

    if (!errandSnapshot.exists()) {
        throw new Error("This errand could not be found.");
    }

    const errand = errandSnapshot.data();
    const runnerId = errand.assignedRunnerId ?? errand.runnerId;

    if (errand.status !== "completed") {
        throw new Error("You can only rate a completed errand.");
    }

    const isCustomerRatingRunner =
        errand.customerId === user.uid &&
        runnerId === targetUserId;

    const isRunnerRatingCustomer =
        runnerId === user.uid &&
        errand.customerId === targetUserId;

    if (!isCustomerRatingRunner && !isRunnerRatingCustomer) {
        throw new Error(
            "Only the customer and assigned Steppa can rate each other.",
        );
    }

    const ratingRef = doc(
        db,
        "publicProfiles",
        targetUserId,
        "ratings",
        errandId,
    );

    await setDoc(ratingRef, {
        errandId,
        targetUserId,
        raterUserId: user.uid,
        rating,
        review: cleanReview,
        createdAt: serverTimestamp(),
    });
}
