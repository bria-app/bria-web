import { redirect } from "next/navigation";

/** Old run links open the run on the forecast screen. */
export default async function ForecastRunDetailPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  redirect(`/forecasting?run=${encodeURIComponent(runId)}`);
}
