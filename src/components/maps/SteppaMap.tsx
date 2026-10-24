import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";

import type { SteppaMapProps } from "./types";

export default function SteppaMap(_props: SteppaMapProps) {
  return (
    <AppCard>
      <AppText variant="heading">
        Review locations
      </AppText>

      <AppText variant="secondary">
        Open Steppa in your browser to use the live route map.
        Native phone map support will be added separately.
      </AppText>
    </AppCard>
  );
}