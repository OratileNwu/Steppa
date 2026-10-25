
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import type { CreateErrandInput } from "@/components/errands/CreateErrandForm";
import type { QueueRequest } from "@/components/dashboards/StepperDashboard";

function requireSignedInUser() {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured yet.");
  }

  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please sign in before submitting a request.");
  }

  return user;
}

export async function submitErrand(input: CreateErrandInput) {
  console.info("[Steppa] Starting errand submission.");

  try {
    const user = requireSignedInUser();
    console.info("[Steppa] Signed-in user confirmed.");

    const reference = await addDoc(collection(db, "errands"), {
      ...input,
      customerId: user.uid,
      status: "pending",
      offerStatus: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      runnerId: null,
    });

    console.info("[Steppa] Errand saved successfully:", reference.id);
    return reference.id;
  } catch (error) {
    console.error("[Steppa] Errand submission failed:", error);
    throw error;
  }
}

export async function submitQueueRequest(input: QueueRequest) {
  console.info("[Steppa] Starting queue submission.");

  try {
    const user = requireSignedInUser();

    const reference = await addDoc(collection(db, "errands"), {
      category: "queue",
      title: `Queue request: ${input.purpose}`,
      description: input.instructions,
      queueLocation: input.location,
      serviceNeeded: input.purpose,
      customerId: user.uid,
      status: "pending",
      offerStatus: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      runnerId: null,   
    });

    console.info("[Steppa] Queue request saved successfully:", reference.id);
    return reference.id;
  } catch (error) {
    console.error("[Steppa] Queue submission failed:", error);
    throw error;
  }
}
