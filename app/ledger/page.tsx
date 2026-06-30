import { LedgerClient } from "@/components/ledger/ledger-client";
import { getWealthRepository } from "@/lib/repository";

export default async function LedgerPage() {
  return <LedgerClient repo={await getWealthRepository()} />;
}
