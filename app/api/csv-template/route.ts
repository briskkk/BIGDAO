import { buildCsvTemplate } from "@/lib/csv/transaction-importer";

export function GET() {
  return new Response(buildCsvTemplate(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=family-wealth-transactions-template.csv"
    }
  });
}
