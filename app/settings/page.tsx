import { SettingsClient } from "@/components/settings/settings-client";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default async function SettingsPage() {
  return <SettingsClient mode={hasSupabaseEnv() ? "supabase" : "demo"} />;
}
