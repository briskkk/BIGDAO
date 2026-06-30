import { LedgerClient } from "@/components/ledger/ledger-client";
import { getWealthRepository } from "@/lib/repository";

export default function LedgerPage() {
  return <LedgerClient repo={getWealthRepository()} />;
}
