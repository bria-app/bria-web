import { redirect } from "next/navigation";

/** «Qué comprar» is a tab of the forecast screen. */
export default function RecommendationsPage() {
  redirect("/forecasting?vista=comprar");
}
