import type { LedgerTransactionType, WealthAccount, WealthInstrument } from "@/types/domain";

export const csvTemplateHeaders = [
  "trade_at",
  "account",
  "instrument_symbol",
  "instrument_name",
  "transaction_type",
  "quantity",
  "price",
  "gross_amount",
  "fee_amount",
  "tax_amount",
  "currency",
  "fx_rate_to_base",
  "reference_no",
  "notes"
];

export type CsvMapping = Record<string, string>;

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

export interface ValidatedImportRow {
  index: number;
  row: Record<string, string>;
  errors: string[];
  duplicate: boolean;
  fingerprint: string;
  normalized?: {
    tradeAt: string;
    accountName: string;
    instrumentSymbol?: string;
    instrumentName?: string;
    transactionType: LedgerTransactionType;
    quantity: number;
    price: number;
    grossAmount: number;
    feeAmount: number;
    taxAmount: number;
    currency: "CNY" | "USD" | "HKD";
    fxRateToBase: number;
    referenceNo?: string;
    notes?: string;
  };
}

const allowedTypes: LedgerTransactionType[] = [
  "buy",
  "sell",
  "subscribe",
  "redeem",
  "dividend",
  "interest",
  "transfer_in",
  "transfer_out",
  "fx_exchange",
  "fee",
  "adjustment",
  "valuation_update"
];

export function parseCsv(text: string): ParsedCsv {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length > 0);
  const [headerLine, ...body] = lines;
  const headers = splitCsvLine(headerLine ?? "").map((item) => item.trim());
  return {
    headers,
    rows: body.map((line) => {
      const cells = splitCsvLine(line);
      return Object.fromEntries(headers.map((header, index) => [header, cells[index]?.trim() ?? ""]));
    })
  };
}

export function defaultMapping(headers: string[]): CsvMapping {
  return Object.fromEntries(csvTemplateHeaders.map((field) => [field, headers.includes(field) ? field : ""]));
}

export function validateImportRows(input: {
  rows: Record<string, string>[];
  mapping: CsvMapping;
  accounts: WealthAccount[];
  instruments: WealthInstrument[];
  existingFingerprints?: Set<string>;
  autoCreateAccounts?: boolean;
  autoCreateInstruments?: boolean;
}): ValidatedImportRow[] {
  const seen = new Set<string>(input.existingFingerprints ?? []);
  return input.rows.map((row, index) => {
    const get = (field: string) => row[input.mapping[field] ?? ""]?.trim() ?? "";
    const errors: string[] = [];
    const tradeAt = get("trade_at");
    const accountName = get("account");
    const instrumentSymbol = get("instrument_symbol");
    const instrumentName = get("instrument_name");
    const transactionType = get("transaction_type") as LedgerTransactionType;
    const quantity = numberOrZero(get("quantity"));
    const price = numberOrZero(get("price"));
    const grossAmount = numberOrZero(get("gross_amount"));
    const feeAmount = numberOrZero(get("fee_amount"));
    const taxAmount = numberOrZero(get("tax_amount"));
    const currency = get("currency") || "CNY";
    const fxRateToBase = numberOrZero(get("fx_rate_to_base") || "1");
    const referenceNo = get("reference_no");
    const notes = get("notes");

    if (!tradeAt || Number.isNaN(Date.parse(tradeAt))) errors.push("交易日期无效");
    if (!accountName) errors.push("账户必填");
    if (!input.autoCreateAccounts && !input.accounts.some((account) => account.name === accountName || account.id === accountName)) errors.push("账户不存在");
    if (!allowedTypes.includes(transactionType)) errors.push("交易类型无效");
    if (!["CNY", "USD", "HKD"].includes(currency)) errors.push("币种无效");
    if (["buy", "sell", "subscribe", "redeem", "transfer_in", "transfer_out"].includes(transactionType) && quantity <= 0) errors.push("数量必须大于 0");
    if (["buy", "sell", "subscribe", "redeem"].includes(transactionType) && !instrumentSymbol) errors.push("标的代码必填");
    if (instrumentSymbol && !input.autoCreateInstruments && !input.instruments.some((item) => item.symbol === instrumentSymbol)) errors.push("标的不存在");
    if (grossAmount < 0 || feeAmount < 0 || taxAmount < 0 || fxRateToBase <= 0) errors.push("金额、费用、汇率格式无效");

    const fingerprint = [accountName, tradeAt, instrumentSymbol, transactionType, quantity, grossAmount, referenceNo].join("|");
    const duplicate = seen.has(fingerprint);
    seen.add(fingerprint);

    return {
      index,
      row,
      errors,
      duplicate,
      fingerprint,
      normalized:
        errors.length > 0
          ? undefined
          : {
              tradeAt,
              accountName,
              instrumentSymbol,
              instrumentName,
              transactionType,
              quantity,
              price,
              grossAmount,
              feeAmount,
              taxAmount,
              currency: currency as "CNY" | "USD" | "HKD",
              fxRateToBase,
              referenceNo,
              notes
            }
    };
  });
}

export function buildCsvTemplate() {
  return `${csvTemplateHeaders.join(",")}\n2026-06-30,汇丰 Trade25,QQQM,Invesco NASDAQ 100 ETF,buy,10,220,2200,1,0,USD,7.18,DEMO-001,通用模板示例\n`;
}

function splitCsvLine(line: string) {
  const result: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function numberOrZero(value: string) {
  if (!value) return 0;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}
