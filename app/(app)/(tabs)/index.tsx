import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import StepperDashboard, {
  type StepperErrand,
} from "@/components/dashboards/StepperDashboard";
import { auth, db } from "@/lib/firebase";
import { submitQueueRequest } from "@/services/errandService";

const ACTIVE_STATUSES = new Set([
  "requested",
  "pending",
  "accepted",
  "assigned",
  "in_progress",
  "awaiting_customer_confirmation",
  "completion_disputed",
]);

function toDashboardErrand(item: Record<string, any> & { id: string }): StepperErrand {
  const rawCategory = String(item.category ?? "");
  const category: StepperErrand["category"] = /grocer/i.test(rawCategory)
    ? "groceries"
    : /parcel|pickup|collection/i.test(rawCategory)
      ? "parcel"
      : /queue/i.test(rawCategory)
        ? "queue"
        : "other";

  const status = String(item.status ?? "requested");
  const dashboardStatus = status === "pending" || status === "assigned"
    ? status === "pending" ? "requested" : "accepted"
    : status;

  return {
    id: item.id,
    category,
    title: String(item.title ?? `${rawCategory || "Your"} errand`),
    description: String(item.description ?? ""),
    status: dashboardStatus as StepperErrand["status"],
    estimatedFee: Number(item.agreedFee ?? item.offeredFee ?? item.recommendedFee ?? item.fee ?? 0),
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const [activeErrand, setActiveErrand] = useState<StepperErrand | null>(null);
  const [errandLoading, setErrandLoading] = useState(true);
  const [completedErrandsCount, setCompletedErrandsCount] = useState(0);

  useEffect(() => {
    let stopErrands: (() => void) | undefined;

    // Wait for Firebase Auth to restore the session before querying.
    const stopAuth = onAuthStateChanged(auth, (user) => {
      stopErrands?.();
      stopErrands = undefined;
      setActiveErrand(null);

      if (!user) {
        setCompletedErrandsCount(0);
        setErrandLoading(false);
        return;
      }

      setErrandLoading(true);
      const customerQuery = query(
        collection(db, "errands"),
        where("customerId", "==", user.uid),
      );

      stopErrands = onSnapshot(
        customerQuery,
        (snapshot) => {
          const customerErrands = snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          }));
          setCompletedErrandsCount(
            customerErrands.filter((item) => String(item.status) === "completed").length,
          );

          const active = customerErrands
            .filter((item) => ACTIVE_STATUSES.has(String(item.status)))
            .sort((a, b) => {
              const aTime = (a.createdAt as any)?.toMillis?.() ?? 0;
              const bTime = (b.createdAt as any)?.toMillis?.() ?? 0;
              return bTime - aTime;
            });

          setActiveErrand(active.length
            ? toDashboardErrand(active[0] as Record<string, any> & { id: string })
            : null);
          setErrandLoading(false);
        },
        (error) => {
          console.error("[Steppa] Could not load active customer errand:", error);
          setActiveErrand(null);
          setCompletedErrandsCount(0);
          setErrandLoading(false);
        },
      );
    });

    return () => {
      stopAuth();
      stopErrands?.();
    };
  }, []);

  return (
    <StepperDashboard
      onOpenProfile={() => router.push("/account")}
      onRequestErrand={() => router.push("/create-errand")}
      onOpenWallet={() => router.push("/runner-wallet")}
      activeErrand={activeErrand}
      loading={errandLoading}
      completedErrandsCount={completedErrandsCount}
      onOpenErrand={(id) =>
        router.push({
          pathname: "/customer-errand-details",
          params: { id },
        })
      }
      onViewAllErrands={() => router.push("/(app)/my-errands")}
      onSubmitQueue={async (request) => {
        await submitQueueRequest(request);
      }}
    />
  );
}
