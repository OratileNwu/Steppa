import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import StepperDashboard, { type StepperErrand } from "@/components/dashboards/StepperDashboard";
import { auth, db } from "@/lib/firebase";
import { submitQueueRequest } from "@/services/errandService";

export default function HomeScreen() {
  const router = useRouter();
  const [activeErrand, setActiveErrand] = useState<StepperErrand | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { setActiveErrand(null); return; }
    return onSnapshot(query(collection(db, "errands"), where("customerId", "==", user.uid)), (snapshot) => {
      const docs = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
        .filter((item) => ["accepted", "assigned", "in_progress", "awaiting_customer_confirmation", "completion_disputed"].includes(String(item.status)))
        .sort((a, b) => ((b.createdAt as any)?.toMillis?.() ?? 0) - ((a.createdAt as any)?.toMillis?.() ?? 0));
      const item = docs[0] as any;
      if (!item) { setActiveErrand(null); return; }
      const category = /grocer/i.test(String(item.category)) ? "groceries"
        : /parcel|pickup|collection/i.test(String(item.category)) ? "parcel"
        : /queue/i.test(String(item.category)) ? "queue" : "other";
      setActiveErrand({ id: item.id, category, title: String(item.title ?? "Your errand"),
        description: String(item.description ?? ""), status: item.status,
        estimatedFee: Number(item.agreedFee ?? item.offeredFee ?? item.fee ?? 0) });
    }, (error) => console.error("[Steppa] Could not load active customer errand:", error));
  }, []);

  return (
    <StepperDashboard
      onOpenProfile={() => router.push("/account")}
      onRequestErrand={() => router.push("/create-errand")}
      onOpenWallet={() => router.push("/runner-wallet")}
      activeErrand={activeErrand}
      onOpenErrand={(id) => router.push({ pathname: "/customer-errand-details", params: { id } })}
      onViewAllErrands={() => router.push("/my-errands")}
      onSubmitQueue={async (request) => {
        await submitQueueRequest(request);
      }}
    />
  );
}
