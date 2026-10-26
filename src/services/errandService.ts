import { addDoc, collection, doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import type { CreateErrandInput } from "@/components/errands/CreateErrandForm";
import type { QueueRequest } from "@/components/dashboards/StepperDashboard";

function userOrThrow() {
  if (!isFirebaseConfigured) throw new Error("Firebase is not configured.");
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in first.");
  return user;
}
function text(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required.`);
  return value.trim();
}
function fee(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new Error("Enter a valid fee.");
  return Math.round(n * 100) / 100;
}
function assertAvailable(data: any) {
  // Supports old pending documents during transition; new records use requested.
  if (!["requested", "pending"].includes(data.status) || data.runnerId != null || data.assignedRunnerId != null) {
    throw new Error("This errand is no longer available.");
  }
}

export async function submitErrand(input: CreateErrandInput): Promise<string> {
  const user = userOrThrow();
  const description = text(input.description, "Errand description");
  const recommendedFee = fee(input.recommendedFee);
  const offeredFee = fee(input.offeredFee);
  const ref = await addDoc(collection(db, "errands"), {
    ...input, title: `${input.category} request`, description,
    recommendedFee, offeredFee, fee: offeredFee,
    customerId: user.uid, status: "requested", runnerId: null,
    assignedRunnerId: null, offerStatus: "pending", counterOffer: null,
    statusTimes: { requested: new Date().toISOString() },
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function submitQueueRequest(input: QueueRequest): Promise<string> {
  const user = userOrThrow();
  const purpose = text(input.purpose, "Queue request purpose");
  const instructions = text(input.instructions, "Queue instructions");
  const location = text(input.location, "Queue location");
  const ref = await addDoc(collection(db, "errands"), {
    category: "Queue for me", categoryKey: "queue",
    title: `Queue request: ${purpose}`, description: instructions,
    queueLocation: location, serviceNeeded: purpose, customerId: user.uid,
    status: "requested", runnerId: null, assignedRunnerId: null,
    offerStatus: "pending", counterOffer: null,
    statusTimes: { requested: new Date().toISOString() },
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function acceptErrand(id: string): Promise<void> {
  const user = userOrThrow(), ref = doc(db, "errands", id);
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Errand not found.");
    const data = snap.data(); assertAvailable(data);
    const agreedFee = fee(data.offeredFee ?? data.fee ?? data.recommendedFee);
    tx.update(ref, {
      status: "accepted", runnerId: user.uid, assignedRunnerId: user.uid,
      agreedFee, offerStatus: "accepted",
      statusTimes: { ...(data.statusTimes ?? {}), accepted: new Date().toISOString() },
      updatedAt: serverTimestamp(),
    });
  });
}

export async function submitRunnerCounterOffer(id: string, amount: number): Promise<void> {
  const user = userOrThrow(), ref = doc(db, "errands", id), offerFee = fee(amount);
  if (offerFee < 30) throw new Error("Counter-offers must be at least R30.");
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Errand not found.");
    const data = snap.data(); assertAvailable(data);
    if (data.counterOffer?.status === "pending") throw new Error("A counter-offer is already pending.");
    tx.update(ref, {
      counterOffer: { amount: offerFee, runnerId: user.uid, status: "pending", createdAt: serverTimestamp() },
      updatedAt: serverTimestamp(),
    });
  });
}

export async function startErrand(id: string): Promise<void> {
  const user = userOrThrow(), ref = doc(db, "errands", id);
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Errand not found.");
    const data = snap.data();
    if (data.runnerId !== user.uid || data.status !== "accepted") throw new Error("Only the assigned runner can start an accepted errand.");
    tx.update(ref, { status: "in_progress", statusTimes: { ...(data.statusTimes ?? {}), in_progress: new Date().toISOString() }, updatedAt: serverTimestamp() });
  });
}

export async function completeErrand(id: string): Promise<void> {
  const user = userOrThrow(), ref = doc(db, "errands", id);
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Errand not found.");
    const data = snap.data();
    if ((data.runnerId ?? data.assignedRunnerId) !== user.uid || data.status !== "in_progress") throw new Error("Only the assigned runner can report completion for an in-progress errand.");
    tx.update(ref, { status: "awaiting_customer_confirmation", completionReportedBy: user.uid, completionReportedAt: serverTimestamp(), statusTimes: { ...(data.statusTimes ?? {}), awaiting_customer_confirmation: serverTimestamp() }, updatedAt: serverTimestamp() });
  });
}

export async function confirmErrandCompletion(id: string, confirmed: boolean): Promise<void> {
  const user = userOrThrow(), ref = doc(db, "errands", id);
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Errand not found.");
    const data = snap.data();
    if (data.customerId !== user.uid) throw new Error("Only the customer who requested this errand can respond.");
    if (data.status !== "awaiting_customer_confirmation") throw new Error("This errand is not awaiting confirmation.");
    tx.update(ref, confirmed
      ? { status: "completed", customerConfirmedCompletion: true, customerConfirmedAt: serverTimestamp(), statusTimes: { ...(data.statusTimes ?? {}), completed: serverTimestamp() }, updatedAt: serverTimestamp() }
      : { status: "completion_disputed", customerConfirmedCompletion: false, customerReportedProblemAt: serverTimestamp(), statusTimes: { ...(data.statusTimes ?? {}), completion_disputed: serverTimestamp() }, updatedAt: serverTimestamp() });
  });
}

export async function respondToCounterOffer(id: string, decision: "accept" | "decline"): Promise<void> {
  const user = userOrThrow(), ref = doc(db, "errands", id);
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Errand not found.");
    const data = snap.data(), offer = data.counterOffer;
    if (data.customerId !== user.uid) throw new Error("Only the customer can respond.");
    if (!["requested", "pending"].includes(data.status) || data.runnerId != null) throw new Error("This errand is no longer available.");
    if (!offer || offer.status !== "pending" || !offer.runnerId) throw new Error("No pending counter-offer.");
    if (decision === "decline") {
      tx.update(ref, { counterOffer: { ...offer, status: "declined" }, updatedAt: serverTimestamp() });
    } else {
      tx.update(ref, {
        status: "accepted", runnerId: offer.runnerId, assignedRunnerId: offer.runnerId,
        agreedFee: fee(offer.amount), offerStatus: "accepted",
        counterOffer: { ...offer, status: "accepted" },
        statusTimes: { ...(data.statusTimes ?? {}), accepted: new Date().toISOString() },
        updatedAt: serverTimestamp(),
      });
    }
  });
}
