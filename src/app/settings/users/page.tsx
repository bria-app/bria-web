import { SettingsScreen } from "@/features/settings/SettingsScreen";

/** Old link to the users screen: same settings screen, opened on «Equipo y permisos». */
export default function SettingsUsersPage() {
  return <SettingsScreen initial="equipo" />;
}
