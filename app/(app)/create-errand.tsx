
import { useRouter } from "expo-router";
import CreateErrandForm from "@/components/errands/CreateErrandForm";
import { submitErrand } from "@/services/errandService";

export default function CreateErrandScreen() {
  const router = useRouter();

  return (
    <CreateErrandForm
      onSubmit={async (errand) => {
        try {
          const id = await submitErrand(errand);

          router.replace({
            pathname: "/errand-confirmation",
            params: { id },
          });
        } catch (error) {
          console.error("Steppa errand submission failed:", error);
          throw error;
        }
      }}
    />
  );
}
