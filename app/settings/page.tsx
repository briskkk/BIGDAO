import { SettingsClient } from "@/components/settings/settings-client";
import { getWealthRepository } from "@/lib/repository";

export default async function SettingsPage() {
  return <SettingsClient repo={await getWealthRepository()} />;
}
