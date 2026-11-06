import { redirect } from "next/navigation";

/**
 * The backend's /admin routes require a «superadmin» role that does not exist, so a system
 * console could never load. Company settings live in /settings.
 */
export default function AdminPage() {
  redirect("/settings");
}
