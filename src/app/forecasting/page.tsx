import { Suspense } from "react";
import { Skeleton } from "@/components/ui/DataState";
import { ForecastScreen } from "@/features/forecasting/ForecastScreen";
import { ForecastEntry } from "@/features/forecasting/horizon/ForecastIntro";

export default function ForecastingPage() {
  return (
    <ForecastEntry>
      <Suspense fallback={<Skeleton />}>
        <ForecastScreen />
      </Suspense>
    </ForecastEntry>
  );
}
