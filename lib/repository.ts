import { MockWealthRepository } from "@/lib/repository/mock.repository";
import { SupabaseWealthRepository } from "@/lib/repository/supabase.repository";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function getWealthRepository() {
  const repository = hasSupabaseEnv() ? new SupabaseWealthRepository() : new MockWealthRepository();
  return repository.getData();
}

export type { WealthRepositoryData } from "@/lib/repository/repository.interface";
