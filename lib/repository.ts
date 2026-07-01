import { MockWealthRepository } from "@/lib/repository/mock.repository";
import { SupabaseWealthRepository } from "@/lib/repository/supabase.repository";
import type { WealthRepositoryScope } from "@/lib/repository/repository.interface";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function getWealthRepository(scope: WealthRepositoryScope = "full") {
  const repository = hasSupabaseEnv() ? new SupabaseWealthRepository(scope) : new MockWealthRepository();
  return repository.getData();
}

export type { WealthRepositoryData, WealthRepositoryScope } from "@/lib/repository/repository.interface";
