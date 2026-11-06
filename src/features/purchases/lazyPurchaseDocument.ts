import dynamic from "next/dynamic";
import { DialogLoading } from "@/components/ui/lazyDialog";

/** The purchase document dialog, downloaded the first time someone opens a purchase. */
export const PurchaseDocumentModal = dynamic(() => import("./PurchaseDocumentModal").then((m) => m.PurchaseDocumentModal), {
  ssr: false,
  loading: DialogLoading,
});
