import { useRouter } from "expo-router";

import StepperDashboard from "@/components/dashboards/StepperDashboard";

export default function HomeScreen() {
    const router = useRouter();

    return (
        <StepperDashboard
            onOpenProfile={() => router.push("/account")}
            onRequestErrand={() => router.push("/create-errand")}
        />
    );
}
