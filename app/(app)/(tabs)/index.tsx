import { useRouter } from "expo-router";
import StepperDashboard from "@/components/dashboards/StepperDashboard";
import { submitQueueRequest } from "@/services/errandService";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <StepperDashboard
      onOpenProfile={() => router.push("/account")}
      onRequestErrand={() => router.push("/create-errand")}
      onOpenWallet={() => router.push("/runner-wallet")}
      onViewAllErrands={() => router.push("/my-errands")}
      onSubmitQueue={async (request) => {
        await submitQueueRequest(request);
      }}
    />
  );
}
